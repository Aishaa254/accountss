@extends('layout.app')

@section('title', 'Bank Accounts')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/vendors/vendors.css') }}">
<link rel="stylesheet" href="{{ asset('css/shared/date-filter.css') }}">
<link rel="stylesheet" href="{{ asset('css/accounts/accounts.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/shared/date-filter.js') }}"></script>
<script src="{{ asset('js/accounts/accounts-common.js') }}"></script>
<script src="{{ asset('js/banks/banks.js') }}"></script>
@endpush

@section('content')

<div class="vd-head">
    <div>
        <h1 class="vd-title">Bank Accounts</h1>
        <p class="vd-sub">Every bank account, its balance and its full statement.</p>
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

<div class="vd-panel" id="bkDetail" style="display:none">
    <div class="ac-detail-head">
        <div>
            <h3 id="bkDName"></h3>
            <p id="bkDSub"></p>
        </div>
        <div class="ac-tools">
            <div id="bkDate"></div>
            <button type="button" class="vd-btn-ghost" id="bkPrint"><i class="fa-solid fa-print"></i> Print</button>
        </div>
    </div>

    <div class="ac-strip" id="bkStrip"></div>

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
                    <label>Account name <span class="vd-req">*</span></label>
                    <input type="text" class="vd-input" id="bfName" maxlength="80" placeholder="e.g. HBL Current">
                    <small class="vd-err" data-err="bfName"></small>
                </div>

                <div class="vd-field">
                    <label>Bank name <span class="vd-req">*</span></label>
                    <input type="text" class="vd-input" id="bfBank" maxlength="80" placeholder="e.g. Habib Bank">
                    <small class="vd-err" data-err="bfBank"></small>
                </div>

                <div class="vd-field">
                    <label>Account title</label>
                    <input type="text" class="vd-input" id="bfTitle" maxlength="80" placeholder="Optional">
                </div>

                <div class="vd-field">
                    <label>Last 4 digits of account no.</label>
                    <input type="text" class="vd-input" id="bfLast4" maxlength="4" inputmode="numeric" placeholder="1234">
                    <small class="vd-err" data-err="bfLast4"></small>
                </div>

                <div class="vd-field">
                    <label>Opening balance (<span class="cur-sym">Rs</span>) <span class="vd-req">*</span></label>
                    <input type="number" class="vd-input" id="bfOpening" min="0" step="any" placeholder="0">
                    <small class="vd-err" data-err="bfOpening"></small>
                </div>

                <div class="vd-field" id="bfStatusBox">
                    <label>Status</label>
                    <select class="vd-input" id="bfActive">
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                    <small class="vd-err" data-err="bfActive"></small>
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