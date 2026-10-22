<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Purchase;
use App\Models\Vendor;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function data()
    {
        $today = now()->startOfDay();

        $invoices = Invoice::with(['items', 'payments', 'customer'])->get();
        $purchases = Purchase::with(['items', 'payments', 'vendor'])->get();
        $expenses = Expense::all();
        $customers = Customer::with(['invoices.items', 'invoices.payments'])->get();
        $vendors = Vendor::with(['payments', 'purchases.items', 'purchases.payments'])->get();

        // ----- Last 6 months totals -----
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $months[] = now()->startOfMonth()->subMonths($i)->format('Y-m');
        }

        $monthly = function ($rows, $valueFn) use ($months) {
            $out = array_fill_keys($months, 0);
            foreach ($rows as $r) {
                $m = substr($r->date, 0, 7);
                if (isset($out[$m])) {
                    $out[$m] += $valueFn($r);
                }
            }
            return array_values(array_map(function ($v) { return round($v, 2); }, $out));
        };

        $sales = $monthly($invoices, function ($r) { return $r->total(); });
        $purchaseTotals = $monthly($purchases, function ($r) { return $r->total(); });
        $expenseTotals = $monthly($expenses, function ($r) { return $r->amount; });

        // ----- Receivable and payable -----
        $customerBalance = function ($c) {
            return $c->opening
                + $c->invoices->sum(function ($i) { return $i->total(); })
                - $c->invoices->sum(function ($i) { return $i->paidAmount(); });
        };

        $receivable = 0;
        foreach ($customers as $c) {
            if (!$c->active) { continue; }
            $b = $customerBalance($c);
            if ($b > 0) { $receivable += $b; }
        }

        $payable = 0;
        foreach ($vendors as $v) {
            $openingLeft = max($v->opening - $v->payments->sum('amount'), 0);
            $payable += $openingLeft + $v->purchases->sum(function ($p) { return $p->balance(); });
        }

        // ----- Expenses by category (this month) -----
        $thisMonth = now()->format('Y-m');
        $categories = $expenses
            ->filter(function ($e) use ($thisMonth) { return substr($e->date, 0, 7) === $thisMonth; })
            ->groupBy('category')
            ->map(function ($g) { return round($g->sum('amount'), 2); })
            ->sortDesc()
            ->map(function ($value, $name) { return ['name' => $name, 'value' => $value]; })
            ->values();

        // ----- Needs attention -----
        $names = function ($rows, $field) {
            return $rows->pluck($field)->unique()->take(2)->implode(' and ');
        };

        $attention = [];

        $overdueInv = $invoices->filter(function ($i) use ($today) {
            return $i->balance() > 0 && Carbon::parse($i->due)->lt($today);
        });
        if ($overdueInv->count() > 0) {
            $n = $overdueInv->count();
            $attention[] = [
                'icon' => 'fa-file-invoice', 'tone' => 'red', 'pulse' => true, 'href' => '/invoices',
                'title' => $n . ($n === 1 ? ' invoice is overdue' : ' invoices are overdue'),
                'amount' => round($overdueInv->sum(function ($i) { return $i->balance(); }), 2),
                'sub' => 'waiting from ' . $names($overdueInv, 'customer.name'),
            ];
        }

        $overduePur = $purchases->filter(function ($p) use ($today) {
            return $p->balance() > 0 && Carbon::parse($p->due)->lt($today);
        });
        if ($overduePur->count() > 0) {
            $n = $overduePur->count();
            $attention[] = [
                'icon' => 'fa-cart-shopping', 'tone' => 'red', 'pulse' => true, 'href' => '/purchases',
                'title' => $n . ($n === 1 ? ' purchase is overdue' : ' purchases are overdue'),
                'amount' => round($overduePur->sum(function ($p) { return $p->balance(); }), 2),
                'sub' => 'owed to ' . $names($overduePur, 'vendor.name'),
            ];
        }

        $duePur = $purchases->filter(function ($p) use ($today) {
            if ($p->balance() <= 0) { return false; }
            $days = (int) $today->diffInDays(Carbon::parse($p->due)->startOfDay(), false);
            return $days >= 0 && $days <= 7;
        });
        if ($duePur->count() > 0) {
            $n = $duePur->count();
            $attention[] = [
                'icon' => 'fa-truck', 'tone' => 'orange', 'pulse' => false, 'href' => '/vendors',
                'title' => $n . ($n === 1 ? ' vendor payment is due this week' : ' vendor payments are due this week'),
                'amount' => round($duePur->sum(function ($p) { return $p->balance(); }), 2),
                'sub' => 'to pay',
            ];
        }

        $nearLimit = null;
        $nearPct = 0;
        foreach ($customers as $c) {
            if (!$c->active || $c->limit <= 0) { continue; }
            $pct = (int) round(($customerBalance($c) / $c->limit) * 100);
            if ($pct >= 80 && $pct > $nearPct) {
                $nearLimit = $c;
                $nearPct = $pct;
            }
        }
        if ($nearLimit) {
            $attention[] = [
                'icon' => 'fa-user-clock', 'tone' => 'yellow', 'pulse' => false, 'href' => '/customers',
                'title' => $nearLimit->name . ($nearPct > 100 ? ' is over the credit limit' : ' is near the credit limit'),
                'amount' => null,
                'sub' => $nearPct . '% of the limit is used',
            ];
        }

        // ----- Upcoming dues (next 7 days) -----
        $dues = collect();

        foreach ($invoices as $i) {
            $bal = $i->balance();
            if ($bal <= 0) { continue; }
            $days = (int) $today->diffInDays(Carbon::parse($i->due)->startOfDay(), false);
            if ($days >= 0 && $days <= 7) {
                $dues->push(['type' => 'in', 'name' => $i->customer->name, 'ref' => $i->no, 'days' => $days, 'amount' => $bal]);
            }
        }

        foreach ($purchases as $p) {
            $bal = $p->balance();
            if ($bal <= 0) { continue; }
            $days = (int) $today->diffInDays(Carbon::parse($p->due)->startOfDay(), false);
            if ($days >= 0 && $days <= 7) {
                $dues->push(['type' => 'out', 'name' => $p->vendor->name, 'ref' => $p->no, 'days' => $days, 'amount' => $bal]);
            }
        }

        $dues = $dues->sortBy('days')->values()->take(6)->map(function ($d) {
            $d['when'] = $d['days'] === 0 ? 'Today' : ($d['days'] === 1 ? 'Tomorrow' : 'In ' . $d['days'] . ' days');
            unset($d['days']);
            return $d;
        })->values();

        // ----- Recent activity -----
        $events = collect();

        foreach ($invoices as $i) {
            $events->push(['at' => $i->created_at, 'icon' => 'fa-file-invoice-dollar', 'tone' => 'green',
                'text' => 'Invoice ' . $i->no . ' created for ' . $i->customer->name, 'amount' => $i->total()]);
            foreach ($i->payments as $x) {
                $events->push(['at' => $x->created_at, 'icon' => 'fa-money-bill-wave', 'tone' => 'blue',
                    'text' => 'Payment received for ' . $i->no . ' from ' . $i->customer->name, 'amount' => $x->amount]);
            }
        }

        foreach ($purchases as $p) {
            $events->push(['at' => $p->created_at, 'icon' => 'fa-cart-shopping', 'tone' => 'orange',
                'text' => 'Purchase ' . $p->no . ' added from ' . $p->vendor->name, 'amount' => $p->total()]);
            foreach ($p->payments as $x) {
                $events->push(['at' => $x->created_at, 'icon' => 'fa-truck', 'tone' => 'blue',
                    'text' => 'Payment sent to ' . $p->vendor->name . ' for ' . $p->no, 'amount' => $x->amount]);
            }
        }

        foreach ($expenses as $e) {
            $events->push(['at' => $e->created_at, 'icon' => 'fa-receipt', 'tone' => 'red',
                'text' => 'Expense recorded: ' . $e->title, 'amount' => $e->amount]);
        }

        foreach ($customers as $c) {
            $events->push(['at' => $c->created_at, 'icon' => 'fa-user-plus', 'tone' => 'purple',
                'text' => 'New customer added: ' . $c->name, 'amount' => 0]);
        }

        $activity = $events->sortByDesc('at')->values()->take(6)->map(function ($e) {
            return [
                'icon' => $e['icon'],
                'tone' => $e['tone'],
                'text' => $e['text'],
                'amount' => round($e['amount'], 2),
                'when' => $e['at']->diffForHumans(),
            ];
        })->values();

        return response()->json([
            'sales' => $sales,
            'purchases' => $purchaseTotals,
            'expenses' => $expenseTotals,
            'receivable' => round($receivable, 2),
            'payable' => round($payable, 2),
            'categories' => $categories,
            'attention' => $attention,
            'dues' => $dues,
            'activity' => $activity,
        ]);
    }
}