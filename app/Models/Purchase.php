<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    protected $fillable = ['no', 'vendor_id', 'date', 'due', 'notes'];

public function items()
{
    return $this->hasMany(PurchaseItem::class);
}

public function payments()
{
    return $this->hasMany(PurchasePayment::class);
}

public function vendor()
{
    return $this->belongsTo(Vendor::class);
}
public function total(): float
{
    return round((float) $this->items->sum(function ($i) { return $i->qty * $i->price; }), 2);
}

public function paidAmount(): float
{
    return round((float) $this->payments->sum('amount'), 2);
}

public function balance(): float
{
    return max(round($this->total() - $this->paidAmount(), 2), 0);
}
}
