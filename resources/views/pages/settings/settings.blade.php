@extends('layout.app')

@section('title', 'Settings')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/settings/settings.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/settings/settings.js') }}"></script>
@endpush

@section('content')
<h1 class="settings-title">Settings</h1>
<p class="settings-text">Manage your system settings.</p>

@if(session('success'))
<div class="alert alert-success">{{ session('success') }}</div>
@endif

<div class="settings-page" data-open="{{ session('open') }}">

    <div class="settings-menu">
        <p class="settings-group">Core Configuration</p>
        <a href="#" class="settings-link active" data-section="section-brand"><i class="fa-solid fa-palette"></i> Brand Settings</a>
        <a href="#" class="settings-link" data-section="section-system"><i class="fa-solid fa-gear"></i> System Settings</a>
        <a href="#" class="settings-link" data-section="section-company"><i class="fa-solid fa-building"></i> Company Settings</a>
        <p class="settings-group">Integrations &amp; Contact</p>
        <a href="#" class="settings-link" data-section="section-contact"><i class="fa-solid fa-phone"></i> Contact Settings</a>
    </div>

    <div class="settings-main">

        <!-- ========== BRAND SETTINGS ========== -->
        <div class="section active" id="section-brand">
            <div class="settings-card">
                <div class="settings-top">
                    <div>
                        <h3 class="settings-heading"><i class="fa-solid fa-palette"></i> Brand Settings</h3>
                        <p class="settings-small">Customize your application's branding and appearance</p>
                    </div>
                    <button class="save-btn" id="brandSave"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                </div>

                <div class="tabs">
                    <button class="tab-btn active" data-tab="tab-font"><i class="fa-solid fa-font"></i> Font</button>
                    <button class="tab-btn" data-tab="tab-text"><i class="fa-regular fa-file"></i> Text</button>
                    <button class="tab-btn" data-tab="tab-theme"><i class="fa-solid fa-gear"></i> Theme</button>
                    <button class="tab-btn" data-tab="tab-logo"><i class="fa-regular fa-image"></i> Logo</button>
                </div>

                <div class="tab-panel active" id="tab-font">
                    <h4 class="sub-heading">Website Font</h4>
                    <p class="hint">Select your font.</p>
                    <div class="font-row">
                        <button type="button" class="font-btn" data-font="segoe" style="font-family:'Segoe UI', Arial, sans-serif;">Segoe UI</button>
                        <button type="button" class="font-btn" data-font="poppins" style="font-family:'Poppins', sans-serif;">Poppins</button>
                        <button type="button" class="font-btn" data-font="roboto" style="font-family:'Roboto', sans-serif;">Roboto</button>
                        <button type="button" class="font-btn" data-font="notoserif" style="font-family:'Noto Serif', serif;">Noto Serif</button>
                    </div>
                </div>

                <div class="tab-panel" id="tab-text">
                    <label class="label">Title Text</label>
                    <input type="text" class="text-input" id="titleText" value="AccountPro">
                    <p class="hint">Application title displayed in the browser tab</p>

                    <label class="label">Footer Text</label>
                    <input type="text" class="text-input" id="footerText" value="Copyright © AccountPro">
                    <p class="hint">Text displayed in the footer</p>
                </div>
                <div class="tab-panel" id="tab-theme">
                    <div class="theme-top">
                        <h4 class="sub-heading">Theme Color</h4>
                        <button class="reset-btn" id="reset-theme"><i class="fa-solid fa-rotate-left"></i> Reset to Default</button>
                    </div>

                    <div class="color-grid">
                        <button class="color-box" data-theme="emerald"><span class="color-dot dot-emerald"></span><span class="color-name">Emerald</span></button>
                        <button class="color-box" data-theme="ocean"><span class="color-dot dot-ocean"></span><span class="color-name">Ocean Blue</span></button>
                        <button class="color-box" data-theme="purple"><span class="color-dot dot-purple"></span><span class="color-name">Royal Purple</span></button>
                        <button class="color-box" data-theme="sunset"><span class="color-dot dot-sunset"></span><span class="color-name">Sunset Orange</span></button>
                        <button class="color-box" data-theme="rose"><span class="color-dot dot-rose"></span><span class="color-name">Rose</span></button>
                        <button class="color-box" data-theme="sky"><span class="color-dot dot-sky"></span><span class="color-name">Cyan Sky</span></button>
                    </div>
                    <div class="custom-color-row">
                        <h4 class="sub-heading">Custom Color</h4>
                        <div class="custom-color-box">
                            <input type="text" id="customColor" placeholder="#ff5500" maxlength="7">
                            <button type="button" class="save-color-btn" id="saveColor">Save Color</button>
                        </div>
                        <p class="color-hint">Write your own color code like #ff5500</p>
                        <p class="color-msg" id="colorMsg"></p>
                    </div>
                    <h4 class="sub-heading">Appearance Mode</h4>
                    <div class="mode-row">
                        <button class="mode-btn" data-mode="light"><i class="fa-regular fa-sun"></i> Light</button>
                        <button class="mode-btn" data-mode="dark"><i class="fa-regular fa-moon"></i> Dark</button>
                    </div>
                </div>

                <div class="tab-panel" id="tab-logo">
                    <h4 class="sub-heading">Company Logo</h4>
                    <p class="hint">Choose your logo and check how it looks in Light and Dark mode, then save.</p>

                    <input type="file" id="lgFile" accept="image/png,image/jpeg,image/svg+xml" hidden>

                    <div class="lg-previews">
                        <div class="lg-card">
                            <span class="lg-label"><i class="fa-regular fa-sun"></i> Light Mode</span>
                            <div class="lg-box lg-light">
                                <span class="lg-empty">No logo</span>
                                <img class="lg-img" alt="Logo in light mode">
                            </div>
                        </div>
                        <div class="lg-card">
                            <span class="lg-label"><i class="fa-regular fa-moon"></i> Dark Mode</span>
                            <div class="lg-box lg-dark">
                                <span class="lg-empty">No logo</span>
                                <img class="lg-img" alt="Logo in dark mode">
                            </div>
                        </div>
                    </div>

                    <div class="logo-actions">
                        <button type="button" class="reset-btn" id="lgChoose">Choose Image</button>
                        <button type="button" class="save-btn" id="lgSave">Save Logo</button>
                        <button type="button" class="reset-btn" id="lgRemove">Remove</button>
                    </div>
                    <p class="hint">PNG, JPG or SVG, any size (big images are resized automatically)</p>
                    <p class="lg-msg" id="lgMsg"></p>
                </div>
            </div>
        </div>

        <!-- ========== SYSTEM SETTINGS ========== -->
        <div class="section" id="section-system">
            <div class="settings-card">
                <div class="settings-top">
                    <div>
                        <h3 class="settings-heading"><i class="fa-solid fa-gear"></i> System Settings</h3>
                        <p class="settings-small">Configure system-wide settings. Date and time formats apply wherever they are shown in the system.</p>
                    </div>
                    <button class="save-btn" id="systemSave"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                </div>
                <div class="two-cols">

                    <div>
                        <label class="label">Time Zone</label>
                        <select class="text-input">
                            <option>Asia/Karachi</option>
                            <option>Asia/Dubai</option>
                            <option>UTC</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">Date Format</label>
                        <select class="text-input" id="dateFormat" name="date_format">
                            <option>DD-MM-YYYY</option>
                            <option>MM-DD-YYYY</option>
                            <option>YYYY-MM-DD</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">Time Format</label>
                        <select class="text-input" id="timeFormat" name="time_format">
                            <option>12 Hour (02:30 PM)</option>
                            <option>24 Hour (14:30)</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">Currency</label>
                        <select class="text-input" id="currency" name="currency">
                            <option value="PKR">PKR - Pakistani Rupee</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="AED">AED - UAE Dirham</option>
                            <option value="SAR">SAR - Saudi Riyal</option>
                            <option value="EUR">EUR - Euro</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">Symbol Position</label>
                        <select class="text-input" id="symbolPosition" name="symbol_position">
                            <option value="before">Before amount (Rs 100)</option>
                            <option value="after">After amount (100 Rs)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- ========== COMPANY SETTINGS ========== -->
        <div class="section" id="section-company">
            <div class="settings-card">
                <form method="POST" action="{{ route('company.save') }}" id="companyForm" class="validate-form" novalidate>
                    @csrf
                    <div class="settings-top">
                        <div>
                            <h3 class="settings-heading"><i class="fa-solid fa-building"></i> Company Settings</h3>
                            <p class="settings-small">Your company details shown on invoices</p>
                        </div>
                        <button type="submit" class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                    </div>

                    <div class="two-cols">
                        <div class="field">
                            <label class="label" for="companyName">Company Name <span class="required-star">*</span></label>
                            <input type="text" class="text-input @error('company_name') is-invalid @enderror" id="companyName" name="company_name"
                                placeholder="Your company name" maxlength="100" data-rule="name" data-label="Company name" data-required="1"
                                value="{{ old('company_name', $company->company_name ?? '') }}">
                            @error('company_name')<small class="field-error">{{ $message }}</small>@enderror
                        </div>

                        <div class="field">
                            <label class="label" for="companyReg">Registration Number</label>
                            <input type="text" class="text-input @error('registration_number') is-invalid @enderror" id="companyReg" name="registration_number"
                                placeholder="e.g. 1234567-8" maxlength="30" data-rule="reg" data-label="Registration number"
                                value="{{ old('registration_number', $company->registration_number ?? '') }}">
                            @error('registration_number')<small class="field-error">{{ $message }}</small>@enderror
                        </div>

                        <div class="field">
                            <label class="label" for="companyPhone">Phone Number <span class="required-star">*</span></label>
                            <input type="text" class="text-input @error('phone') is-invalid @enderror" id="companyPhone" name="phone"
                                placeholder="03001234567 or 042-35123456" maxlength="16" inputmode="tel" data-rule="phone" data-label="Phone number" data-required="1"
                                value="{{ old('phone', $company->phone ?? '') }}">
                            @error('phone')<small class="field-error">{{ $message }}</small>@enderror
                        </div>

                        <div class="field">
                            <label class="label" for="companyEmail">Company Email <span class="required-star">*</span></label>
                            <input type="email" class="text-input @error('email') is-invalid @enderror" id="companyEmail" name="email"
                                placeholder="company@example.com" maxlength="100" data-rule="email" data-label="Email" data-required="1"
                                value="{{ old('email', $company->email ?? '') }}">
                            @error('email')<small class="field-error">{{ $message }}</small>@enderror
                        </div>

                        <div class="field">
                            <label class="label" for="companyDateFormat">Invoice Date Format</label>
                            <select class="text-input" id="companyDateFormat" name="date_format">
                                @foreach(['DD-MM-YYYY','MM-DD-YYYY','YYYY-MM-DD'] as $f)
                                <option value="{{ $f }}" {{ old('date_format', $company->date_format ?? '') == $f ? 'selected' : '' }}>{{ $f }}</option>
                                @endforeach
                            </select>
                            <p class="hint">Invoices date will be shown in this format</p>
                        </div>

                        <div class="field">
                            <label class="label" for="companyTimeFormat">Invoice Time Format</label>
                            <select class="text-input" id="companyTimeFormat" name="time_format">
                                @foreach(['12 Hour (02:30 PM)','24 Hour (14:30)'] as $f)
                                <option value="{{ $f }}" {{ old('time_format', $company->time_format ?? '') == $f ? 'selected' : '' }}>{{ $f }}</option>
                                @endforeach
                            </select>
                            <p class="hint">Invoices time is shown in this format</p>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label" for="companyAddress">Address</label>
                        <input type="text" class="text-input @error('address') is-invalid @enderror" id="companyAddress" name="address"
                            placeholder="Company address" maxlength="255" data-rule="address" data-label="Address"
                            value="{{ old('address', $company->address ?? '') }}">
                        @error('address')<small class="field-error">{{ $message }}</small>@enderror
                    </div>
                </form>
            </div>
        </div>

        <!-- ========== CONTACT SETTINGS ========== -->
        <div class="section" id="section-contact">
            <div class="settings-card">
                <form method="POST" action="{{ route('company.save') }}" id="contactForm" class="validate-form" novalidate>
                    @csrf
                    <div class="settings-top">
                        <div>
                            <h3 class="settings-heading"><i class="fa-solid fa-phone"></i> Contact Settings</h3>
                            <p class="settings-small">How your clients can reach you</p>
                        </div>
                        <button type="submit" class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                    </div>

                    <div class="two-cols">
                        <div class="field">
                            <label class="label" for="contactPhone">Phone <span class="required-star">*</span></label>
                            <input type="text" class="text-input @error('contact_phone') is-invalid @enderror" id="contactPhone" name="contact_phone"
                                placeholder="03001234567 or 042-35123456" maxlength="16" inputmode="tel" data-rule="phone" data-label="Phone" data-required="1"
                                value="{{ old('contact_phone', $company->contact_phone ?? '') }}">
                            @error('contact_phone')<small class="field-error">{{ $message }}</small>@enderror
                        </div>

                        <div class="field">
                            <label class="label" for="contactWhatsapp">WhatsApp <span class="required-star">*</span></label>
                            <input type="text" class="text-input @error('whatsapp') is-invalid @enderror" id="contactWhatsapp" name="whatsapp"
                                placeholder="03001234567 or +923001234567" maxlength="16" inputmode="tel" data-rule="mobile" data-label="WhatsApp number" data-required="1"
                                value="{{ old('whatsapp', $company->whatsapp ?? '') }}">
                            @error('whatsapp')<small class="field-error">{{ $message }}</small>@enderror
                        </div>

                        <div class="field">
                            <label class="label" for="contactEmail">Email <span class="required-star">*</span></label>
                            <input type="email" class="text-input @error('contact_email') is-invalid @enderror" id="contactEmail" name="contact_email"
                                placeholder="Contact email" maxlength="100" data-rule="email" data-label="Email" data-required="1"
                                value="{{ old('contact_email', $company->contact_email ?? '') }}">
                            @error('contact_email')<small class="field-error">{{ $message }}</small>@enderror
                        </div>

                        <div class="field">
                            <label class="label" for="contactWebsite">Website</label>
                            <input type="text" class="text-input @error('website') is-invalid @enderror" id="contactWebsite" name="website"
                                placeholder="www.example.com" maxlength="255" data-rule="url" data-label="Website"
                                value="{{ old('website', $company->website ?? '') }}">
                            @error('website')<small class="field-error">{{ $message }}</small>@enderror
                        </div>
                    </div>
                </form>
            </div>
        </div>

    </div>
</div>
@endsection