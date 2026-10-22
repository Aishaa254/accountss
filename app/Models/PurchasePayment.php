<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchasePayment extends Model
{
    protected $fillable = ['purchase_id', 'amount', 'date', 'method'];

protected $casts = [
    'amount' => 'float',
];
}
