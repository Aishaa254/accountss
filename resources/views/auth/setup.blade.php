@extends('auth.layout')

@section('title', 'Create Owner Account')

@section('form')
<form class="ax-form @if ($errors->any()) shake @endif" method="POST" action="/setup" id="authForm" novalidate>
    @csrf
    <h1 class="ax-title">Create Owner Account</h1>
    <p class="ax-sub">First time here. This account will have full access.</p>

    <div class="ax-field">
        <label>Your Name <span>*</span></label>
        <div class="ax-input @error('name') bad @enderror">
            <input type="text" name="name" value="{{ old('name') }}" maxlength="80" placeholder="Full name" autocomplete="name" data-required="Enter your name" autofocus>
            <i class="fa-regular fa-user"></i>
        </div>
        <small class="ax-err" @error('name') data-server @enderror>@error('name') {{ $message }} @enderror</small>
    </div>

    <div class="ax-field">
        <label>Email <span>*</span></label>
        <div class="ax-input @error('email') bad @enderror">
            <input type="email" name="email" value="{{ old('email') }}" maxlength="120" placeholder="you@company.com" autocomplete="username" data-required="Enter your email">
            <i class="fa-regular fa-envelope"></i>
        </div>
        <small class="ax-err" @error('email') data-server @enderror>@error('email') {{ $message }} @enderror</small>
    </div>

    <div class="ax-field">
        <label>Password <span>*</span></label>
        <div class="ax-input @error('password') bad @enderror">
            <input type="password" name="password" maxlength="100" placeholder="8+ characters, letters and numbers" autocomplete="new-password" data-required="Choose a password">
            <i class="fa-solid fa-lock"></i>
        </div>
        <small class="ax-err" @error('password') data-server @enderror>@error('password') {{ $message }} @enderror</small>
    </div>

    <div class="ax-field">
        <label>Confirm Password <span>*</span></label>
        <div class="ax-input">
            <input type="password" name="password_confirmation" maxlength="100" placeholder="Type it again" autocomplete="new-password" data-required="Type the password again">
            <i class="fa-solid fa-shield-halved"></i>
        </div>
        <small class="ax-err"></small>
    </div>

    <button type="submit" class="ax-btn" id="authBtn"><span>Create Account</span><i class="fa-solid fa-arrow-right"></i></button>
    <p class="ax-foot">AccountPro &copy; {{ date('Y') }}</p>
</form>
@endsection