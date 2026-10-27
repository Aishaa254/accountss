<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use \App\Models\Concerns\Auditable;
    protected $fillable = ['title', 'amount', 'date', 'category', 'method', 'note'];

protected $casts = [
    'amount' => 'float',
];
}
