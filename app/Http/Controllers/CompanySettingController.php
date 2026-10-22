<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\CompanySetting;

class CompanySettingController extends Controller
{
    public function save(Request $request)
    {
        // Phone numbers se space aur dash hata do (JS band ho tab bhi)
        foreach (['phone', 'contact_phone', 'whatsapp'] as $f) {
            if ($request->filled($f)) {
                $request->merge([$f => preg_replace('/[\s\-]/', '', $request->input($f))]);
            }
        }

        $phoneRegex  = '/^(\+92|0)(3\d{9}|[24-9]\d{8,9})$/';
        $mobileRegex = '/^(\+92|0)3\d{9}$/';

        if ($request->has('contact_phone')) {
            // ===== Contact Settings form =====
            $data = $request->validate([
                'contact_phone' => ['required', 'regex:' . $phoneRegex],
                'whatsapp'      => ['required', 'regex:' . $mobileRegex],
                'contact_email' => ['required', 'email:rfc', 'max:100'],
                'website'       => ['nullable', 'max:255', 'regex:/^(https?:\/\/)?(www\.)?[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}(\/\S*)?$/'],
            ], [
                'contact_phone.required' => 'Phone is required',
                'contact_phone.regex'    => 'Phone is not valid. Example: 03001234567 or 042-35123456',
                'whatsapp.regex'         => 'WhatsApp number is not valid. Example: 03001234567',
                'contact_email.required' => 'Email is required',
                'contact_email.email'    => 'Email is not valid. Example: name@example.com',
                'website.regex'          => 'Website is not valid. Example: www.example.com',
            ]);
        } else {
            // ===== Company Settings form =====
            $data = $request->validate([
                'company_name'        => ['required', 'string', 'min:3', 'max:100', "regex:/^[A-Za-z0-9][A-Za-z0-9 .,&'()\-]*$/"],
                'registration_number' => ['nullable', 'string', 'min:3', 'max:30', 'regex:/^[A-Za-z0-9\-\/]+$/'],
                'phone'               => ['required', 'regex:' . $phoneRegex],
                'email'               => ['required', 'email:rfc', 'max:100'],
                'address'             => ['nullable', 'string', 'min:5', 'max:255'],
                'date_format'         => ['nullable', Rule::in(['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD'])],
                'time_format'         => ['nullable', Rule::in(['12 Hour (02:30 PM)', '24 Hour (14:30)'])],
            ], [
                'company_name.required'     => 'Company name is required',
                'company_name.regex'        => "Company name can only have letters, numbers, spaces and . , & ' ( ) -",
                'registration_number.regex' => 'Registration number can only have letters, numbers, - and /',
                'phone.required'            => 'Phone number is required',
                'phone.regex'               => 'Phone number is not valid. Example: 03001234567 or 042-35123456',
                'email.required'            => 'Email is required',
                'email.email'               => 'Email is not valid. Example: name@example.com',
            ]);
        }

        // $data mein sirf usi form ke fields hain, is liye doosre form ka data safe rehta hai
        CompanySetting::updateOrCreate(['id' => 1], $data);
        return back()
        ->with('success', 'Company settings saved')
        ->with('open', $request->has('contact_phone') ? 'section-contact' : 'section-company');
    }
    public function info()
{
    $c = CompanySetting::first();

    return response()->json([
        'name' => $c->company_name ?? '',
        'address' => $c->address ?? '',
        'phone' => $c->phone ?? '',
    ]);
}
public function saveSystem(Request $request)
{
    $data = $request->validate([
        'currency' => 'required|in:PKR,USD,AED,SAR,EUR',
        'symbol_position' => 'required|in:before,after',
    ]);

    CompanySetting::updateOrCreate(['id' => 1], $data);

    return response()->json(['ok' => true]);
}
}