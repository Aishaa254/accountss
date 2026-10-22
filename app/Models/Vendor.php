<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    protected $fillable = ['name','company','category','phone','email','city','address','notes','status','terms','opening','pinned'];

protected $casts = [
    'terms' => 'integer',
    'opening' => 'float',
    'pinned' => 'boolean',
];
    public function payments()
{
    return $this->hasMany(VendorPayment::class);
}
public function purchases()
{
    return $this->hasMany(Purchase::class);
}
}
