<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InvoiceController extends Controller
{
    // Remember who created the record (if the column exists)
    private function stamp($model)
    {
        if (Schema::hasColumn($model->getTable(), 'created_by')) {
            $model->forceFill(['created_by' => auth()->id()])->save();
        }
    }

    public function index()
    {
        $invoices = Invoice::with(['items', 'customer', 'payments'])->orderByDesc('id')->get()->map(function ($inv) {
            return [
                'no' => $inv->no,
                'customer' => $inv->customer->name,
                'date' => $inv->date,
                'due' => $inv->due,
                'items' => $inv->items->map(function ($i) {
                    return ['name' => $i->name, 'description' => $i->description ?? '', 'qty' => $i->qty, 'price' => $i->price];
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
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.description' => 'nullable|string|max:255',
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
            'items.*.product_id.required' => 'Choose a product for every item.',
            'items.*.qty.gt' => 'Quantity must be more than 0.',
            'items.*.price.gt' => 'Price must be more than 0.',
        ]);

        // Discount must not be more than the subtotal
        $subtotal = collect($data['items'])->sum(function ($i) { return $i['qty'] * $i['price']; });

        if (($data['discount'] ?? 0) > $subtotal) {
            return response()->json([
                'message' => 'Discount cannot be more than the subtotal.',
                'errors' => ['discount' => ['Discount cannot be more than the subtotal.']],
            ], 422);
        }

        // Stock check: you cannot sell more than you have
        $wanted = [];
        foreach ($data['items'] as $i) {
            $wanted[$i['product_id']] = ($wanted[$i['product_id']] ?? 0) + $i['qty'];
        }

        $products = Product::with(['purchaseItems', 'invoiceItems', 'adjustments'])
            ->whereIn('id', array_keys($wanted))
            ->get()
            ->keyBy('id');

        foreach ($wanted as $pid => $qty) {
            $p = $products[$pid];

            if (!$p->active) {
                return response()->json([
                    'message' => $p->name . ' is inactive.',
                    'errors' => ['items' => [$p->name . ' is inactive.']],
                ], 422);
            }

            if ($qty > $p->stock()) {
                $msg = 'Only ' . $p->stock() . ' ' . $p->unit . ' of "' . $p->name . '" in stock.';

                return response()->json(['message' => $msg, 'errors' => ['items' => [$msg]]], 422);
            }
        }

        $rows = array_map(function ($i) use ($products) {
            $p = $products[$i['product_id']];

            return [
                'product_id' => $p->id,
                'name' => $p->name,
                'description' => $i['description'] ?? null,
                'qty' => $i['qty'],
                'price' => $i['price'],
                'cost' => $p->cost_price,
            ];
        }, $data['items']);

        $invoice = DB::transaction(function () use ($data, $rows) {
            $next = (Invoice::max('id') ?? 0) + 1;

            $invoice = Invoice::create([
                'no' => 'INV-' . str_pad($next, 4, '0', STR_PAD_LEFT),
                'customer_id' => $data['customer_id'],
                'date' => now()->toDateString(),
                'due' => $data['due'],
                'discount' => $data['discount'] ?? 0,
                'tax' => $data['tax'] ?? 0,
            ]);

            $this->stamp($invoice);
            $invoice->items()->createMany($rows);

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
            'date' => 'nullable|date|before_or_equal:today|after_or_equal:' . $invoice->date,
        ]);

        $amount = min($data['amount'], $balance);

        $payment = $invoice->payments()->create([
            'amount' => $amount,
            'date' => $data['date'] ?? now()->toDateString(),
        ]);

        $this->stamp($payment);

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