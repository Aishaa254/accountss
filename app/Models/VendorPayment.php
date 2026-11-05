<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorPayment extends Model
{
    use \App\Models\Concerns\Auditable;
    protected $fillable = ['vendor_id', 'amount', 'date', 'method', 'note', 'account_id', 'reference'];

protected $casts = [
    'amount' => 'float',
];
}
