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

    // ---------- Brand: font, theme color, title, footer ----------
    public function saveBrand(Request $request)
    {
        $data = $request->validate([
            'brand_font' => ['required', Rule::in(['segoe', 'poppins', 'roboto', 'notoserif'])],
            'brand_theme' => ['required', Rule::in(['emerald', 'ocean', 'purple', 'sunset', 'rose', 'sky', 'custom'])],
            'brand_custom_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'brand_title' => ['required', 'string', 'min:2', 'max:60'],
            'brand_footer' => ['nullable', 'string', 'max:150'],
        ], [
            'brand_title.required' => 'Title cannot be empty.',
            'brand_title.min' => 'Title must be at least 2 characters.',
            'brand_custom_color.regex' => 'Custom color must look like #ff5500.',
        ]);

        if ($data['brand_theme'] === 'custom' && empty($data['brand_custom_color'])) {
            return response()->json(['message' => 'Choose a custom color first.'], 422);
        }

        CompanySetting::updateOrCreate(['id' => 1], $data);

        return response()->json(['ok' => true]);
    }

    // ---------- Brand: logo (saved as a file in public/uploads/brand) ----------
    public function saveLogo(Request $request)
    {
        $request->validate([
            'logo' => ['required', 'string', 'max:3000000'],
        ], [
            'logo.required' => 'Choose an image first.',
        ]);

        $logo = $request->input('logo');

        if (!preg_match('/^data:image\/(png|jpeg|svg\+xml);base64,/', $logo, $m)) {
            return response()->json(['message' => 'Only PNG, JPG or SVG images are allowed.'], 422);
        }

        $binary = base64_decode(substr($logo, strpos($logo, ',') + 1), true);

        if ($binary === false || strlen($binary) === 0) {
            return response()->json(['message' => 'This image could not be read.'], 422);
        }

        $types = ['png' => 'png', 'jpeg' => 'jpg', 'svg+xml' => 'svg'];
        $ext = $types[$m[1]];

        if ($ext === 'svg') {
            // An SVG must not carry scripts
            if (preg_match('/<script|javascript:|\son[a-z]+\s*=|<foreignObject/i', $binary)) {
                return response()->json(['message' => 'This SVG is not allowed. Please use a plain logo.'], 422);
            }
        } else {
            $info = @getimagesizefromstring($binary);
            $mime = $ext === 'png' ? 'image/png' : 'image/jpeg';

            if (!$info || $info['mime'] !== $mime) {
                return response()->json(['message' => 'This image could not be read.'], 422);
            }
        }

        $dir = public_path('uploads/brand');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $current = CompanySetting::first();
        if ($current && $current->brand_logo) {
            $this->deleteLogoFile($current->brand_logo);
        }

        $name = 'logo-' . time() . '.' . $ext;
        file_put_contents($dir . '/' . $name, $binary);

        CompanySetting::updateOrCreate(['id' => 1], ['brand_logo' => 'uploads/brand/' . $name]);

        return response()->json(['ok' => true, 'url' => asset('uploads/brand/' . $name)]);
    }

    public function removeLogo()
    {
        $current = CompanySetting::first();

        if ($current && $current->brand_logo) {
            $this->deleteLogoFile($current->brand_logo);
            $current->update(['brand_logo' => null]);
        }

        return response()->json(['ok' => true]);
    }

    private function deleteLogoFile($path)
    {
        if ($path && strpos($path, 'uploads/brand/') === 0 && strpos($path, '..') === false) {
            $full = public_path($path);

            if (is_file($full)) {
                @unlink($full);
            }
        }
    }
}