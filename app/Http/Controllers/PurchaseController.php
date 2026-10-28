<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Product;
use App\Models\Purchase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PurchaseController extends Controller
{
    private function rules(): array
    {
        return [
            'vendor_id' => 'required|exists:vendors,id',
            'date' => 'required|date',
            'due' => 'required|date|after_or_equal:date',
            'notes' => 'nullable|string|max:300',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.desc' => 'nullable|string|max:255',
            'items.*.qty' => 'required|numeric|gt:0',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.sale_price' => 'nullable|numeric|min:0',
        ];
    }

    private function messages(): array
    {
        return [
            'items.*.product_id.required' => 'Choose a product for every item.',
            'items.*.qty.gt' => 'Quantity must be more than 0.',
        ];
    }

    private function itemRows(array $items): array
    {
        return array_map(function ($i) {
            return [
                'product_id' => $i['product_id'],
                'description' => $i['desc'] ?? '',
                'qty' => $i['qty'],
                'price' => $i['price'],
                'sale_price' => $i['sale_price'] ?? null,
            ];
        }, $items);
    }

    // Remember who created the record (if the column exists)
    private function stamp($model)
    {
        if (Schema::hasColumn($model->getTable(), 'created_by')) {
            $model->forceFill(['created_by' => auth()->id()])->save();
        }
    }

    public function index()
    {
        $purchases = Purchase::with(['items.product', 'payments', 'vendor'])->orderBy('id')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'no' => $p->no,
                'vendor' => $p->vendor->name,
                'vendor_id' => $p->vendor_id,
                'date' => $p->date,
                'due' => $p->due,
                'notes' => $p->notes ?? '',
                'items' => $p->items->map(function ($i) {
                    $name = $i->product ? $i->product->name : $i->description;
                    // Old rows used the product name as the description. Do not show it twice
                    $desc = ($i->product && $i->description === $i->product->name) ? '' : $i->description;

                    return [
                        'product_id' => $i->product_id,
                        'name' => $name,
                        'desc' => $desc,
                        'qty' => $i->qty,
                        'price' => $i->price,
                        'sale_price' => $i->sale_price,
                    ];
                })->values(),
                'payments' => $p->payments->map(function ($x) {
                    return ['date' => $x->date, 'amount' => $x->amount, 'method' => $x->method];
                })->values(),
            ];
        });

        return response()->json($purchases);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules(), $this->messages());

        $purchase = DB::transaction(function () use ($data) {
            $next = (Purchase::max('id') ?? 0) + 1;

            $purchase = Purchase::create([
                'no' => 'PO-' . str_pad($next, 4, '0', STR_PAD_LEFT),
                'vendor_id' => $data['vendor_id'],
                'date' => $data['date'],
                'due' => $data['due'],
                'notes' => $data['notes'] ?? null,
            ]);

            $this->stamp($purchase);
            $purchase->items()->createMany($this->itemRows($data['items']));

            // A new purchase: the purchase price becomes the product cost,
            // and the sale price (if written) becomes the product sale price
            foreach ($data['items'] as $i) {
                $changes = ['cost_price' => $i['price']];

                if (isset($i['sale_price'])) {
                    $changes['sale_price'] = $i['sale_price'];
                }

                Product::where('id', $i['product_id'])->update($changes);
            }

            return $purchase;
        });

        return response()->json(['no' => $purchase->no]);
    }

    public function update(Request $request, Purchase $purchase)
    {
        $data = $request->validate($this->rules(), $this->messages());

        $paid = (float) $purchase->payments()->sum('amount');
        $newTotal = collect($data['items'])->sum(function ($i) { return $i['qty'] * $i['price']; });

        if (round($newTotal, 2) < round($paid, 2)) {
            return response()->json(['message' => 'Total cannot be less than the amount already paid'], 422);
        }

        DB::transaction(function () use ($purchase, $data) {
            $purchase->update([
                'vendor_id' => $data['vendor_id'],
                'date' => $data['date'],
                'due' => $data['due'],
                'notes' => $data['notes'] ?? null,
            ]);

            $purchase->items()->delete();
            $purchase->items()->createMany($this->itemRows($data['items']));
        });

        return response()->json(['ok' => true]);
    }

    public function destroy(Purchase $purchase)
    {
        $purchase->delete();

        return response()->json(['ok' => true]);
    }

    public function pay(Request $request, Purchase $purchase)
    {
        $purchase->load(['items', 'payments']);
        $balance = $purchase->balance();

        $data = $request->validate([
            'amount' => 'required|numeric|gt:0|lte:' . $balance,
            'date' => 'required|date|before_or_equal:today',
            'method' => 'required|string|max:50',
        ]);

        $payment = $purchase->payments()->create($data);
        $this->stamp($payment);

        return response()->json(['ok' => true]);
    }
}