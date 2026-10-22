<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    protected $fillable = ['purchase_id', 'description', 'qty', 'price'];

protected $casts = [
    'qty' => 'float',
    'price' => 'float',
];
}
