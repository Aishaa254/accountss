<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SettingController extends Controller
{
    /* =========================================================
     |  SHOW SETTINGS PAGE
     ========================================================= */
    public function index()
    {
        $brand    = Setting::group('brand');
        $system   = Setting::group('system');
        $company  = Setting::group('company');
        $currency = Setting::group('currency');
        $email    = Setting::group('email');
        $contact  = Setting::group('contact');

        return view('pages.settings.settings', compact(
            'brand', 'system', 'company', 'currency', 'email', 'contact'
        ));
    }

    /* =========================================================
     |  BRAND SETTINGS
     ========================================================= */
    public function saveBrand(Request $request)
    {
        $request->validate([
            'font' => ['nullable', 'string', Rule::in(['segoe', 'poppins', 'roboto', 'notoserif'])],
            'title_text' => ['nullable', 'string', 'min:2', 'max:255'],
            'footer_text' => ['nullable', 'string', 'max:255'],
            'theme_color' => [
                'nullable', 'string', 'max:20',
                function ($attribute, $value, $fail) {
                    $presets = ['emerald', 'ocean', 'purple', 'sunset', 'rose', 'sky'];
                    $isPreset = in_array($value, $presets, true);
                    $isHex = preg_match('/^#([A-Fa-f0-9]{3}){1,2}$/', $value);
                    if (!$isPreset && !$isHex) {
                        $fail('Theme color must be a preset or a valid hex code (e.g. #ff5500).');
                    }
                },
            ],
            'appearance' => ['nullable', Rule::in(['light', 'dark'])],
            'logo' => ['nullable', 'file', 'mimes:png,jpg,jpeg,svg', 'max:4096'],
        ], [
            'font.in' => 'Please choose a valid font.',
            'title_text.min' => 'Title must be at least 2 characters.',
            'title_text.max' => 'Title must not exceed 255 characters.',
            'appearance.in' => 'Appearance must be light or dark.',
            'logo.mimes' => 'Logo must be PNG, JPG, JPEG or SVG.',
            'logo.max' => 'Logo size must not exceed 4MB.',
        ]);

        $data = $request->only(['font', 'title_text', 'footer_text', 'theme_color', 'appearance']);
        $data = array_filter($data, fn ($v) => !is_null($v) && $v !== '');

        if ($request->hasFile('logo')) {
            $old = Setting::get('brand', 'logo');
            if ($old && Storage::disk('public')->exists($old)) {
                Storage::disk('public')->delete($old);
            }
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }

        Setting::saveGroup('brand', $data);

        return back()->with('success', 'Brand settings saved successfully.');
    }

    /* =========================================================
     |  SYSTEM SETTINGS
     ========================================================= */
    public function saveSystem(Request $request)
    {
        $request->validate([
            'language' => ['nullable', Rule::in(['English', 'Urdu', 'Arabic'])],
            'timezone' => ['nullable', 'string', 'max:100'],
            'date_format' => ['nullable', Rule::in(['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD'])],
            'time_format' => ['nullable', Rule::in(['12 Hour (02:30 PM)', '24 Hour (14:30)'])],
        ], [
            'language.in' => 'Invalid language selected.',
            'date_format.in' => 'Invalid date format.',
            'time_format.in' => 'Invalid time format.',
        ]);

        Setting::saveGroup('system', array_filter($request->only([
            'language', 'timezone', 'date_format', 'time_format',
        ]), fn ($v) => !is_null($v)));

        return back()->with('success', 'System settings saved successfully.');
    }

    /* =========================================================
     |  COMPANY SETTINGS
     ========================================================= */
    public function saveCompany(Request $request)
    {
        $request->validate([
            'company_name' => [
                'required', 'string', 'min:2', 'max:255',
                'regex:/^[A-Za-z0-9\s\.\,\-\&\'\(\)]+$/',
            ],
            'registration_number' => [
                'required', 'string', 'min:3', 'max:100',
                'regex:/^[A-Za-z0-9\-\/]+$/',
            ],
            'phone' => [
                'required', 'string', 'min:7', 'max:50',
                'regex:/^[0-9+\-\s()]+$/',
            ],
            'email' => [
                'required', 'email:rfc', 'max:255',
            ],
            'date_format' => ['nullable', Rule::in(['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD'])],
            'time_format' => ['nullable', Rule::in(['12 Hour (02:30 PM)', '24 Hour (14:30)'])],
            'address' => ['nullable', 'string', 'max:500'],
        ], [
            'company_name.required' => 'Company name is required.',
            'company_name.min' => 'Company name must be at least 2 characters.',
            'company_name.max' => 'Company name must not exceed 255 characters.',
            'company_name.regex' => 'Company name can only contain letters, numbers, spaces, and . , - & \' ( )',

            'registration_number.required' => 'Registration number is required.',
            'registration_number.min' => 'Registration number must be at least 3 characters.',
            'registration_number.max' => 'Registration number must not exceed 100 characters.',
            'registration_number.regex' => 'Registration number can only contain letters, numbers, - and /',

            'phone.required' => 'Phone number is required.',
            'phone.min' => 'Phone number must be at least 7 digits.',
            'phone.max' => 'Phone number must not exceed 50 characters.',
            'phone.regex' => 'Phone number can only contain digits and + - ( ) characters.',

            'email.required' => 'Company email is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.max' => 'Email must not exceed 255 characters.',

            'address.max' => 'Address must not exceed 500 characters.',
        ]);

        Setting::saveGroup('company', array_filter($request->only([
            'company_name', 'registration_number', 'phone',
            'email', 'date_format', 'time_format', 'address',
        ]), fn ($v) => !is_null($v)));

        return back()->with('success', 'Company settings saved successfully.');
    }

    /* =========================================================
     |  CURRENCY SETTINGS
     ========================================================= */
    public function saveCurrency(Request $request)
    {
        $request->validate([
            'currency' => ['nullable', 'string', Rule::in([
                'PKR - Pakistani Rupee',
                'USD - US Dollar',
                'AED - UAE Dirham',
                'SAR - Saudi Riyal',
                'EUR - Euro',
            ])],
            'symbol_position' => ['nullable', Rule::in([
                'Before amount (Rs 100)',
                'After amount (100 Rs)',
            ])],
        ], [
            'currency.in' => 'Invalid currency selected.',
            'symbol_position.in' => 'Invalid symbol position.',
        ]);

        Setting::saveGroup('currency', array_filter($request->only([
            'currency', 'symbol_position',
        ]), fn ($v) => !is_null($v)));

        return back()->with('success', 'Currency settings saved successfully.');
    }

    /* =========================================================
     |  EMAIL SETTINGS
     ========================================================= */
    public function saveEmail(Request $request)
    {
        $request->validate([
            'sender_name' => ['nullable', 'string', 'min:2', 'max:255'],
            'sender_email' => ['nullable', 'email:rfc', 'max:255'],
            'mail_server' => ['nullable', 'string', 'max:255'],
            'port' => ['nullable', 'numeric', 'between:1,65535'],
        ], [
            'sender_name.min' => 'Sender name must be at least 2 characters.',
            'sender_email.email' => 'Please enter a valid sender email.',
            'port.numeric' => 'Port must be a number.',
            'port.between' => 'Port must be between 1 and 65535.',
        ]);

        Setting::saveGroup('email', array_filter($request->only([
            'sender_name', 'sender_email', 'mail_server', 'port',
        ]), fn ($v) => !is_null($v)));

        return back()->with('success', 'Email settings saved successfully.');
    }

    /* =========================================================
     |  CONTACT SETTINGS
     ========================================================= */
    public function saveContact(Request $request)
    {
        $request->validate([
            'phone' => ['nullable', 'string', 'max:50', 'regex:/^[0-9+\-\s()]*$/'],
            'whatsapp' => ['nullable', 'string', 'max:50', 'regex:/^[0-9+\-\s()]*$/'],
            'email' => ['nullable', 'email:rfc', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
        ], [
            'phone.regex' => 'Phone number contains invalid characters.',
            'whatsapp.regex' => 'WhatsApp number contains invalid characters.',
            'email.email' => 'Please enter a valid email address.',
            'website.url' => 'Website must be a valid URL (e.g. https://example.com).',
        ]);

        Setting::saveGroup('contact', array_filter($request->only([
            'phone', 'whatsapp', 'email', 'website',
        ]), fn ($v) => !is_null($v)));

        return back()->with('success', 'Contact settings saved successfully.');
    }
}