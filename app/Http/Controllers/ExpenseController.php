<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Expense;

class ExpenseController extends Controller
{
    private function rules(): array
{
    return [
        'title' => 'required|string|min:2|max:60',
        'amount' => 'required|numeric|gt:0|max:100000000',
        'date' => 'required|date|before_or_equal:today',
        'category' => 'required|string|max:50',
        'method' => 'required|string|max:50',
        'note' => 'nullable|string|max:100',
    ];
}

public function index()
{
    $expenses = Expense::orderBy('id')->get()->map(function ($e) {
        return [
            'id' => $e->id,
            'title' => $e->title,
            'amount' => $e->amount,
            'date' => $e->date,
            'category' => $e->category,
            'method' => $e->method,
            'note' => $e->note ?? '',
        ];
    });

    return response()->json($expenses);
}

public function store(Request $request)
{
    $expense = Expense::create($request->validate($this->rules()));

    return response()->json(['id' => $expense->id]);
}

public function update(Request $request, Expense $expense)
{
    $expense->update($request->validate($this->rules()));

    return response()->json(['ok' => true]);
}

public function destroy(Expense $expense)
{
    $expense->delete();

    return response()->json(['ok' => true]);
}
}
