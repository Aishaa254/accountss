<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use \App\Models\Concerns\Auditable;

    protected $fillable = ['name', 'type', 'bank_name', 'account_title', 'last4', 'opening', 'active', 'note', 'created_by'];

    protected $casts = [
        'opening' => 'float',
        'active' => 'boolean',
        'is_system' => 'boolean',
    ];

    public function transactions()
    {
        return $this->hasMany(AccountTransaction::class);
    }

    public static function cash(): self
    {
        return static::where('type', 'cash')->where('is_system', true)->firstOrFail();
    }

    // Baqi rakam kahin save nahi hoti, hamesha entries se nikalti hai
    public function balance(): float
    {
        $in = (float) $this->transactions()->where('direction', 'in')->sum('amount');
        $out = (float) $this->transactions()->where('direction', 'out')->sum('amount');

        return round($this->opening + $in - $out, 2);
    }
}