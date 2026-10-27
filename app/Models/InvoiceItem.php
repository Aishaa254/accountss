<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $fillable = ['invoice_id', 'product_id', 'name', 'qty', 'price'];

    protected $casts = [
        'qty' => 'float',
        'price' => 'float',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}