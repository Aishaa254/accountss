<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    use \App\Models\Concerns\Auditable;
    protected $fillable = [
        'company_name', 'registration_number', 'phone', 'email', 'date_format', 'time_format', 'address',
        'contact_phone', 'whatsapp', 'contact_email', 'website', 'currency', 'symbol_position',
        'brand_font', 'brand_theme', 'brand_custom_color', 'brand_title', 'brand_footer', 'brand_logo',
    ];
}