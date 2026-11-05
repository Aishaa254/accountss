<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountTransaction extends Model
{
    use \App\Models\Concerns\Auditable;

    protected $fillable = [
        'account_id', 'date', 'direction', 'amount', 'kind', 'method', 'reference', 'note',
        'source_type', 'source_id', 'transfer_key', 'created_by',
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}