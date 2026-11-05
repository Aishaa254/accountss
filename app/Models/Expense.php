<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use \App\Models\Concerns\Auditable;

    protected $fillable = ['title', 'amount', 'date', 'category', 'method', 'note', 'account_id', 'reference'];

    protected $casts = [
        'amount' => 'float',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}