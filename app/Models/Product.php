<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use \App\Models\Concerns\Auditable;
    protected $fillable = ['name', 'sku', 'category', 'unit', 'cost_price', 'sale_price', 'opening_stock', 'reorder_level', 'active', 'notes', 'image'];

    protected $casts = [
        'cost_price' => 'float',
        'sale_price' => 'float',
        'opening_stock' => 'float',
        'reorder_level' => 'float',
        'active' => 'boolean',
    ];

    public function adjustments()
    {
        return $this->hasMany(StockAdjustment::class);
    }

    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function stock(): float
    {
        return round(
            $this->opening_stock
            + $this->purchaseItems->sum('qty')
            - $this->invoiceItems->sum('qty')
            + $this->adjustments->sum('qty'),
            4
        );
    }
}