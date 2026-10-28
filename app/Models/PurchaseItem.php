<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    protected $fillable = ['purchase_id', 'product_id', 'description', 'qty', 'price', 'sale_price'];

    protected $casts = [
        'qty' => 'float',
        'price' => 'float',
        'sale_price' => 'float',
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}