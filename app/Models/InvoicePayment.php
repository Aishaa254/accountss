<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoicePayment extends Model
{
    use \App\Models\Concerns\Auditable;

    protected $fillable = ['invoice_id', 'amount', 'date', 'account_id', 'method', 'reference'];

    protected $casts = [
        'amount' => 'float',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}