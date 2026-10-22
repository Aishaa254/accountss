<?php

namespace App\Http\Controllers;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index()
{
    $invoices = Invoice::with(['items', 'customer' , 'payments'])->orderByDesc('id')->get()->map(function ($inv) {
        return [
            'no' => $inv->no,
            'customer' => $inv->customer->name,
            'date' => $inv->date,
            'due' => $inv->due,
            'items' => $inv->items->map(function ($i) {
                return ['name' => $i->name, 'qty' => $i->qty, 'price' => $i->price];
            })->values(),
            'discount' => $inv->discount,
            'tax' => $inv->tax,
            'paid' => $inv->paidAmount(),
        ];
    });

    return response()->json($invoices);
}

public function store(Request $request)
{
    $data = $request->validate([
        'customer_id' => 'required|exists:customers,id',
        'due' => 'required|date|after_or_equal:today',
        'discount' => 'nullable|numeric|min:0',
        'tax' => 'nullable|numeric|min:0|max:100',
        'items' => 'required|array|min:1',
        'items.*.name' => 'required|string|max:255',
        'items.*.qty' => 'required|numeric|gt:0',
        'items.*.price' => 'required|numeric|gt:0',
    ], [
        'customer_id.required' => 'Select a customer.',
        'customer_id.exists' => 'This customer does not exist.',
        'due.required' => 'Choose the due date.',
        'due.after_or_equal' => 'Due date cannot be before today.',
        'tax.max' => 'Tax cannot be more than 100%.',
        'items.required' => 'Add at least one item.',
        'items.min' => 'Add at least one item.',
        'items.*.name.required' => 'Every item needs a name.',
        'items.*.qty.gt' => 'Quantity must be more than 0.',
        'items.*.price.gt' => 'Price must be more than 0.',
    ]);

    // Discount subtotal se zyada na ho
    $subtotal = collect($data['items'])->sum(function ($i) { return $i['qty'] * $i['price']; });

    if (($data['discount'] ?? 0) > $subtotal) {
        return response()->json([
            'message' => 'Discount cannot be more than the subtotal.',
            'errors' => ['discount' => ['Discount cannot be more than the subtotal.']],
        ], 422);
    }

    $invoice = DB::transaction(function () use ($data) {
        $next = (Invoice::max('id') ?? 0) + 1;

        $invoice = Invoice::create([
            'no' => 'INV-' . str_pad($next, 4, '0', STR_PAD_LEFT),
            'customer_id' => $data['customer_id'],
            'date' => now()->toDateString(),
            'due' => $data['due'],
            'discount' => $data['discount'] ?? 0,
            'tax' => $data['tax'] ?? 0,
        ]);

        $invoice->items()->createMany($data['items']);

        return $invoice;
    });

    return response()->json(['no' => $invoice->no]);
}

public function pay(Request $request, Invoice $invoice)
{
    $invoice->load(['items', 'payments']);

    $balance = $invoice->balance();

    $data = $request->validate([
        'amount' => 'required|numeric|gt:0|lte:' . ceil($balance),
    ]);

    $amount = min($data['amount'], $balance);

    $invoice->payments()->create([
        'amount' => $amount,
        'date' => now()->toDateString(),
    ]);

    return response()->json(['ok' => true]);
}
public function destroy(Invoice $invoice)
{
    if ($invoice->payments()->exists()) {
        return response()->json(['message' => 'Invoices with payments cannot be deleted'], 422);
    }

    $invoice->delete();

    return response()->json(['ok' => true]);
}
}