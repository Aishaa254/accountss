@extends('layout.app')

@section('title', 'Settings')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/settings/settings.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/settings/settings.js') }}" defer></script>
@endpush

@section('content')
<h1 class="settings-title">Settings</h1>
<p class="settings-text">Manage your system settings.</p>

{{-- ============ ALERTS ============ --}}
@if (session('success'))
    <div class="alert alert-success">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ session('success') }}</span>
    </div>
@endif
@if ($errors->any())
    <div class="alert alert-danger">
        <i class="fa-solid fa-circle-exclamation"></i>
        <ul class="mb-0 mt-1">
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

@php
    $savedFont   = $brand['font'] ?? 'segoe';
    $savedTheme  = $brand['theme_color'] ?? 'emerald';
    $savedMode   = $brand['appearance'] ?? 'light';
    $isCustomHex = preg_match('/^#/', $savedTheme) ? $savedTheme : '';
@endphp

<div class="settings-page">

    <div class="settings-menu">
        <p class="settings-group">Core Configuration</p>
        <a href="#" class="settings-link active" data-section="section-brand"><i class="fa-solid fa-palette"></i> Brand Settings</a>
        <a href="#" class="settings-link" data-section="section-system"><i class="fa-solid fa-gear"></i> System Settings</a>
        <a href="#" class="settings-link" data-section="section-company"><i class="fa-solid fa-building"></i> Company Settings</a>
        <a href="#" class="settings-link" data-section="section-currency"><i class="fa-solid fa-dollar-sign"></i> Currency Settings</a>

        <p class="settings-group">Integrations &amp; Contact</p>
        <a href="#" class="settings-link" data-section="section-email"><i class="fa-solid fa-envelope"></i> Email Settings</a>
        <a href="#" class="settings-link" data-section="section-contact"><i class="fa-solid fa-phone"></i> Contact Settings</a>
    </div>

    <div class="settings-main">

        {{-- ================================================
             BRAND SETTINGS
        ================================================= --}}
        <div class="section active" id="section-brand">
            <form action="{{ route('settings.brand') }}" method="POST" enctype="multipart/form-data">
                @csrf
                <div class="settings-card">
                    <div class="settings-top">
                        <div>
                            <h3 class="settings-heading"><i class="fa-solid fa-palette"></i> Brand Settings</h3>
                            <p class="settings-small">Customize your application's branding and appearance</p>
                        </div>
                        <button type="submit" class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                    </div>

                    <div class="tabs">
                        <button type="button" class="tab-btn active" data-tab="tab-font"><i class="fa-solid fa-font"></i> Font</button>
                        <button type="button" class="tab-btn" data-tab="tab-text"><i class="fa-regular fa-file"></i> Text</button>
                        <button type="button" class="tab-btn" data-tab="tab-theme"><i class="fa-solid fa-gear"></i> Theme</button>
                        <button type="button" class="tab-btn" data-tab="tab-logo"><i class="fa-regular fa-image"></i> Logo</button>
                    </div>

                    <input type="hidden" name="font"        id="input-font"        value="{{ $savedFont }}">
                    <input type="hidden" name="theme_color" id="input-theme-color" value="{{ $savedTheme }}">
                    <input type="hidden" name="appearance"  id="input-appearance"  value="{{ $savedMode }}">

                    {{-- FONT TAB --}}
                    <div class="tab-panel active" id="tab-font">
                        <h4 class="sub-heading">Website Font</h4>
                        <p class="hint">Select your font.</p>
                        <div class="font-row">
                            <button type="button" class="font-btn {{ $savedFont === 'segoe' ? 'active' : '' }}" data-font="segoe" style="font-family:'Segoe UI', Arial, sans-serif;">Segoe UI</button>
                            <button type="button" class="font-btn {{ $savedFont === 'poppins' ? 'active' : '' }}" data-font="poppins" style="font-family:'Poppins', sans-serif;">Poppins</button>
                            <button type="button" class="font-btn {{ $savedFont === 'roboto' ? 'active' : '' }}" data-font="roboto" style="font-family:'Roboto', sans-serif;">Roboto</button>
                            <button type="button" class="font-btn {{ $savedFont === 'notoserif' ? 'active' : '' }}" data-font="notoserif" style="font-family:'Noto Serif', serif;">Noto Serif</button>
                        </div>
                    </div>

                    {{-- TEXT TAB --}}
                    <div class="tab-panel" id="tab-text">
                        <label class="label">Title Text</label>
                        <input type="text" name="title_text" class="text-input"
                               minlength="2" maxlength="255"
                               value="{{ old('title_text', $brand['title_text'] ?? 'AccountGo') }}"
                               placeholder="AccountGo">
                        <p class="hint">2–255 characters. Application title displayed in the browser tab</p>

                        <label class="label">Footer Text</label>
                        <input type="text" name="footer_text" class="text-input"
                               maxlength="255"
                               value="{{ old('footer_text', $brand['footer_text'] ?? 'Copyright © AccountGo') }}"
                               placeholder="Copyright © AccountGo">
                        <p class="hint">Max 255 characters. Text displayed in the footer</p>
                    </div>

                    {{-- THEME TAB --}}
                    <div class="tab-panel" id="tab-theme">
                        <div class="theme-top">
                            <h4 class="sub-heading">Theme Color</h4>
                            <button type="button" class="reset-btn" id="reset-theme"><i class="fa-solid fa-rotate-left"></i> Reset to Default</button>
                        </div>

                        <div class="color-grid">
                            @foreach (['emerald' => 'Emerald', 'ocean' => 'Ocean Blue', 'purple' => 'Royal Purple', 'sunset' => 'Sunset Orange', 'rose' => 'Rose', 'sky' => 'Cyan Sky'] as $key => $label)
                                <button type="button" class="color-box {{ $savedTheme === $key ? 'active' : '' }}" data-theme="{{ $key }}">
                                    <span class="color-dot dot-{{ $key }}"></span>
                                    <span class="color-name">{{ $label }}</span>
                                </button>
                            @endforeach
                        </div>

                        <div class="custom-color-row">
                            <h4 class="sub-heading">Custom Color</h4>
                            <div class="custom-color-box">
                                <input type="text" id="customColor"
                                       placeholder="#ff5500"
                                       maxlength="7"
                                       pattern="^#([A-Fa-f0-9]{3}){1,2}$"
                                       title="Hex code like #ff5500 or #f50"
                                       value="{{ $isCustomHex }}">
                                <button type="button" class="save-color-btn" id="saveColor">Save Color</button>
                            </div>
                            <p class="color-hint">Write your own color code like #ff5500</p>
                            <p class="color-msg" id="colorMsg"></p>
                        </div>

                        <h4 class="sub-heading">Appearance Mode</h4>
                        <div class="mode-row">
                            <button type="button" class="mode-btn {{ $savedMode === 'light' ? 'active' : '' }}" data-mode="light"><i class="fa-regular fa-sun"></i> Light</button>
                            <button type="button" class="mode-btn {{ $savedMode === 'dark' ? 'active' : '' }}" data-mode="dark"><i class="fa-regular fa-moon"></i> Dark</button>
                        </div>
                    </div>

                    {{-- LOGO TAB --}}
                    <div class="tab-panel" id="tab-logo">
                        <h4 class="sub-heading">Company Logo</h4>
                        <p class="hint">Choose your logo and check how it looks in Light and Dark mode, then save.</p>

                        <input type="file" name="logo" id="lgFile"
                               accept="image/png,image/jpeg,image/svg+xml" hidden>

                        <div class="lg-previews">
                            <div class="lg-card">
                                <span class="lg-label"><i class="fa-regular fa-sun"></i> Light Mode</span>
                                <div class="lg-box lg-light">
                                    <span class="lg-empty" style="{{ !empty($brand['logo']) ? 'display:none' : '' }}">No logo</span>
                                    <img class="lg-img" alt="Logo in light mode"
                                         src="{{ !empty($brand['logo']) ? asset('storage/'.$brand['logo']) : '' }}"
                                         style="{{ !empty($brand['logo']) ? '' : 'display:none' }}">
                                </div>
                            </div>
                            <div class="lg-card">
                                <span class="lg-label"><i class="fa-regular fa-moon"></i> Dark Mode</span>
                                <div class="lg-box lg-dark">
                                    <span class="lg-empty" style="{{ !empty($brand['logo']) ? 'display:none' : '' }}">No logo</span>
                                    <img class="lg-img" alt="Logo in dark mode"
                                         src="{{ !empty($brand['logo']) ? asset('storage/'.$brand['logo']) : '' }}"
                                         style="{{ !empty($brand['logo']) ? '' : 'display:none' }}">
                                </div>
                            </div>
                        </div>

                        <div class="logo-actions">
                            <button type="button" class="reset-btn" id="lgChoose">Choose Image</button>
                            <button type="submit" class="save-btn" id="lgSave">Save Logo</button>
                            <button type="button" class="reset-btn" id="lgRemove">Remove</button>
                        </div>
                        <p class="hint">PNG, JPG or SVG, max 4MB (big images are resized automatically)</p>
                        <p class="lg-msg" id="lgMsg"></p>
                    </div>
                </div>
            </form>
        </div>

        {{-- ================================================
             SYSTEM SETTINGS
        ================================================= --}}
        <div class="section" id="section-system">
            <form action="{{ route('settings.system') }}" method="POST">
                @csrf
                <div class="settings-card">
                    <div class="settings-top">
                        <div>
                            <h3 class="settings-heading"><i class="fa-solid fa-gear"></i> System Settings</h3>
                            <p class="settings-small">Configure system-wide settings for your application</p>
                        </div>
                        <button type="submit" class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                    </div>
                    <div class="two-cols">
                        <div>
                            <label class="label">Default Language</label>
                            <select class="text-input" name="language">
                                @foreach (['English', 'Urdu', 'Arabic'] as $lang)
                                    <option {{ old('language', $system['language'] ?? '') === $lang ? 'selected' : '' }}>{{ $lang }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div>
                            <label class="label">Time Zone</label>
                            <select class="text-input" name="timezone">
                                @foreach (['Asia/Karachi', 'Asia/Dubai', 'UTC'] as $tz)
                                    <option {{ old('timezone', $system['timezone'] ?? '') === $tz ? 'selected' : '' }}>{{ $tz }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div>
                            <label class="label">Date Format</label>
                            <select class="text-input" name="date_format">
                                @foreach (['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD'] as $df)
                                    <option {{ old('date_format', $system['date_format'] ?? '') === $df ? 'selected' : '' }}>{{ $df }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div>
                            <label class="label">Time Format</label>
                            <select class="text-input" name="time_format">
                                @foreach (['12 Hour (02:30 PM)', '24 Hour (14:30)'] as $tf)
                                    <option {{ old('time_format', $system['time_format'] ?? '') === $tf ? 'selected' : '' }}>{{ $tf }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                </div>
            </form>
        </div>

        {{-- ================================================
             COMPANY SETTINGS
        ================================================= --}}
        <div class="section" id="section-company">
            <form action="{{ route('settings.company') }}" method="POST" novalidate id="companyForm">
                @csrf
                <div class="settings-card">
                    <div class="settings-top">
                        <div>
                            <h3 class="settings-heading"><i class="fa-solid fa-building"></i> Company Settings</h3>
                            <p class="settings-small">Your company details shown on invoices</p>
                        </div>
                        <button type="submit" class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                    </div>

                    <div class="two-cols">
                        {{-- Company Name --}}
                        <div>
                            <label class="label">Company Name <span class="required-star">*</span></label>
                            <input type="text"
                                   class="text-input @error('company_name') is-invalid @enderror"
                                   name="company_name"
                                   value="{{ old('company_name', $company['company_name'] ?? '') }}"
                                   required
                                   minlength="2"
                                   maxlength="255"
                                   pattern="[A-Za-z0-9\s\.\,\-\&\'\(\)]+"
                                   title="2–255 characters. Only letters, numbers, spaces, and . , - & ' ( ) allowed"
                                   placeholder="Your company name">
                            @error('company_name')
                                <p class="field-error">{{ $message }}</p>
                            @enderror
                        </div>

                        {{-- Registration Number --}}
                        <div>
                            <label class="label">Registration Number <span class="required-star">*</span></label>
                            <input type="text"
                                   class="text-input @error('registration_number') is-invalid @enderror"
                                   name="registration_number"
                                   value="{{ old('registration_number', $company['registration_number'] ?? '') }}"
                                   required
                                   minlength="3"
                                   maxlength="100"
                                   pattern="[A-Za-z0-9\-\/]+"
                                   title="3–100 characters. Only letters, numbers, - and / allowed"
                                   placeholder="Registration number">
                            @error('registration_number')
                                <p class="field-error">{{ $message }}</p>
                            @enderror
                        </div>

                        {{-- Phone --}}
                        <div>
                            <label class="label">Phone Number <span class="required-star">*</span></label>
                            <input type="tel"
                                   class="text-input @error('phone') is-invalid @enderror"
                                   name="phone"
                                   value="{{ old('phone', $company['phone'] ?? '') }}"
                                   required
                                   minlength="7"
                                   maxlength="50"
                                   pattern="[0-9+\-\s()]+"
                                   title="7–50 characters. Only digits and + - ( ) allowed"
                                   placeholder="+92 300 1234567">
                            @error('phone')
                                <p class="field-error">{{ $message }}</p>
                            @enderror
                        </div>

                        {{-- Email --}}
                        <div>
                            <label class="label">Company Email <span class="required-star">*</span></label>
                            <input type="email"
                                   class="text-input @error('email') is-invalid @enderror"
                                   name="email"
                                   value="{{ old('email', $company['email'] ?? '') }}"
                                   required
                                   maxlength="255"
                                   title="Valid email like name@example.com"
                                   placeholder="company@example.com">
                            @error('email')
                                <p class="field-error">{{ $message }}</p>
                            @enderror
                        </div>

                        {{-- Date Format --}}
                        <div>
                            <label class="label">Date Format</label>
                            <select class="text-input" name="date_format">
                                @foreach (['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD'] as $df)
                                    <option {{ old('date_format', $company['date_format'] ?? '') === $df ? 'selected' : '' }}>{{ $df }}</option>
                                @endforeach
                            </select>
                        </div>

                        {{-- Time Format --}}
                        <div>
                            <label class="label">Time Format</label>
                            <select class="text-input" name="time_format">
                                @foreach (['12 Hour (02:30 PM)', '24 Hour (14:30)'] as $tf)
                                    <option {{ old('time_format', $company['time_format'] ?? '') === $tf ? 'selected' : '' }}>{{ $tf }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>

                    {{-- Address --}}
                    <label class="label">Address</label>
                    <input type="text"
                           class="text-input @error('address') is-invalid @enderror"
                           name="address"
                           value="{{ old('address', $company['address'] ?? '') }}"
                           maxlength="500"
                           title="Max 500 characters"
                           placeholder="Company address">
                    @error('address')
                        <p class="field-error">{{ $message }}</p>
                    @enderror
                </div>
            </form>
        </div>

        {{-- ================================================
             CURRENCY SETTINGS
        ================================================= --}}
        <div class="section" id="section-currency">
            <form action="{{ route('settings.currency') }}" method="POST">
                @csrf
                <div class="settings-card">
                    <div class="settings-top">
                        <div>
                            <h3 class="settings-heading"><i class="fa-solid fa-dollar-sign"></i> Currency Settings</h3>
                            <p class="settings-small">Choose how money is shown</p>
                        </div>
                        <button type="submit" class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                    </div>
                    <div class="two-cols">
                        <div>
                            <label class="label">Currency</label>
                            <select class="text-input" name="currency">
                                @foreach (['PKR - Pakistani Rupee', 'USD - US Dollar', 'AED - UAE Dirham', 'SAR - Saudi Riyal', 'EUR - Euro'] as $cur)
                                    <option {{ old('currency', $currency['currency'] ?? '') === $cur ? 'selected' : '' }}>{{ $cur }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div>
                            <label class="label">Symbol Position</label>
                            <select class="text-input" name="symbol_position">
                                @foreach (['Before amount (Rs 100)', 'After amount (100 Rs)'] as $sp)
                                    <option {{ old('symbol_position', $currency['symbol_position'] ?? '') === $sp ? 'selected' : '' }}>{{ $sp }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                </div>
            </form>
        </div>

        {{-- ================================================
             EMAIL SETTINGS
        ================================================= --}}
        <div class="section" id="section-email">
            <form action="{{ route('settings.email') }}" method="POST" novalidate id="emailForm">
                @csrf
                <div class="settings-card">
                    <div class="settings-top">
                        <div>
                            <h3 class="settings-heading"><i class="fa-solid fa-envelope"></i> Email Settings</h3>
                            <p class="settings-small">Emails sent to your clients come from here</p>
                        </div>
                        <button type="submit" class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                    </div>
                    <div class="two-cols">
                        <div>
                            <label class="label">Sender Name</label>
                            <input type="text" class="text-input" name="sender_name"
                                   minlength="2" maxlength="255"
                                   title="2–255 characters"
                                   value="{{ old('sender_name', $email['sender_name'] ?? '') }}"
                                   placeholder="Sender name">
                        </div>
                        <div>
                            <label class="label">Sender Email</label>
                            <input type="email" class="text-input" name="sender_email"
                                   maxlength="255"
                                   title="Valid email like name@example.com"
                                   value="{{ old('sender_email', $email['sender_email'] ?? '') }}"
                                   placeholder="sender@example.com">
                        </div>
                        <div>
                            <label class="label">Mail Server</label>
                            <input type="text" class="text-input" name="mail_server"
                                   maxlength="255"
                                   title="Max 255 characters, e.g. smtp.gmail.com"
                                   value="{{ old('mail_server', $email['mail_server'] ?? '') }}"
                                   placeholder="smtp.example.com">
                        </div>
                        <div>
                            <label class="label">Port</label>
                            <input type="number" class="text-input" name="port"
                                   min="1" max="65535" step="1"
                                   title="Number between 1 and 65535"
                                   value="{{ old('port', $email['port'] ?? '') }}"
                                   placeholder="587">
                        </div>
                    </div>
                </div>
            </form>
        </div>

        {{-- ================================================
             CONTACT SETTINGS
        ================================================= --}}
        <div class="section" id="section-contact">
            <form action="{{ route('settings.contact') }}" method="POST" novalidate id="contactForm">
                @csrf
                <div class="settings-card">
                    <div class="settings-top">
                        <div>
                            <h3 class="settings-heading"><i class="fa-solid fa-phone"></i> Contact Settings</h3>
                            <p class="settings-small">How your clients can reach you</p>
                        </div>
                        <button type="submit" class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                    </div>
                    <div class="two-cols">
                        <div>
                            <label class="label">Phone</label>
                            <input type="tel" class="text-input" name="phone"
                                   pattern="[0-9+\-\s()]+"
                                   minlength="7" maxlength="50"
                                   title="7–50 characters. Only digits and + - ( ) allowed"
                                   value="{{ old('phone', $contact['phone'] ?? '') }}"
                                   placeholder="+92 300 1234567">
                        </div>
                        <div>
                            <label class="label">WhatsApp</label>
                            <input type="tel" class="text-input" name="whatsapp"
                                   pattern="[0-9+\-\s()]+"
                                   minlength="7" maxlength="50"
                                   title="7–50 characters. Only digits and + - ( ) allowed"
                                   value="{{ old('whatsapp', $contact['whatsapp'] ?? '') }}"
                                   placeholder="+92 300 1234567">
                        </div>
                        <div>
                            <label class="label">Email</label>
                            <input type="email" class="text-input" name="email"
                                   maxlength="255"
                                   title="Valid email like name@example.com"
                                   value="{{ old('email', $contact['email'] ?? '') }}"
                                   placeholder="contact@example.com">
                        </div>
                        <div>
                            <label class="label">Website</label>
                            <input type="url" class="text-input" name="website"
                                   maxlength="255"
                                   title="Valid URL like https://example.com"
                                   value="{{ old('website', $contact['website'] ?? '') }}"
                                   placeholder="https://example.com">
                        </div>
                    </div>
                </div>
            </form>
        </div>

    </div>
</div>
@endsection