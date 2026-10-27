<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    private function rules(?int $ignoreId = null): array
    {
        $ignore = $ignoreId ? ',' . $ignoreId : '';

        return [
            'name' => 'required|string|max:255|unique:products,name' . $ignore,
            'sku' => 'nullable|string|max:100|unique:products,sku' . $ignore,
            'category' => 'required|string|max:100',
            'unit' => 'required|string|max:30',
            'cost' => 'required|numeric|min:0',
            'sale' => 'required|numeric|min:0',
            'opening' => 'required|numeric|min:0',
            'reorder' => 'required|numeric|min:0',
            'active' => 'sometimes|boolean',
            'notes' => 'nullable|string|max:300',
        ];
    }

    private function columns(array $d): array
    {
        $out = [
            'name' => $d['name'],
            'sku' => $d['sku'] ?? null,
            'category' => $d['category'],
            'unit' => $d['unit'],
            'cost_price' => $d['cost'],
            'sale_price' => $d['sale'],
            'opening_stock' => $d['opening'],
            'reorder_level' => $d['reorder'],
            'notes' => $d['notes'] ?? null,
        ];

        if (array_key_exists('active', $d)) {
            $out['active'] = $d['active'];
        }

        return $out;
    }

    public function index()
    {
        $today = now()->startOfDay();
        $d30 = $today->copy()->subDays(30)->toDateString();
        $d60 = $today->copy()->subDays(60)->toDateString();

        $products = Product::with(['adjustments', 'invoiceItems.invoice.customer', 'purchaseItems.purchase.vendor'])
            ->orderBy('name')
            ->get()
            ->map(function ($p) use ($d30, $d60) {
                $purchased = (float) $p->purchaseItems->sum('qty');
                $sold = (float) $p->invoiceItems->sum('qty');
                $adjusted = (float) $p->adjustments->sum('qty');
                $stock = round($p->opening_stock + $purchased - $sold + $adjusted, 4);

                $sold30 = (float) $p->invoiceItems->filter(function ($i) use ($d30) {
                    return $i->invoice->date >= $d30;
                })->sum('qty');
                $avgDaily = $sold30 / 30;
                $daysLeft = ($avgDaily > 0 && $stock > 0) ? (int) floor($stock / $avgDaily) : null;

                $lastSold = $p->invoiceItems->map(function ($i) { return $i->invoice->date; })->max();
                $revenue = round($p->invoiceItems->sum(function ($i) { return $i->qty * $i->price; }), 2);

                $status = $stock <= 0 ? 'out' : (($p->reorder_level > 0 && $stock <= $p->reorder_level) ? 'low' : 'in');
                $dead = $stock > 0 && ($lastSold ? $lastSold < $d60 : $p->created_at->toDateString() < $d60);

                $target = max($avgDaily * 30, $p->reorder_level * 2);
                $suggest = ($status !== 'in' || ($daysLeft !== null && $daysLeft < 14))
                    ? (int) ceil(max($target - $stock, 0))
                    : 0;

                $moves = [];
                foreach ($p->purchaseItems as $i) {
                    $moves[] = ['date' => $i->purchase->date, 'type' => 'in', 'qty' => $i->qty,
                        'ref' => $i->purchase->no, 'party' => $i->purchase->vendor->name, 'note' => ''];
                }
                foreach ($p->invoiceItems as $i) {
                    $moves[] = ['date' => $i->invoice->date, 'type' => 'out', 'qty' => -$i->qty,
                        'ref' => $i->invoice->no, 'party' => $i->invoice->customer->name, 'note' => ''];
                }
                foreach ($p->adjustments as $a) {
                    $moves[] = ['date' => $a->date, 'type' => 'adj', 'qty' => $a->qty,
                        'ref' => $a->reason, 'party' => '', 'note' => $a->note ?? ''];
                }
                usort($moves, function ($a, $b) { return strcmp($b['date'], $a['date']); });

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'sku' => $p->sku ?? '',
                    'category' => $p->category,
                    'unit' => $p->unit,
                    'cost' => $p->cost_price,
                    'sale' => $p->sale_price,
                    'opening' => $p->opening_stock,
                    'reorder' => $p->reorder_level,
                    'active' => $p->active,
                    'notes' => $p->notes ?? '',
                    'stock' => $stock,
                    'purchased' => $purchased,
                    'sold' => $sold,
                    'adjusted' => $adjusted,
                    'status' => $status,
                    'avgDaily' => round($avgDaily, 2),
                    'daysLeft' => $daysLeft,
                    'suggest' => $suggest,
                    'lastSold' => $lastSold,
                    'idleSince' => $lastSold ?: $p->created_at->toDateString(),
                    'dead' => $dead,
                    'revenue' => $revenue,
                    'movements' => array_slice($moves, 0, 30),
                ];
            });

        return response()->json($products);
    }

    // Light numbers for the sidebar badge
    public function summary()
    {
        $products = Product::where('active', true)
            ->withSum('purchaseItems as purchased', 'qty')
            ->withSum('invoiceItems as sold', 'qty')
            ->withSum('adjustments as adjusted', 'qty')
            ->get();

        $low = 0;
        $out = 0;

        foreach ($products as $p) {
            $stock = $p->opening_stock + (float) $p->purchased - (float) $p->sold + (float) $p->adjusted;

            if ($stock <= 0) {
                $out++;
            } elseif ($p->reorder_level > 0 && $stock <= $p->reorder_level) {
                $low++;
            }
        }

        return response()->json(['low' => $low, 'out' => $out, 'attention' => $low + $out]);
    }

    // Product list for the invoice item picker
    public function options()
    {
        $products = Product::where('active', true)
            ->withSum('purchaseItems as purchased', 'qty')
            ->withSum('invoiceItems as sold', 'qty')
            ->withSum('adjustments as adjusted', 'qty')
            ->orderBy('name')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'unit' => $p->unit,
                    'cost' => $p->cost_price,
                    'sale' => $p->sale_price,
                    'stock' => round($p->opening_stock + (float) $p->purchased - (float) $p->sold + (float) $p->adjusted, 4),
                ];
            });

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());

        $product = Product::create($this->columns($data));

        return response()->json(['id' => $product->id]);
    }

    public function update(Request $request, Product $product)
    {
        // Only switching active / inactive
        if ($request->has('active') && count($request->all()) === 1) {
            $product->update($request->validate(['active' => 'required|boolean']));

            return response()->json(['ok' => true]);
        }

        $data = $request->validate($this->rules($product->id));

        $product->update($this->columns($data));

        return response()->json(['ok' => true]);
    }

    public function destroy(Product $product)
    {
        if ($product->invoiceItems()->exists() || $product->purchaseItems()->exists()) {
            return response()->json(['message' => 'This product has sales or purchases. Make it inactive instead.'], 422);
        }

        $product->delete();

        return response()->json(['ok' => true]);
    }

    public function adjust(Request $request, Product $product)
    {
        $data = $request->validate([
            'qty' => 'required|numeric|not_in:0',
            'reason' => 'required|string|max:100',
            'date' => 'required|date|before_or_equal:today',
            'note' => 'nullable|string|max:255',
        ]);

        $product->load(['adjustments', 'invoiceItems', 'purchaseItems']);

        if ($product->stock() + $data['qty'] < 0) {
            return response()->json(['message' => 'Stock cannot go below zero'], 422);
        }

        $product->adjustments()->create($data);

        return response()->json(['ok' => true]);
    }
}