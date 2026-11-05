<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Purchase;
use App\Support\Profit;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function data()
    {
        $today = now()->startOfDay();

        $invoices = Invoice::with(['items.product', 'payments', 'customer'])->get();
        $purchases = Purchase::with(['items', 'payments', 'vendor'])->get();

        // Days late: positive means overdue, zero or negative means not due yet
        $late = function ($due) use ($today) {
            return (int) Carbon::parse($due)->startOfDay()->diffInDays($today, false);
        };

        // Har invoice ka revenue (tax ke baghair) aur cost, aur har item ki line
        $sales = [];
        $items = [];

        foreach ($invoices as $i) {
            $lines = Profit::lines($i);

            $sales[] = [
                'date' => $i->date,
                'name' => $i->customer->name,
                'amount' => round(array_sum(array_column($lines, 'revenue')), 2),
                'cost' => round(array_sum(array_column($lines, 'cost')), 2),
            ];

            foreach ($lines as $l) {
                $items[] = [
                    'date' => $l['date'],
                    'product' => $l['product'],
                    'qty' => $l['qty'],
                    'revenue' => $l['revenue'],
                    'cost' => $l['cost'],
                    'estimated' => $l['estimated'],
                    'unknown' => $l['unknown'],
                ];
            }
        }

        return response()->json([
            'sales' => $sales,
            'items' => $items,

            // Purchases ab sirf maloomat ke liye hain, profit se minus nahi hoti
            'purchases' => $purchases->map(function ($p) {
                return ['date' => $p->date, 'name' => $p->vendor->name, 'amount' => $p->total()];
            })->values(),

            'expenses' => Expense::orderBy('date')->get()->map(function ($e) {
                return ['date' => $e->date, 'category' => $e->category, 'title' => $e->title, 'amount' => $e->amount];
            })->values(),

            'receivables' => $invoices->filter(function ($i) { return $i->balance() > 0; })
                ->map(function ($i) use ($late) {
                    return ['name' => $i->customer->name, 'amount' => $i->balance(), 'late' => $late($i->due)];
                })->values(),

            'payables' => $purchases->filter(function ($p) { return $p->balance() > 0; })
                ->map(function ($p) use ($late) {
                    return ['name' => $p->vendor->name, 'amount' => $p->balance(), 'late' => $late($p->due)];
                })->values(),
        ]);
    }
}