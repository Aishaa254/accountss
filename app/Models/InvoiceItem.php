<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $fillable = ['invoice_id', 'product_id', 'name', 'description', 'qty', 'price', 'cost'];

    protected $casts = [
        'qty' => 'float',
        'price' => 'float',
        'cost' => 'float',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}