<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoicePayment extends Model
{
    protected $fillable = ['invoice_id', 'amount', 'date'];

protected $casts = [
    'amount' => 'float',
];
}
