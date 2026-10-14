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

        <!-- ========== BRAND SETTINGS ========== -->
        <div class="section active" id="section-brand">
            <div class="settings-card">
                <div class="settings-top">
                    <div>
                        <h3 class="settings-heading"><i class="fa-solid fa-palette"></i> Brand Settings</h3>
                        <p class="settings-small">Customize your application's branding and appearance</p>
                    </div>
                    <button class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
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
                    <input type="text" class="text-input" value="AccountGo">
                    <p class="hint">Application title displayed in the browser tab</p>

                    <label class="label">Footer Text</label>
                    <input type="text" class="text-input" value="Copyright © AccountGo">
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
                        <p class="settings-small">Configure system-wide settings for your application</p>
                    </div>
                    <button class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                </div>
                <div class="two-cols">
                    <div>
                        <label class="label">Default Language</label>
                        <select class="text-input">
                            <option>English</option>
                            <option>Urdu</option>
                            <option>Arabic</option>
                        </select>
                    </div>
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
                </div>
            </div>
        </div>

        <!-- ========== COMPANY SETTINGS ========== -->
        <div class="section" id="section-company">
            <div class="settings-card">
                <form method="POST" action="{{ route('company.save') }}">
                    @csrf
                    <div class="settings-top">
                        <div>
                            <h3 class="settings-heading"><i class="fa-solid fa-building"></i> Company Settings</h3>
                            <p class="settings-small">Your company details shown on invoices</p>
                        </div>
                        <button type="submit" class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                    </div>
                    <div class="two-cols">
                        <div>
                            <label class="label">Company Name</label>
                            <input type="text" class="text-input" id="companyName" name="company_name" placeholder="Your company name" value="{{ $company->company_name ?? '' }}">
                        </div>
                        <div>
                            <label class="label">Registration Number</label>
                            <input type="text" class="text-input" id="companyReg" name="registration_number" placeholder="Registration number" value="{{ $company->registration_number ?? '' }}">
                        </div>
                        <div>
                            <label class="label">Phone Number</label>
                            <input type="text" class="text-input" id="companyPhone" name="phone" placeholder="Phone number" value="{{ $company->phone ?? '' }}">
                        </div>
                        <div>
                            <label class="label">Company Email</label>
                            <input type="email" class="text-input" id="companyEmail" name="email" placeholder="company@example.com" value="{{ $company->email ?? '' }}">
                        </div>
                        <div>
                            <label class="label">Date Format</label>
                            <select class="text-input" id="dateFormat" name="date_format">
                                <option {{ ($company->date_format ?? '') == 'DD-MM-YYYY' ? 'selected' : '' }}>DD-MM-YYYY</option>
                                <option {{ ($company->date_format ?? '') == 'MM-DD-YYYY' ? 'selected' : '' }}>MM-DD-YYYY</option>
                                <option {{ ($company->date_format ?? '') == 'YYYY-MM-DD' ? 'selected' : '' }}>YYYY-MM-DD</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">Time Format</label>
                            <select class="text-input" id="timeFormat" name="time_format">
                                <option {{ ($company->time_format ?? '') == '12 Hour (02:30 PM)' ? 'selected' : '' }}>12 Hour (02:30 PM)</option>
                                <option {{ ($company->time_format ?? '') == '24 Hour (14:30)' ? 'selected' : '' }}>24 Hour (14:30)</option>
                            </select>
                        </div>
                    </div>
                    <label class="label">Address</label>
                    <input type="text" class="text-input" id="companyAddress" name="address" placeholder="Company address" value="{{ $company->address ?? '' }}">
                </form>
            </div>
        </div>

        <!-- ========== CURRENCY SETTINGS ========== -->
        <div class="section" id="section-currency">
            <div class="settings-card">
                <div class="settings-top">
                    <div>
                        <h3 class="settings-heading"><i class="fa-solid fa-dollar-sign"></i> Currency Settings</h3>
                        <p class="settings-small">Choose how money is shown</p>
                    </div>
                    <button class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                </div>
                <div class="two-cols">
                    <div>
                        <label class="label">Currency</label>
                        <select class="text-input">
                            <option>PKR - Pakistani Rupee</option>
                            <option>USD - US Dollar</option>
                            <option>AED - UAE Dirham</option>
                            <option>SAR - Saudi Riyal</option>
                            <option>EUR - Euro</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">Symbol Position</label>
                        <select class="text-input">
                            <option>Before amount (Rs 100)</option>
                            <option>After amount (100 Rs)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- ========== EMAIL SETTINGS ========== -->
        <div class="section" id="section-email">
            <div class="settings-card">
                <div class="settings-top">
                    <div>
                        <h3 class="settings-heading"><i class="fa-solid fa-envelope"></i> Email Settings</h3>
                        <p class="settings-small">Emails sent to your clients come from here</p>
                    </div>
                    <button class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                </div>
                <div class="two-cols">
                    <div>
                        <label class="label">Sender Name</label>
                        <input type="text" class="text-input" placeholder="Sender name">
                    </div>
                    <div>
                        <label class="label">Sender Email</label>
                        <input type="text" class="text-input" placeholder="Sender email address">
                    </div>
                    <div>
                        <label class="label">Mail Server</label>
                        <input type="text" class="text-input" placeholder="smtp.example.com">
                    </div>
                    <div>
                        <label class="label">Port</label>
                        <input type="text" class="text-input" placeholder="587">
                    </div>
                </div>
            </div>
        </div>

        <!-- ========== CONTACT SETTINGS ========== -->
        <div class="section" id="section-contact">
            <div class="settings-card">
                <div class="settings-top">
                    <div>
                        <h3 class="settings-heading"><i class="fa-solid fa-phone"></i> Contact Settings</h3>
                        <p class="settings-small">How your clients can reach you</p>
                    </div>
                    <button class="save-btn"><i class="fa-regular fa-floppy-disk"></i> Save Changes</button>
                </div>
                <div class="two-cols">
                    <div>
                        <label class="label">Phone</label>
                        <input type="text" class="text-input" placeholder="Phone number">
                    </div>
                    <div>
                        <label class="label">WhatsApp</label>
                        <input type="text" class="text-input" placeholder="WhatsApp number">
                    </div>
                    <div>
                        <label class="label">Email</label>
                        <input type="text" class="text-input" placeholder="Contact email">
                    </div>
                    <div>
                        <label class="label">Website</label>
                        <input type="text" class="text-input" placeholder="www.example.com">
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>
@endsection