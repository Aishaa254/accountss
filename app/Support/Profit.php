<?php

namespace App\Support;

use App\Models\Invoice;

/**
 * Asli profit ka hisaab (ek hi jagah, taake Reports, Dashboard aur Advisor teeno ek jaise numbers dikhayein).
 *
 * Revenue = qty x price, discount ke baad, tax ke baghair.
 * Cost    = bechte waqt save hui cost (invoice_items.cost).
 *           Agar wo 0 hai to product ki maujooda cost_price (estimated).
 *           Agar wo bhi nahi mili to cost "unknown" hai.
 */
class Profit
{
    /**
     * Ek invoice ke har item ki line. Invoice ke saath items.product aur customer load hone chahiye.
     */
    public static function lines(Invoice $invoice): array
    {
        $sub = $invoice->subtotal();
        $disc = min((float) $invoice->discount, $sub);
        $customer = $invoice->customer ? $invoice->customer->name : '';
        $out = [];

        foreach ($invoice->items as $item) {
            $gross = $item->qty * $item->price;
            // Discount ko items mein unke hisse ke hisaab se baant diya
            $revenue = $sub > 0 ? $gross - ($disc * $gross / $sub) : 0;

            $unitCost = (float) $item->cost;
            $estimated = false;

            if ($unitCost <= 0 && $item->product) {
                $unitCost = (float) $item->product->cost_price;
                $estimated = $unitCost > 0;
            }

            $out[] = [
                'date' => $invoice->date,
                'invoice' => $invoice->no,
                'customer_id' => $invoice->customer_id,
                'customer' => $customer,
                'product_id' => $item->product_id,
                'product' => $item->name,
                'qty' => (float) $item->qty,
                'revenue' => round($revenue, 2),
                'cost' => round($unitCost * $item->qty, 2),
                'estimated' => $estimated,
                'unknown' => $unitCost <= 0,
            ];
        }

        return $out;
    }

    /**
     * Saari invoices ki lines ek hi list mein.
     */
    public static function allLines($invoices): array
    {
        $out = [];

        foreach ($invoices as $invoice) {
            foreach (self::lines($invoice) as $line) {
                $out[] = $line;
            }
        }

        return $out;
    }
}