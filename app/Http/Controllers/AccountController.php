<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\AccountTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AccountController extends Controller
{
    private function fail(string $message, string $field = 'amount')
    {
        return response()->json(['message' => $message, 'errors' => [$field => [$message]]], 422);
    }

    private function signed($t): float
    {
        return $t->direction === 'in' ? (float) $t->amount : -(float) $t->amount;
    }

    // Pichhle 30 din ka din ba din balance (card ke chhote graph ke liye)
    private function sparkline(Account $a): array
    {
        $start = now()->subDays(29)->toDateString();

        $running = (float) $a->opening
            + (float) $a->transactions()->where('date', '<', $start)->where('direction', 'in')->sum('amount')
            - (float) $a->transactions()->where('date', '<', $start)->where('direction', 'out')->sum('amount');

        $byDay = [];
        foreach ($a->transactions()->where('date', '>=', $start)->get(['date', 'direction', 'amount']) as $t) {
            $byDay[$t->date] = ($byDay[$t->date] ?? 0) + $this->signed($t);
        }

        $points = [];
        for ($i = 29; $i >= 0; $i--) {
            $running += $byDay[now()->subDays($i)->toDateString()] ?? 0;
            $points[] = round($running, 2);
        }

        return $points;
    }

    private function card(Account $a): array
    {
        $today = now()->toDateString();

        return [
            'id' => $a->id,
            'name' => $a->name,
            'type' => $a->type,
            'bank_name' => $a->bank_name,
            'account_title' => $a->account_title,
            'last4' => $a->last4,
            'opening' => $a->opening,
            'note' => $a->note ?? '',
            'active' => $a->active,
            'is_system' => $a->is_system,
            'balance' => $a->balance(),
            'today_in' => round((float) $a->transactions()->where('date', $today)->where('direction', 'in')->sum('amount'), 2),
            'today_out' => round((float) $a->transactions()->where('date', $today)->where('direction', 'out')->sum('amount'), 2),
            'spark' => $this->sparkline($a),
        ];
    }

    // Statement: opening, har entry ke saath us waqt ka baqi, aur closing
    private function statement(Account $account, ?string $from, ?string $to): array
    {
        $all = $account->transactions()->orderBy('date')->orderBy('id')->get();
        $names = User::whereIn('id', $all->pluck('created_by')->filter()->unique())->pluck('name', 'id');

        $running = (float) $account->opening;
        $opening = $running;
        $in = 0.0;
        $out = 0.0;
        $rows = [];

        foreach ($all as $t) {
            if ($to && $t->date > $to) {
                break;
            }

            $running = round($running + $this->signed($t), 2);

            if ($from && $t->date < $from) {
                $opening = $running;
                continue;
            }

            if ($t->direction === 'in') {
                $in += $t->amount;
            } else {
                $out += $t->amount;
            }

            $rows[] = [
                'id' => $t->id,
                'date' => $t->date,
                'direction' => $t->direction,
                'kind' => $t->kind,
                'amount' => $t->amount,
                'method' => $t->method ?? '',
                'reference' => $t->reference ?? '',
                'note' => $t->note ?? '',
                'by' => $t->created_by ? ($names[$t->created_by] ?? '') : '',
                'balance' => $running,
                'deletable' => in_array($t->kind, ['deposit', 'withdraw'], true),
            ];
        }

        return [
            'opening' => round($opening, 2),
            'closing' => round($running, 2),
            'in' => round($in, 2),
            'out' => round($out, 2),
            'rows' => $rows,
        ];
    }

    private function data(Account $account, Request $request)
    {
        $v = $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
        ]);

        return response()->json([
            'account' => $this->card($account),
            'statement' => $this->statement($account, $v['from'] ?? null, $v['to'] ?? null),
        ]);
    }

        // Payment popups ke "Received in" dropdown ke liye (balance nahi bheja jata)
        public function options()
        {
            return response()->json(
                Account::where('active', true)
                    ->orderByRaw("type = 'cash' desc")
                    ->orderBy('name')
                    ->get(['id', 'name', 'type', 'bank_name', 'last4'])
            );
        }
    // ---------- Cash ----------
    public function cash(Request $request)
    {
        return $this->data(Account::cash(), $request);
    }

    public function cashOpening(Request $request)
    {
        $cash = Account::cash();

        $data = $request->validate([
            'opening' => 'required|numeric|min:0|max:100000000000',
        ], [
            'opening.required' => 'Enter the cash you have in hand.',
            'opening.min' => 'Opening cash cannot be negative.',
        ]);

        $newBalance = round($cash->balance() - $cash->opening + (float) $data['opening'], 2);

        if ($newBalance < 0) {
            return $this->fail('With this opening amount the cash balance would go below 0.', 'opening');
        }

        $cash->update(['opening' => $data['opening']]);

        return response()->json(['ok' => true]);
    }


        // Gin kar likha hua asal cash. Farq ki aik adjustment entry ban jati hai
        public function cashAdjust(Request $request)
        {
            $data = $request->validate([
                'actual' => 'required|numeric|min:0|max:100000000000',
            ], [
                'actual.required' => 'Enter the cash you counted.',
                'actual.min' => 'Cash cannot be negative.',
            ]);
    
            return DB::transaction(function () use ($data) {
                $cash = Account::whereKey(Account::cash()->id)->lockForUpdate()->first();
                $diff = round((float) $data['actual'] - $cash->balance(), 2);
    
                if ($diff == 0) {
                    return response()->json(['diff' => 0]);
                }
    
                AccountTransaction::create([
                    'account_id' => $cash->id,
                    'date' => now()->toDateString(),
                    'direction' => $diff > 0 ? 'in' : 'out',
                    'amount' => abs($diff),
                    'kind' => 'adjustment',
                    'note' => 'Cash counted: ' . number_format((float) $data['actual'], 2),
                    'created_by' => auth()->id(),
                ]);
    
                return response()->json(['diff' => $diff]);
            });
        }
        
    // ---------- Banks ----------
    private function bankRules(?int $ignoreId = null, bool $update = false): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:80', Rule::unique('accounts', 'name')->ignore($ignoreId)],
            'bank_name' => 'required|string|max:80',
            'account_title' => 'nullable|string|max:80',
            'last4' => ['nullable', 'regex:/^\d{4}$/'],
            'opening' => ($update ? 'sometimes|' : '') . 'required|numeric|min:0|max:100000000000',
            'note' => 'nullable|string|max:150',
        ];
    }

    private function bankMessages(): array
    {
        return [
            'name.required' => 'Enter a name for this account.',
            'name.unique' => 'An account with this name already exists.',
            'bank_name.required' => 'Enter the bank name.',
            'last4.regex' => 'Enter exactly 4 digits.',
            'opening.required' => 'Enter the opening balance (0 if none).',
            'opening.min' => 'Opening balance cannot be negative.',
        ];
    }

    public function banks()
    {
        $list = Account::where('type', 'bank')->orderByDesc('active')->orderBy('name')->get()
            ->map(function ($a) { return $this->card($a); })
            ->values();

        return response()->json([
            'banks' => $list,
            'total' => round($list->where('active', true)->sum('balance'), 2),
        ]);
    }

    public function storeBank(Request $request)
    {
        $data = $request->validate($this->bankRules(), $this->bankMessages());

        $account = Account::create($data + ['type' => 'bank', 'created_by' => auth()->id()]);

        return response()->json(['id' => $account->id]);
    }

    public function updateBank(Request $request, Account $account)
    {
        abort_unless($account->type === 'bank', 404);

        $data = $request->validate(
            $this->bankRules($account->id, true) + ['active' => 'sometimes|boolean'],
            $this->bankMessages()
        );

        if (isset($data['opening'])) {
            $newBalance = round($account->balance() - $account->opening + (float) $data['opening'], 2);

            if ($newBalance < 0) {
                return $this->fail('With this opening balance the account would go below 0.', 'opening');
            }
        }

        if (array_key_exists('active', $data) && !$data['active'] && $account->balance() != 0) {
            return $this->fail('Move the remaining money out of this account before making it inactive.', 'active');
        }

        $account->update($data);

        return response()->json(['ok' => true]);
    }

    public function bankData(Request $request, Account $account)
    {
        abort_unless($account->type === 'bank', 404);

        return $this->data($account, $request);
    }

    // ---------- Paisa daalna / nikalna (Cash aur Bank dono) ----------
    public function entry(Request $request, Account $account)
    {
        if (!$account->active) {
            return $this->fail('This account is inactive.');
        }

        $data = $request->validate([
            'direction' => 'required|in:in,out',
            'amount' => 'required|numeric|gt:0|max:100000000',
            'date' => 'required|date|before_or_equal:today',
            'reference' => 'nullable|string|max:60',
            'note' => 'nullable|string|max:150',
        ], [
            'amount.gt' => 'Amount must be more than 0.',
            'date.before_or_equal' => 'Date cannot be in the future.',
        ]);

        $amount = round((float) $data['amount'], 2);

        return DB::transaction(function () use ($account, $data, $amount) {
            // Do log aik hi waqt par nikalein to balance galat na ho
            $locked = Account::whereKey($account->id)->lockForUpdate()->first();

            if ($data['direction'] === 'out' && $amount > $locked->balance()) {
                return $this->fail('Not enough money in ' . $locked->name . '. Available: ' . number_format($locked->balance(), 2) . '.');
            }

            $t = AccountTransaction::create([
                'account_id' => $locked->id,
                'date' => $data['date'],
                'direction' => $data['direction'],
                'amount' => $amount,
                'kind' => $data['direction'] === 'in' ? 'deposit' : 'withdraw',
                'method' => $locked->type === 'cash' ? 'Cash' : 'Bank',
                'reference' => $data['reference'] ?? null,
                'note' => $data['note'] ?? null,
                'created_by' => auth()->id(),
            ]);

            return response()->json(['id' => $t->id, 'balance' => $locked->balance()]);
        });
    }

    // Sirf haath se daali hui entry delete hoti hai. Payment wali entry payment se hi badlegi
    public function destroyEntry(AccountTransaction $entry)
    {
        if (!in_array($entry->kind, ['deposit', 'withdraw'], true)) {
            return $this->fail('This entry belongs to a payment. Change it from the payment itself.', 'entry');
        }

        return DB::transaction(function () use ($entry) {
            $account = Account::whereKey($entry->account_id)->lockForUpdate()->first();

            if ($entry->direction === 'in' && $entry->amount > $account->balance()) {
                return $this->fail('This money has already been spent. Deleting it would take ' . $account->name . ' below 0.', 'entry');
            }

            $entry->delete();

            return response()->json(['ok' => true]);
        });
    }
}