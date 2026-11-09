@extends('layout.app')

@section('title', 'Cash in Hand')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/vendors/vendors.css') }}">
<link rel="stylesheet" href="{{ asset('css/shared/date-filter.css') }}">
<link rel="stylesheet" href="{{ asset('css/accounts/accounts.css') }}">
<link rel="stylesheet" href="{{ asset('css/shared/product-ui.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/shared/date-filter.js') }}"></script>
<script src="{{ asset('js/accounts/accounts-common.js') }}"></script>
<script src="{{ asset('js/shared/select-picker.js') }}"></script>
<script src="{{ asset('js/cash/cash.js') }}"></script>
@endpush

@section('content')

<div class="vd-head">
    <div>
        <h1 class="vd-title">Cash in Hand</h1>
        <p class="vd-sub">Cash you hold today, and every entry that moved it.</p>
    </div>
    <!-- Buttons cash ke hisab se khud badalte hain (cash.js) -->
    <div class="ac-tools" id="chActions"></div>
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
        <div class="ac-empty-note" id="chEmpty" style="display:none"><i class="fa-solid fa-circle-info"></i> Cash is empty. Add money to get started.</div>
        <label class="ac-switch" title="ON: the Add Money button shows only when cash is 0. OFF: it shows all the time.">
            <input type="checkbox" id="chRule">
            <span class="ac-switch-track"></span>
            <span class="ac-switch-text">Add Money only when cash is 0</span>
            <span class="ac-switch-state" id="chRuleState">OFF</span>
        </label>
    </div>
    <div class="ac-hero-spark">
        <div id="chSpark"></div>
        <div class="ac-spark-cap">Last 30 days</div>
    </div>
</div>

<div class="vd-panel">
    <div class="ac-detail-head">
        <div>
            <h3>Cash history</h3>
            <p id="chInfo"></p>
        </div>
        <div class="ac-tools">
            <div id="chDate"></div>
            <button type="button" class="vd-btn-ghost" id="chPrint"><i class="fa-solid fa-print"></i> Print</button>
        </div>
    </div>

    <div class="ac-strip" id="chStrip"></div>

    <div class="ac-split" id="chSplit"></div>

    <div class="ac-toolbar">
        <div class="ac-tabs" id="chTabs">
            <button type="button" data-tab="all" class="active">All</button>
            <button type="button" data-tab="in">Money Added</button>
            <button type="button" data-tab="out">Money Removed</button>
        </div>
        <div class="ac-search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" class="vd-input" id="chSearch" placeholder="Search details, invoice, vendor...">
        </div>
    </div>

    <div class="vd-table-wrap">
        <table class="vd-table ac-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Details</th>
                    <th>Type</th>
                    <th class="ac-num">In</th>
                    <th class="ac-num">Out</th>
                    <th class="ac-num">Balance</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="chRows"></tbody>
        </table>
    </div>

    <div class="ac-pager">
        <span id="chPageInfo"></span>
        <div class="ac-pager-ctl">
            <select class="vd-input" id="chPageSize" title="Rows per page">
                <option value="10">10 rows</option>
                <option value="25">25 rows</option>
                <option value="50">50 rows</option>
            </select>
            <button type="button" class="vd-btn-ghost" id="chPrev"><i class="fa-solid fa-chevron-left"></i> Prev</button>
            <button type="button" class="vd-btn-ghost" id="chNext">Next <i class="fa-solid fa-chevron-right"></i></button>
        </div>
    </div>
</div>

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

<!-- Bank transfer popup -->
<div class="vd-modal-overlay" id="trModal">
    <div class="vd-modal">
        <div class="vd-modal-head">
            <h3>Bank Transfer</h3>
            <button type="button" class="vd-close" data-close="trModal"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="vd-modal-body">
            <div class="vd-grid">
                <div class="vd-field vd-full">
                    <label>Direction <span class="vd-req">*</span></label>
                    <div id="trDirBox"></div>
                </div>

                <div class="vd-field vd-full" id="trBankField">
                    <label>Bank account <span class="vd-req">*</span></label>
                    <div id="trBankBox"></div>
                    <small class="vd-err" data-err="trBank"></small>
                </div>

                <div class="vd-field vd-full">
                    <div class="ac-avail" id="trAvail"></div>
                </div>

                <div class="vd-field">
                    <label>Amount (<span class="cur-sym">Rs</span>) <span class="vd-req">*</span></label>
                    <input type="number" class="vd-input" id="trAmount" min="0" step="any" placeholder="0">
                    <small class="vd-err" data-err="trAmount"></small>
                </div>

                <div class="vd-field">
                    <label>Date <span class="vd-req">*</span></label>
                    <input type="date" class="vd-input" id="trDate">
                    <small class="vd-err" data-err="trDate"></small>
                </div>

                <div class="vd-field vd-full">
                    <label>Note</label>
                    <input type="text" class="vd-input" id="trNote" maxlength="100" placeholder="Optional">
                </div>
            </div>
        </div>
        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="trModal">Cancel</button>
            <button type="button" class="vd-btn-primary" id="trSave">Transfer</button>
        </div>
    </div>
</div>

<div class="vd-toast" id="acToast"></div>

@endsection