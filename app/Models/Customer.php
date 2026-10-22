<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = ['name', 'phone', 'whatsapp', 'email', 'city', 'address', 'limit', 'opening', 'notes', 'active'];

    protected $casts = [
        'limit' => 'float',
        'opening' => 'float',
        'active' => 'boolean',
    ];
    public function invoices()
{
    return $this->hasMany(Invoice::class);
}
}
