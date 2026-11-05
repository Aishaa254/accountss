@extends('layout.app')

@section('title', 'Cash in Hand')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/vendors/vendors.css') }}">
<link rel="stylesheet" href="{{ asset('css/shared/date-filter.css') }}">
<link rel="stylesheet" href="{{ asset('css/accounts/accounts.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/shared/date-filter.js') }}"></script>
<script src="{{ asset('js/accounts/accounts-common.js') }}"></script>
<script src="{{ asset('js/cash/cash.js') }}"></script>
@endpush

@section('content')

<div class="vd-head">
    <div>
        <h1 class="vd-title">Cash in Hand</h1>
        <p class="vd-sub">Cash you hold today, and every entry that moved it.</p>
    </div>
    <div class="ac-tools">
    
        <button type="button" class="vd-btn-ghost" id="chSetOpen"><i class="fa-solid fa-calculator"></i> Set Actual Cash</button>
        <button type="button" class="vd-btn-ghost" id="chOutBtn"><i class="fa-solid fa-arrow-up"></i> Take Out</button>
        <button type="button" class="vd-btn-primary" id="chAddBtn"><i class="fa-solid fa-plus"></i> Add Money</button>
    </div>
</div>

<div class="ac-hero">
    <div class="ac-hero-main">
        <div class="ac-hero-label"><i class="fa-solid fa-money-bill-wave"></i> Cash balance</div>
        <div class="ac-balance" id="chBalance">0</div>
        <div class="ac-hero-chips">
            <span class="ac-chip"><i class="fa-solid fa-arrow-down"></i> Today in <b id="chIn">0</b></span>
            <span class="ac-chip"><i class="fa-solid fa-arrow-up"></i> Today out <b id="chOut">0</b></span>
            <span class="ac-chip">Opening <b id="chOpening">0</b></span>
        </div>
    </div>
    <div class="ac-hero-spark">
        <div id="chSpark"></div>
        <div class="ac-spark-cap">Last 30 days</div>
    </div>
</div>

<div class="vd-panel">
    <div class="ac-detail-head">
        <div>
            <h3>Cash statement</h3>
            <p id="chInfo"></p>
        </div>
        <div class="ac-tools">
            <div id="chDate"></div>
            <button type="button" class="vd-btn-ghost" id="chPrint"><i class="fa-solid fa-print"></i> Print</button>
        </div>
    </div>

    <div class="ac-strip" id="chStrip"></div>

    <div class="vd-table-wrap">
        <table class="vd-table ac-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Details</th>
                    <th class="ac-num">In</th>
                    <th class="ac-num">Out</th>
                    <th class="ac-num">Balance</th>
                    <th>By</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="chRows"></tbody>
        </table>
    </div>
</div>

<!-- Opening cash popup -->
<!-- Actual cash popup -->
<div class="vd-modal-overlay" id="coModal">
    <div class="vd-modal vd-modal-sm">
        <div class="vd-modal-head">
            <h3>Set Actual Cash</h3>
            <button type="button" class="vd-close" data-close="coModal"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="vd-modal-body">
            <div class="vd-field">
                <label>Cash you counted in hand now (<span class="cur-sym">Rs</span>) <span class="vd-req">*</span></label>
                <input type="number" class="vd-input" id="coAmount" min="0" step="any" placeholder="0">
                <small class="vd-err" data-err="coAmount"></small>
                <small class="vd-hint">The system writes one "Cash count adjustment" entry for the difference, so the balance matches your real cash. Old entries are not changed.</small>
            </div>
        </div>
        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="coModal">Cancel</button>
            <button type="button" class="vd-btn-primary" id="coSave">Save</button>
        </div>
    </div>
</div>

@endsection