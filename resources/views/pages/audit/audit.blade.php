
@extends('layout.app')

@section('title', 'Activity Log')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/vendors/vendors.css') }}">
<link rel="stylesheet" href="{{ asset('css/audit/audit.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/audit/audit.js') }}"></script>
@endpush

@section('content')

<div class="vd-head">
    <div>
        <h1 class="vd-title">Activity Log</h1>
        <p class="vd-sub">Who did what and when. Every add, change and delete is recorded here.</p>
    </div>
</div>

<div class="vd-panel">
    <div class="vd-toolbar">
        <div class="vd-search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="auSearch" placeholder="Search by person, record or detail">
        </div>

        <select class="vd-sort" id="auUser"></select>

        <select class="vd-sort" id="auAction">
            <option value="">All actions</option>
            <option value="created">Added</option>
            <option value="updated">Changed</option>
            <option value="deleted">Deleted</option>
            <option value="login">Logged in</option>
            <option value="logout">Logged out</option>
            <option value="password_reset">Password reset</option>
            <option value="password_changed">Password changed</option>
        </select>

        <label class="au-date"><span>From</span><input type="date" class="vd-input" id="auFrom"></label>
        <label class="au-date"><span>To</span><input type="date" class="vd-input" id="auTo"></label>
        <button type="button" class="vd-btn-ghost vd-small" id="auClear">Clear</button>
    </div>

    <div class="vd-table-wrap">
        <table class="vd-table">
            <thead>
                <tr>
                    <th>When</th>
                    <th>Who</th>
                    <th>Action</th>
                    <th>What</th>
                </tr>
            </thead>
            <tbody id="auRows"></tbody>
        </table>
    </div>

    <div class="au-pager">
        <span id="auInfo"></span>
        <div>
            <button type="button" class="vd-btn-ghost vd-small" id="auPrev"><i class="fa-solid fa-angle-left"></i> Previous</button>
            <button type="button" class="vd-btn-ghost vd-small" id="auNext">Next <i class="fa-solid fa-angle-right"></i></button>
        </div>
    </div>
</div>

@endsection