<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockAdjustment extends Model
{
    protected $fillable = ['product_id', 'qty', 'reason', 'date', 'note'];

protected $casts = [
    'qty' => 'float',
];
}
