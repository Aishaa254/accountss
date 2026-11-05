<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Purchase;
use App\Support\Profit;
use Carbon\Carbon;

class AdvisorController extends Controller
{
    // Itne din se zyada order na aaye to customer "khamosh" hai
    const QUIET_DAYS = 45;
    // Itne din bina bike maal "phansa hua" hai
    const STUCK_DAYS = 60;
    // Isse kam margin (%) ho to price check karni chahiye
    const LOW_MARGIN = 10;

    public function data()
    {
        $today = now()->startOfDay();

        $invoices = Invoice::with(['items.product', 'payments', 'customer'])->get();
        $purchases = Purchase::with(['items', 'payments', 'vendor'])->get();
        $expenses = Expense::all();
        $products = Product::with(['purchaseItems', 'invoiceItems', 'adjustments'])->get();
        $customers = Customer::all()->keyBy('id');

        $lines = Profit::allLines($invoices);

        // ---------- Ek muddat ka hisaab ----------
        $period = function (Carbon $from, Carbon $to) use ($lines, $expenses) {
            $a = $from->toDateString();
            $b = $to->toDateString();
            $rev = 0;
            $cost = 0;
            $exp = 0;

            foreach ($lines as $l) {
                if ($l['date'] >= $a && $l['date'] <= $b) {
                    $rev += $l['revenue'];
                    $cost += $l['cost'];
                }
            }

            foreach ($expenses as $e) {
                if ($e->date >= $a && $e->date <= $b) {
                    $exp += $e->amount;
                }
            }

            return [
                'revenue' => round($rev, 2),
                'cost' => round($cost, 2),
                'expenses' => round($exp, 2),
                'profit' => round($rev - $cost - $exp, 2),
            ];
        };

        // ---------- 1. Profit Pulse ----------
        $weekStart = $today->copy()->startOfWeek();
        $weekDays = (int) $weekStart->diffInDays($today, false);
        $prevWeekStart = $weekStart->copy()->subWeek();

        $monthStart = $today->copy()->startOfMonth();
        $prevMonthStart = $monthStart->copy()->subMonthNoOverflow();
        $prevMonthEnd = $prevMonthStart->copy()->addDays($today->day - 1);
        if ($prevMonthEnd->gt($prevMonthStart->copy()->endOfMonth())) {
            $prevMonthEnd = $prevMonthStart->copy()->endOfMonth();
        }

        $yesterday = $today->copy()->subDay();

        $pulse = [
            'today' => ['now' => $period($today, $today), 'before' => $period($yesterday, $yesterday)],
            'week' => [
                'now' => $period($weekStart, $today),
                'before' => $period($prevWeekStart, $prevWeekStart->copy()->addDays($weekDays)),
            ],
            'month' => ['now' => $period($monthStart, $today), 'before' => $period($prevMonthStart, $prevMonthEnd)],
        ];

        // ---------- Pichle 30 din ----------
        $from30 = $today->copy()->subDays(29);
        $last30 = $period($from30, $today);
        $from30Str = $from30->toDateString();

        // Har product ka pichle 30 din ka munafa
        $sold = [];
        foreach ($lines as $l) {
            if ($l['date'] < $from30Str) {
                continue;
            }

            $key = $l['product_id'] ? 'p' . $l['product_id'] : 'n' . $l['product'];

            if (!isset($sold[$key])) {
                $sold[$key] = ['id' => $l['product_id'], 'name' => $l['product'], 'revenue' => 0, 'cost' => 0, 'unknown' => false];
            }

            $sold[$key]['revenue'] += $l['revenue'];
            $sold[$key]['cost'] += $l['cost'];
            if ($l['unknown']) {
                $sold[$key]['unknown'] = true;
            }
        }

        foreach ($sold as $k => $s) {
            $sold[$k]['profit'] = round($s['revenue'] - $s['cost'], 2);
            $sold[$k]['margin'] = $s['revenue'] > 0 ? round((($s['revenue'] - $s['cost']) / $s['revenue']) * 100, 1) : 0;
        }

        $tips = [];

        // ---------- Tip: sab se zyada kamane wale ----------
        $earners = collect($sold)->filter(function ($s) { return $s['profit'] > 0; })
            ->sortByDesc('profit')->take(3)->values();

        if ($earners->count()) {
            $productMap = $products->keyBy('id');

            $tips[] = [
                'key' => 'top', 'tone' => 'green', 'icon' => 'fa-trophy',
                'items' => $earners->map(function ($s) use ($productMap) {
                    $p = $s['id'] ? ($productMap[$s['id']] ?? null) : null;
                    $stock = $p ? $p->stock() : null;

                    return [
                        'name' => $s['name'],
                        'profit' => $s['profit'],
                        'margin' => $s['margin'],
                        'stock' => $stock,
                        'unit' => $p ? $p->unit : '',
                        'low' => $p ? ($stock <= $p->reorder_level) : false,
                    ];
                })->all(),
            ];
        }

        // ---------- Tip: kam margin ya cost se kam ----------
        $lowItems = [];
        $seen = [];

        foreach ($sold as $s) {
            if ($s['revenue'] > 0 && ($s['margin'] < self::LOW_MARGIN) && !$s['unknown']) {
                $lowItems[] = [
                    'name' => $s['name'],
                    'margin' => $s['margin'],
                    'profit' => $s['profit'],
                    'why' => $s['profit'] < 0 ? 'below_cost' : 'low_margin',
                ];
                if ($s['id']) {
                    $seen[$s['id']] = true;
                }
            }
        }

        // Jo abhi bike nahi, lekin price hi cost ke qareeb rakhi hai
        foreach ($products as $p) {
            if (!$p->active || isset($seen[$p->id]) || $p->cost_price <= 0 || $p->sale_price <= 0) {
                continue;
            }

            $margin = (($p->sale_price - $p->cost_price) / $p->sale_price) * 100;

            if ($margin < self::LOW_MARGIN) {
                $lowItems[] = [
                    'name' => $p->name,
                    'margin' => round($margin, 1),
                    'profit' => null,
                    'why' => $margin < 0 ? 'price_below_cost' : 'price_close',
                ];
            }
        }

        if (count($lowItems)) {
            usort($lowItems, function ($a, $b) { return $a['margin'] <=> $b['margin']; });
            $tips[] = ['key' => 'margin', 'tone' => 'red', 'icon' => 'fa-tag', 'items' => array_slice($lowItems, 0, 6)];
        }

        // ---------- Tip: phansa hua maal ----------
        $lastSale = [];
        foreach ($lines as $l) {
            if ($l['product_id'] && (!isset($lastSale[$l['product_id']]) || $l['date'] > $lastSale[$l['product_id']])) {
                $lastSale[$l['product_id']] = $l['date'];
            }
        }

        $stuck = [];
        foreach ($products as $p) {
            $stock = $p->stock();

            if (!$p->active || $stock <= 0) {
                continue;
            }

            // Bilkul naye product ko phansa hua na kaho
            if ($p->created_at && $p->created_at->gt($today->copy()->subDays(self::STUCK_DAYS))) {
                continue;
            }

            $days = isset($lastSale[$p->id])
                ? (int) Carbon::parse($lastSale[$p->id])->startOfDay()->diffInDays($today, false)
                : null;

            if ($days === null || $days >= self::STUCK_DAYS) {
                $stuck[] = [
                    'name' => $p->name,
                    'qty' => $stock,
                    'unit' => $p->unit,
                    'value' => round($stock * $p->cost_price, 2),
                    'days' => $days,
                ];
            }
        }

        if (count($stuck)) {
            usort($stuck, function ($a, $b) { return $b['value'] <=> $a['value']; });
            $tips[] = [
                'key' => 'stuck', 'tone' => 'red', 'icon' => 'fa-box-archive',
                'total' => round(array_sum(array_column($stuck, 'value')), 2),
                'items' => array_slice($stuck, 0, 6),
            ];
        }

        // ---------- Phone number (WhatsApp ke liye) ----------
        $phoneOf = function ($c) {
            if (!$c) {
                return '';
            }

            $n = preg_replace('/\D+/', '', (string) ($c->whatsapp ?: $c->phone));

            if ($n === '') {
                return '';
            }

            if (strpos($n, '00') === 0) {
                return substr($n, 2);
            }

            if ($n[0] === '0') {
                return '92' . substr($n, 1);
            }

            return $n;
        };

        // ---------- Tip: purane customer jo khamosh hain ----------
        $perCustomer = [];
        foreach ($lines as $l) {
            $id = $l['customer_id'];

            if (!isset($perCustomer[$id])) {
                $perCustomer[$id] = ['spent' => 0, 'last' => $l['date']];
            }

            $perCustomer[$id]['spent'] += $l['revenue'];
            if ($l['date'] > $perCustomer[$id]['last']) {
                $perCustomer[$id]['last'] = $l['date'];
            }
        }

        $quiet = [];
        foreach ($perCustomer as $id => $info) {
            $c = $customers[$id] ?? null;

            if (!$c || !$c->active) {
                continue;
            }

            $days = (int) Carbon::parse($info['last'])->startOfDay()->diffInDays($today, false);

            if ($days >= self::QUIET_DAYS) {
                $quiet[] = ['name' => $c->name, 'days' => $days, 'spent' => round($info['spent'], 2), 'phone' => $phoneOf($c)];
            }
        }

        if (count($quiet)) {
            usort($quiet, function ($a, $b) { return $b['spent'] <=> $a['spent']; });
            $tips[] = ['key' => 'quiet', 'tone' => 'green', 'icon' => 'fa-user-clock', 'items' => array_slice($quiet, 0, 6)];
        }

        // ---------- Tip: late payments ----------
        $lateBy = [];
        foreach ($invoices as $i) {
            $bal = $i->balance();
            $daysLate = (int) Carbon::parse($i->due)->startOfDay()->diffInDays($today, false);

            if ($bal <= 0 || $daysLate <= 0) {
                continue;
            }

            $id = $i->customer_id;

            if (!isset($lateBy[$id])) {
                $lateBy[$id] = ['name' => $i->customer->name, 'amount' => 0, 'days' => 0, 'invoices' => [], 'phone' => $phoneOf($customers[$id] ?? null)];
            }

            $lateBy[$id]['amount'] += $bal;
            $lateBy[$id]['days'] = max($lateBy[$id]['days'], $daysLate);
            $lateBy[$id]['invoices'][] = $i->no;
        }

        if (count($lateBy)) {
            $list = array_values($lateBy);
            usort($list, function ($a, $b) { return $b['amount'] <=> $a['amount']; });

            foreach ($list as $k => $row) {
                $list[$k]['amount'] = round($row['amount'], 2);
            }

            $tips[] = [
                'key' => 'late', 'tone' => 'red', 'icon' => 'fa-bell',
                'total' => round(array_sum(array_column($list, 'amount')), 2),
                'items' => array_slice($list, 0, 6),
            ];
        }

        // ---------- Tip: agle 30 din ka paisa ----------
        $in30 = 0;
        $alreadyLate = 0;
        $out30 = 0;

        foreach ($invoices as $i) {
            $bal = $i->balance();
            if ($bal <= 0) {
                continue;
            }

            $d = (int) $today->diffInDays(Carbon::parse($i->due)->startOfDay(), false);

            if ($d < 0) {
                $alreadyLate += $bal;
            } elseif ($d <= 30) {
                $in30 += $bal;
            }
        }

        foreach ($purchases as $p) {
            $bal = $p->balance();
            if ($bal <= 0) {
                continue;
            }

            $d = (int) $today->diffInDays(Carbon::parse($p->due)->startOfDay(), false);

            if ($d <= 30) {
                $out30 += $bal;
            }
        }

        if ($in30 > 0 || $alreadyLate > 0 || $out30 > 0) {
            $gap = round($out30 - $in30, 2);

            $tips[] = [
                'key' => 'cash', 'tone' => $gap > 0 ? 'red' : 'green', 'icon' => 'fa-hand-holding-dollar',
                'cash' => ['in' => round($in30, 2), 'late' => round($alreadyLate, 2), 'out' => round($out30, 2), 'gap' => $gap],
            ];
        }

        // ---------- Tip: achanak barhne wale kharche ----------
        $thisMonth = $today->format('Y-m');
        $prevMonths = [];
        for ($k = 1; $k <= 3; $k++) {
            $prevMonths[] = $today->copy()->startOfMonth()->subMonthsNoOverflow($k)->format('Y-m');
        }

        $now = [];
        $before = [];
        $anyBefore = false;

        foreach ($expenses as $e) {
            $m = substr($e->date, 0, 7);
            $cat = $e->category ?: 'Other';

            if ($m === $thisMonth) {
                $now[$cat] = ($now[$cat] ?? 0) + $e->amount;
            } elseif (in_array($m, $prevMonths, true)) {
                $before[$cat] = ($before[$cat] ?? 0) + $e->amount;
                $anyBefore = true;
            }
        }

        $spikes = [];
        foreach ($now as $cat => $amount) {
            $usual = ($before[$cat] ?? 0) / 3;

            if ($usual > 0 && $amount > $usual * 1.5) {
                $spikes[] = ['category' => $cat, 'now' => round($amount, 2), 'usual' => round($usual, 2), 'new' => false];
            } elseif ($usual == 0 && $anyBefore && $amount > 0) {
                $spikes[] = ['category' => $cat, 'now' => round($amount, 2), 'usual' => 0, 'new' => true];
            }
        }

        if (count($spikes)) {
            usort($spikes, function ($a, $b) { return $b['now'] <=> $a['now']; });
            $tips[] = ['key' => 'spike', 'tone' => 'red', 'icon' => 'fa-arrow-trend-up', 'items' => array_slice($spikes, 0, 5)];
        }

        // ---------- Bachat ke liye: mahine ka average kharcha ----------
        $monthlyExp = 0;
        $counted = 0;
        foreach ($prevMonths as $m) {
            $sum = 0;
            foreach ($expenses as $e) {
                if (substr($e->date, 0, 7) === $m) {
                    $sum += $e->amount;
                }
            }
            if ($sum > 0) {
                $monthlyExp += $sum;
                $counted++;
            }
        }
        $monthlyExp = $counted ? $monthlyExp / $counted : $last30['expenses'];

        return response()->json([
            'pulse' => $pulse,
            'tips' => $tips,
            'base' => $last30,
            'plan' => [
                'profit' => $last30['profit'],
                'monthly_expenses' => round($monthlyExp, 2),
                'target' => round($monthlyExp * 3, 2),
            ],
        ]);
    }
}