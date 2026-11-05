<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Expense;
use App\Services\AccountLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ExpenseController extends Controller
{
    private function rules(): array
    {
        return [
            'title' => 'required|string|min:2|max:60',
            'amount' => 'required|numeric|gt:0|max:100000000',
            'date' => 'required|date|before_or_equal:today',
            'category' => 'required|string|max:50',
            'note' => 'nullable|string|max:100',
            'account_id' => ['required', Rule::exists('accounts', 'id')->where('active', true)],
            'reference' => 'nullable|string|max:60',
        ];
    }

    private function messages(): array
    {
        return [
            'account_id.required' => 'Choose which account the money is paid from.',
            'account_id.exists' => 'This account is not available.',
        ];
    }

    // Expense ki entry account mein likhta hai
    private function post(Expense $expense, Account $account): void
    {
        AccountLedger::post(
            $account,
            'out',
            (float) $expense->amount,
            (string) $expense->date,
            'expense',
            'expense',
            $expense->id,
            $expense->method,
            $expense->reference,
            $expense->title . ($expense->note ? ' - ' . $expense->note : '')
        );
    }

    public function index()
    {
        $expenses = Expense::with('account')->orderBy('id')->get()->map(function ($e) {
            return [
                'id' => $e->id,
                'title' => $e->title,
                'amount' => $e->amount,
                'date' => $e->date,
                'category' => $e->category,
                'method' => $e->method,
                'note' => $e->note ?? '',
                'reference' => $e->reference ?? '',
                'account_id' => $e->account_id,
                'account' => $e->account ? $e->account->name : '',
            ];
        });

        return response()->json($expenses);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules(), $this->messages());

        $account = Account::findOrFail($data['account_id']);
        $data['method'] = $account->type === 'cash' ? 'Cash' : 'Bank';

        $expense = DB::transaction(function () use ($data, $account) {
            $expense = Expense::create($data);
            $expense->forceFill(['created_by' => auth()->id()])->save();

            $this->post($expense, $account);

            return $expense;
        });

        return response()->json(['id' => $expense->id]);
    }

    public function update(Request $request, Expense $expense)
    {
        $data = $request->validate($this->rules(), $this->messages());

        $account = Account::findOrFail($data['account_id']);
        $data['method'] = $account->type === 'cash' ? 'Cash' : 'Bank';

        DB::transaction(function () use ($expense, $data, $account) {
            // Purani entry hatao, nayi likho. Paisa kam ho to sab wapas ho jata hai
            AccountLedger::forget('expense', $expense->id);

            $expense->update($data);

            $this->post($expense, $account);
        });

        return response()->json(['ok' => true]);
    }

    public function destroy(Expense $expense)
    {
        DB::transaction(function () use ($expense) {
            AccountLedger::forget('expense', $expense->id);
            $expense->delete();
        });

        return response()->json(['ok' => true]);
    }
}