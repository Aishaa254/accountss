<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use \App\Models\Concerns\Auditable;
    protected $fillable = ['no', 'customer_id', 'date', 'due', 'discount', 'tax'];

protected $casts = [
    'discount' => 'float',
    'tax' => 'float',
];

public function items()
{
    return $this->hasMany(InvoiceItem::class);
}

public function customer()
{
    return $this->belongsTo(Customer::class);
}
public function payments()
{
    return $this->hasMany(InvoicePayment::class);
}
public function subtotal(): float
{
    return (float) $this->items->sum(function ($i) { return $i->qty * $i->price; });
}

public function total(): float
{
    $sub = $this->subtotal();
    $disc = min($this->discount, $sub);

    return round(($sub - $disc) * (1 + $this->tax / 100), 2);
}

public function paidAmount(): float
{
    return round((float) $this->payments->sum('amount'), 2);
}

public function balance(): float
{
    return max(round($this->total() - $this->paidAmount(), 2), 0);
}

public function status(): string
{
    if ($this->total() > 0 && $this->balance() < 1) { return 'Paid'; }
    if ($this->paidAmount() > 0) { return 'Partial'; }
    return 'Unpaid';
}
}
