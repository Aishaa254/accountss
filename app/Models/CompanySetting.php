<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = ['company_name','registration_number','phone','email','date_format','time_format','address'];
}
