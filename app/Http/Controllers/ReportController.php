<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Purchase;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function data()
    {
        $today = now()->startOfDay();

        $invoices = Invoice::with(['items', 'payments', 'customer'])->get();
        $purchases = Purchase::with(['items', 'payments', 'vendor'])->get();

        // Days late: positive means overdue, zero or negative means not due yet
        $late = function ($due) use ($today) {
            return (int) Carbon::parse($due)->startOfDay()->diffInDays($today, false);
        };

        return response()->json([
            'sales' => $invoices->map(function ($i) {
                return ['date' => $i->date, 'name' => $i->customer->name, 'amount' => $i->total()];
            })->values(),

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