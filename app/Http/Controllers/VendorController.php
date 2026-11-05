<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\Account;
use App\Services\AccountLedger;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class VendorController extends Controller
{
    public function index()
    {
        $vendors = Vendor::with(['payments', 'purchases.items', 'purchases.payments'])->orderBy('id')->get()->map(function ($v) {
            $vendorPaid = round((float) $v->payments->sum('amount'), 2);
            $openingLeft = max(round($v->opening - $vendorPaid, 2), 0);

            $purchasesPaid = 0;
            $purchasesBalance = 0;
            $dueIn = null;
            $history = [];
            $purchaseRows = [];

            foreach ($v->purchases as $p) {
                $total = $p->total();
                $paid = $p->paidAmount();
                $balance = $p->balance();

                $purchasesPaid += $paid;
                $purchasesBalance += $balance;

                if ($balance > 0) {
                    $days = (int) now()->startOfDay()->diffInDays(Carbon::parse($p->due)->startOfDay(), false);
                    $dueIn = $dueIn === null ? $days : min($dueIn, $days);
                }

                $purchaseRows[] = [
                    'no' => $p->no,
                    'date' => $p->date,
                    'amount' => $total,
                    'status' => $balance <= 0 ? 'Paid' : ($paid > 0 ? 'Partial' : 'Unpaid'),
                ];

                foreach ($p->payments as $x) {
                    $history[] = ['date' => $x->date, 'amount' => $x->amount, 'method' => $x->method, 'note' => $p->no];
                }
            }

            foreach ($v->payments as $x) {
                $history[] = ['date' => $x->date, 'amount' => $x->amount, 'method' => $x->method, 'note' => $x->note ?? ''];
            }

            usort($history, function ($a, $b) { return strcmp($b['date'], $a['date']); });
            usort($purchaseRows, function ($a, $b) { return strcmp($b['date'], $a['date']); });

            return [
                'id' => $v->id,
                'name' => $v->name,
                'company' => $v->company ?? '',
                'category' => $v->category,
                'phone' => $v->phone,
                'email' => $v->email ?? '',
                'city' => $v->city ?? '',
                'address' => $v->address ?? '',
                'notes' => $v->notes ?? '',
                'status' => $v->status,
                'terms' => $v->terms,
                'balance' => round($openingLeft + $purchasesBalance, 2),
                'paid' => round($vendorPaid + $purchasesPaid, 2),
                'dueIn' => $dueIn,
                'pinned' => $v->pinned,
                'createdAgo' => (int) $v->created_at->diffInDays(now()),
                'history' => $history,
                'purchases' => array_slice($purchaseRows, 0, 5),
            ];
        });

        return response()->json($vendors);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'category' => 'required|string|max:100',
            'phone' => 'required|string|max:50',
            'email' => 'nullable|email',
            'city' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'terms' => 'required|integer|min:0|max:365',
            'balance' => 'nullable|numeric|min:0',
        ]);

        $data['opening'] = $data['balance'] ?? 0;
        unset($data['balance']);

        $vendor = Vendor::create($data);

        return response()->json(['id' => $vendor->id]);
    }

    public function update(Request $request, Vendor $vendor)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'company' => 'nullable|string|max:255',
            'category' => 'sometimes|required|string|max:100',
            'phone' => 'sometimes|required|string|max:50',
            'email' => 'nullable|email',
            'city' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
            'terms' => 'sometimes|integer|min:0|max:365',
            'pinned' => 'sometimes|boolean',
        ]);

        $vendor->update($data);

        return response()->json(['ok' => true]);
    }
    public function destroy(Vendor $vendor)
    {
        if ($vendor->purchases()->exists()) {
            return response()->json(['message' => 'Vendors with purchases cannot be deleted'], 422);
        }

        DB::transaction(function () use ($vendor) {
            foreach ($vendor->payments()->pluck('id') as $id) {
                AccountLedger::forget('vendor_payment', $id);
            }

            $vendor->delete();
        });

        return response()->json(['ok' => true]);
    }
    public function pay(Request $request, Vendor $vendor)
    {
        $vendor->load(['payments', 'purchases.items', 'purchases.payments']);

        $openingLeft = max(round($vendor->opening - (float) $vendor->payments->sum('amount'), 2), 0);

        $unpaid = $vendor->purchases
            ->sortBy([['due', 'asc'], ['id', 'asc']])
            ->filter(function ($p) { return $p->balance() > 0; });

        $payable = round($openingLeft + $unpaid->sum(function ($p) { return $p->balance(); }), 2);

        $data = $request->validate([
            'amount' => 'required|numeric|gt:0|lte:' . $payable,
            'date' => 'required|date|before_or_equal:today',
            'note' => 'nullable|string|max:255',
            'account_id' => ['required', Rule::exists('accounts', 'id')->where('active', true)],
            'reference' => 'nullable|string|max:60',
        ], [
            'account_id.required' => 'Choose which account the money is paid from.',
            'account_id.exists' => 'This account is not available.',
        ]);

        $account = Account::findOrFail($data['account_id']);
        $method = $account->type === 'cash' ? 'Cash' : 'Bank';

        if ((float) $data['amount'] > $account->balance()) {
            throw ValidationException::withMessages([
                'account_id' => 'Not enough money in ' . $account->name . '. Available: ' . number_format($account->balance(), 2) . '.',
            ]);
        }

        DB::transaction(function () use ($vendor, $data, $openingLeft, $unpaid, $account, $method) {
            $left = (float) $data['amount'];
            $ref = $data['reference'] ?? null;

            $toOpening = min($left, $openingLeft);
            if ($toOpening > 0) {
                $payment = $vendor->payments()->create([
                    'amount' => $toOpening,
                    'date' => $data['date'],
                    'method' => $method,
                    'note' => $data['note'] ?? null,
                    'account_id' => $account->id,
                    'reference' => $ref,
                ]);
                $payment->forceFill(['created_by' => auth()->id()])->save();

                AccountLedger::post(
                    $account, 'out', (float) $toOpening, $data['date'], 'payment_out', 'vendor_payment', $payment->id,
                    $method, $ref,
                    'Paid ' . $vendor->name . ' (opening balance)' . (!empty($data['note']) ? ' - ' . $data['note'] : '')
                );

                $left = round($left - $toOpening, 2);
            }

            foreach ($unpaid as $p) {
                if ($left <= 0) { break; }

                $part = min($left, $p->balance());

                $payment = $p->payments()->create([
                    'amount' => $part,
                    'date' => $data['date'],
                    'method' => $method,
                    'account_id' => $account->id,
                    'reference' => $ref,
                ]);
                $payment->forceFill(['created_by' => auth()->id()])->save();

                AccountLedger::post(
                    $account, 'out', (float) $part, $data['date'], 'payment_out', 'purchase_payment', $payment->id,
                    $method, $ref,
                    'Paid ' . $p->no . ' to ' . $vendor->name
                );

                $left = round($left - $part, 2);
            }
        });


        return response()->json(['ok' => true]);
    }
}