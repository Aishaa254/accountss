<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\AccountTransaction;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
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
            'account_number' => $a->account_number,
            'created' => $a->created_at ? $a->created_at->toDateString() : null,
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

        $expenseCats = Expense::whereIn('id', $all->where('source_type', 'expense')->pluck('source_id')->filter()->unique())
            ->pluck('category', 'id');

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
                'source' => $t->source_type ?? '',
                'category' => $t->source_type === 'expense' ? ($expenseCats[$t->source_id] ?? '') : '',
                'by' => $t->created_by ? ($names[$t->created_by] ?? '') : '',
                'balance' => $running,
                'deletable' => in_array($t->kind, ['deposit', 'withdraw', 'transfer'], true),
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
        $payload = $this->data(Account::cash(), $request)->getData(true);
        $payload['rules'] = ['add_only_when_empty' => $this->addOnlyWhenEmpty()];

        return response()->json($payload);
    }

    // Rule: "Add Money" sirf tab jab cash 0 ho. Cash page ka switch isay on/off karta hai (default: on)
    // Sirf settings table ke key aur value columns use hote hain, baqi columns se farq nahi parta
    private function addOnlyWhenEmpty(): bool
    {
        try {
            if (!Schema::hasTable('settings')) {
                return true;
            }

            $value = DB::table('settings')->where('key', 'cash_add_only_when_empty')->value('value');

            return ($value ?? '1') === '1';
        } catch (\Throwable $e) {
            // Koi bhi masla ho to cash page chalta rahe, rule ON maana jata hai
            return true;
        }
    }

    public function cashRule(Request $request)
    {
        $data = $request->validate(['add_only_when_empty' => 'required|boolean']);

        try {
            // Table na ho to yahin khud ban jati hai, migrate chalane ki zaroorat nahi
            if (!Schema::hasTable('settings')) {
                Schema::create('settings', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->id();
                    $table->string('key')->unique();
                    $table->text('value')->nullable();
                    $table->timestamps();
                });
            }

            $value = $data['add_only_when_empty'] ? '1' : '0';
            $exists = DB::table('settings')->where('key', 'cash_add_only_when_empty')->exists();

            if ($exists) {
                DB::table('settings')->where('key', 'cash_add_only_when_empty')->update(['value' => $value]);
            } else {
                DB::table('settings')->insert(['key' => 'cash_add_only_when_empty', 'value' => $value]);
            }
        } catch (\Throwable $e) {
            report($e);

            // Asli wajah screen par dikhao taake pata chale settings table mein kya kam hai
            return $this->fail('Could not save: ' . $e->getMessage(), 'add_only_when_empty');
        }

        return response()->json(['add_only_when_empty' => $this->addOnlyWhenEmpty()]);
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
    // ---------- Bank se Cash / Cash se Bank ----------
    public function transfer(Request $request)
    {
        $data = $request->validate([
            'direction' => 'required|in:to_bank,to_cash',
            'bank_id' => 'required|integer|exists:accounts,id',
            'amount' => 'required|numeric|gt:0|max:100000000',
            'date' => 'required|date|before_or_equal:today',
            'note' => 'nullable|string|max:150',
        ], [
            'bank_id.required' => 'Choose a bank account.',
            'amount.gt' => 'Amount must be more than 0.',
            'date.before_or_equal' => 'Date cannot be in the future.',
        ]);

        $bank = Account::find($data['bank_id']);

        if (!$bank || $bank->type !== 'bank') {
            return $this->fail('Choose a bank account.', 'bank_id');
        }

        if (!$bank->active) {
            return $this->fail('This bank account is inactive.', 'bank_id');
        }

        $amount = round((float) $data['amount'], 2);
        $note = trim((string) ($data['note'] ?? ''));

        return DB::transaction(function () use ($data, $bank, $amount, $note) {
            $cashId = Account::cash()->id;

            // Dono accounts hamesha ek hi tarteeb mein lock hote hain, taake do log aik sath karein to atak na jaye
            $locked = Account::whereIn('id', [$cashId, $bank->id])
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $cash = $locked[$cashId];
            $bankLocked = $locked[$bank->id];

            $from = $data['direction'] === 'to_bank' ? $cash : $bankLocked;
            $to = $data['direction'] === 'to_bank' ? $bankLocked : $cash;

            if ($amount > $from->balance()) {
                return $this->fail('Not enough money in ' . $from->name . '. Available: ' . number_format($from->balance(), 2) . '.');
            }

            $key = (string) Str::uuid();

            $common = [
                'date' => $data['date'],
                'amount' => $amount,
                'kind' => 'transfer',
                'transfer_key' => $key,
                'created_by' => auth()->id(),
            ];

            AccountTransaction::create($common + [
                'account_id' => $from->id,
                'direction' => 'out',
                'note' => Str::limit('To ' . $to->name . ($note !== '' ? ' - ' . $note : ''), 150, ''),
            ]);

            AccountTransaction::create($common + [
                'account_id' => $to->id,
                'direction' => 'in',
                'note' => Str::limit('From ' . $from->name . ($note !== '' ? ' - ' . $note : ''), 150, ''),
            ]);

            return response()->json(['ok' => true, 'balance' => $cash->balance()]);
        });
    }

    // Transfer galti se ho jaye to dono entries aik sath hat jati hain
    private function undoTransfer(AccountTransaction $entry)
    {
        return DB::transaction(function () use ($entry) {
            $legs = AccountTransaction::where('transfer_key', $entry->transfer_key)->get();

            $accounts = Account::whereIn('id', $legs->pluck('account_id')->unique())
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($legs as $leg) {
                $acc = $accounts[$leg->account_id];

                if ($leg->direction === 'in' && $leg->amount > $acc->balance()) {
                    return $this->fail('This money has already been spent. Undoing the transfer would take ' . $acc->name . ' below 0.', 'entry');
                }
            }

            AccountTransaction::where('transfer_key', $entry->transfer_key)->delete();

            return response()->json(['ok' => true]);
        });
    }

    private function bankRules(bool $update = false): array
    {
        return [
            'account_title' => 'required|string|min:2|max:80',
            'bank_name' => 'required|string|min:2|max:80',
            'account_number' => ['required', 'regex:/^\d{6,24}$/'],
            'opening' => ($update ? 'sometimes|' : '') . 'required|numeric|min:0|max:100000000000',
            'note' => 'nullable|string|max:150',
        ];
    }

    private function bankMessages(): array
    {
        return [
            'account_title.required' => 'Enter the account holder name.',
            'account_title.min' => 'Enter the full account holder name.',
            'bank_name.required' => 'Choose the bank.',
            'account_number.required' => 'Enter the account number.',
            'account_number.regex' => 'Account number must be 6 to 24 digits (numbers only).',
            'opening.required' => 'Enter the opening balance (0 if none).',
            'opening.min' => 'Opening balance cannot be negative.',
        ];
    }

    // Same bank + same account number dobara add nahi hoga
    private function bankExists(string $bank, string $number, ?int $ignoreId = null): bool
    {
        return Account::where('type', 'bank')
            ->where('bank_name', $bank)
            ->where('account_number', $number)
            ->when($ignoreId, function ($q) use ($ignoreId) {
                $q->where('id', '!=', $ignoreId);
            })
            ->exists();
    }

    // "Account name" ab form mein nahi hai. Bank + holder se khud banta hai (cards, popups aur dropdown mein yahi dikhta hai)
    private function bankLabel(string $bank, string $holder, string $number, ?int $ignoreId = null): string
    {
        $taken = function (string $n) use ($ignoreId) {
            return Account::where('name', $n)
                ->when($ignoreId, function ($q) use ($ignoreId) {
                    $q->where('id', '!=', $ignoreId);
                })
                ->exists();
        };

        $base = Str::limit($bank . ' - ' . $holder, 70, '');
        $name = $base;

        if ($taken($name)) {
            $name = $base . ' (' . substr($number, -4) . ')';
        }

        $i = 2;
        while ($taken($name)) {
            $name = $base . ' (' . substr($number, -4) . ') ' . $i++;
        }

        return $name;
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

        if ($this->bankExists($data['bank_name'], $data['account_number'])) {
            return $this->fail('This bank account is already added.', 'account_number');
        }

        $account = Account::create($data + [
            'name' => $this->bankLabel($data['bank_name'], $data['account_title'], $data['account_number']),
            'last4' => substr($data['account_number'], -4),
            'type' => 'bank',
            'created_by' => auth()->id(),
        ]);

        return response()->json(['id' => $account->id]);
    }

    public function updateBank(Request $request, Account $account)
    {
        abort_unless($account->type === 'bank', 404);

        $data = $request->validate($this->bankRules(true), $this->bankMessages());

        if ($this->bankExists($data['bank_name'], $data['account_number'], $account->id)) {
            return $this->fail('This bank account is already added.', 'account_number');
        }

        if (isset($data['opening'])) {
            $newBalance = round($account->balance() - $account->opening + (float) $data['opening'], 2);

            if ($newBalance < 0) {
                return $this->fail('With this opening balance the account would go below 0.', 'opening');
            }
        }

        $account->update($data + [
            'name' => $this->bankLabel($data['bank_name'], $data['account_title'], $data['account_number'], $account->id),
            'last4' => substr($data['account_number'], -4),
        ]);

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

            if ($data['direction'] === 'in' && $locked->type === 'cash' && $this->addOnlyWhenEmpty() && $locked->balance() > 0) {
                return $this->fail('Cash is not empty. Add Money works only when cash is 0. You can change this rule on the Cash page.');
            }

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
        if ($entry->kind === 'transfer' && $entry->transfer_key) {
            return $this->undoTransfer($entry);
        }

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