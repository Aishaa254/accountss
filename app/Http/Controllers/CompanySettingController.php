<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CompanySetting;

class CompanySettingController extends Controller
{
    public function save(Request $request)
{
    $data = $request->validate([
        'company_name' => 'nullable|string|max:255',
        'registration_number' => 'nullable|string|max:255',
        'phone' => 'nullable|string|max:50',
        'email' => 'nullable|email',
        'date_format' => 'nullable|string',
        'time_format' => 'nullable|string',
        'address' => 'nullable|string',
    ]);

    CompanySetting::updateOrCreate(['id' => 1], $data);

    return back()->with('success', 'Company settings saved');
}
}
