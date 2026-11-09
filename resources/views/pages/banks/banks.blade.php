@extends('layout.app')

@section('title', 'Bank Accounts')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/vendors/vendors.css') }}">
<link rel="stylesheet" href="{{ asset('css/accounts/accounts.css') }}">
<link rel="stylesheet" href="{{ asset('css/shared/product-ui.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/accounts/accounts-common.js') }}"></script>
<script src="{{ asset('js/shared/select-picker.js') }}"></script>
<script src="{{ asset('js/banks/banks.js') }}"></script>
@endpush

@section('content')

<div class="vd-head">
    <div>
        <h1 class="vd-title">Bank Accounts</h1>
        <p class="vd-sub">All your bank accounts and their balances.</p>
    </div>
    <button type="button" class="vd-btn-primary" id="bkNew"><i class="fa-solid fa-plus"></i> Add Bank Account</button>
</div>

<div class="ac-total">
    <div>
        <small>Total in banks</small>
        <div class="ac-total-val" id="bkTotal">0</div>
    </div>
    <small id="bkCount"></small>
</div>

<div class="ac-grid" id="bkGrid"></div>

<div class="vd-panel">
    <div class="ac-detail-head">
        <div>
            <h3>Bank Details</h3>
        </div>
    </div>

    <div class="vd-table-wrap">
        <table class="vd-table ac-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Account Holder</th>
                    <th>Account Number</th>
                    <th class="ac-num">Balance</th>
                </tr>
            </thead>
            <tbody id="bkRows"></tbody>
        </table>
    </div>
</div>

<!-- Add / Edit bank popup -->
<div class="vd-modal-overlay" id="bkModal">
    <div class="vd-modal">
        <div class="vd-modal-head">
            <h3 id="bkTitle">Add Bank Account</h3>
            <button type="button" class="vd-close" data-close="bkModal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="vd-modal-body">
            <div class="vd-grid">
                <div class="vd-field">
                    <label>Account holder name <span class="vd-req">*</span></label>
                    <input type="text" class="vd-input" id="bfHolder" maxlength="80" placeholder="e.g. Ali Raza">
                    <small class="vd-err" data-err="bfHolder"></small>
                </div>

                <div class="vd-field">
                    <label>Bank name <span class="vd-req">*</span></label>
                    <div id="bfBankBox"></div>
                    <input type="text" class="vd-input" id="bfBankOther" maxlength="80" placeholder="Type the bank name" style="display:none;margin-top:8px">
                    <small class="vd-err" data-err="bfBank"></small>
                </div>

                <div class="vd-field">
                    <label>Account number <span class="vd-req">*</span></label>
                    <input type="text" class="vd-input" id="bfNumber" maxlength="24" inputmode="numeric" placeholder="e.g. 01234567890123">
                    <small class="vd-err" data-err="bfNumber"></small>
                </div>

                <div class="vd-field">
                    <label>Opening balance (<span class="cur-sym">Rs</span>) <span class="vd-req">*</span></label>
                    <input type="number" class="vd-input" id="bfOpening" min="0" step="any" placeholder="0">
                    <small class="vd-err" data-err="bfOpening"></small>
                </div>

                <div class="vd-field vd-full">
                    <label>Note</label>
                    <input type="text" class="vd-input" id="bfNote" maxlength="150" placeholder="Optional">
                </div>
            </div>
        </div>

        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="bkModal">Cancel</button>
            <button type="button" class="vd-btn-primary" id="bfSave">Save</button>
        </div>
    </div>
</div>

<div class="vd-toast" id="acToast"></div>

@endsection