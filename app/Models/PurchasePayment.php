<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchasePayment extends Model
{
    use \App\Models\Concerns\Auditable;
    protected $fillable = ['purchase_id', 'amount', 'date', 'method', 'account_id', 'reference'];

protected $casts = [
    'amount' => 'float',
];
}
