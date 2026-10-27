@extends('auth.layout')

@section('title', 'Sign in')

@section('form')
<form class="ax-form @if ($errors->any()) shake @endif" method="POST" action="/login" id="authForm" novalidate>
    @csrf
    <h1 class="ax-title">Welcome back</h1>
    <p class="ax-sub">Sign in to continue to your books.</p>

    <div class="ax-field">
        <label>Email <span>*</span></label>
        <div class="ax-input @error('email') bad @enderror">
            <input type="email" name="email" value="{{ old('email') }}" maxlength="120" placeholder="you@company.com" autocomplete="username" data-required="Enter your email" autofocus>
            <i class="fa-regular fa-envelope"></i>
        </div>
        <small class="ax-err" @error('email') data-server @enderror>@error('email') {{ $message }} @enderror</small>
    </div>

    <div class="ax-field">
        <label>Password <span>*</span></label>
        <div class="ax-input @error('password') bad @enderror">
            <input type="password" name="password" maxlength="100" placeholder="Your password" autocomplete="current-password" data-required="Enter your password">
            <i class="fa-solid fa-lock"></i>
        </div>
        <small class="ax-err" @error('password') data-server @enderror>@error('password') {{ $message }} @enderror</small>
    </div>

    <div class="ax-row-opt">
        <label><input type="checkbox" name="remember" value="1"> Keep me signed in</label>
    </div>

    <button type="submit" class="ax-btn" id="authBtn"><span>Sign In</span><i class="fa-solid fa-arrow-right"></i></button>
    <p class="ax-foot">AccountPro &copy; {{ date('Y') }}</p>
</form>
@endsection