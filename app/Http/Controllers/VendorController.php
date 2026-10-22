<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

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

        $vendor->delete();

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
            'method' => 'required|string|max:50',
            'note' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($vendor, $data, $openingLeft, $unpaid) {
            $left = (float) $data['amount'];

            $toOpening = min($left, $openingLeft);
            if ($toOpening > 0) {
                $vendor->payments()->create([
                    'amount' => $toOpening,
                    'date' => $data['date'],
                    'method' => $data['method'],
                    'note' => $data['note'] ?? null,
                ]);
                $left = round($left - $toOpening, 2);
            }

            foreach ($unpaid as $p) {
                if ($left <= 0) { break; }

                $part = min($left, $p->balance());
                $p->payments()->create([
                    'amount' => $part,
                    'date' => $data['date'],
                    'method' => $data['method'],
                ]);
                $left = round($left - $part, 2);
            }
        });

        return response()->json(['ok' => true]);
    }
}