@extends('layout.app')

@section('title', 'Purchases')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/vendors/vendors.css') }}">
<link rel="stylesheet" href="{{ asset('css/purchases/purchases.css') }}">
<link rel="stylesheet" href="{{ asset('css/shared/product-ui.css') }}">
<link rel="stylesheet" href="{{ asset('css/shared/date-filter.css') }}">

@endpush

@push('scripts')
<script src="{{ asset('js/shared/product-picker.js') }}"></script>
<script src="{{ asset('js/shared/date-filter.js') }}"></script>
<script src="{{ asset('js/shared/select-picker.js') }}"></script>
<script src="{{ asset('js/accounts/account-picker.js') }}"></script>
<script src="{{ asset('js/shared/customer-picker.js') }}"></script>
<script src="{{ asset('js/purchases/purchases.js') }}"></script>

@endpush

@section('content')

<div class="vd-head">
    <div>
        <h1 class="vd-title">Purchases</h1>
        <p class="vd-sub">Track what you buy from vendors and what is still to be paid.</p>
    </div>
    <button type="button" class="vd-btn-primary" id="puNew"><i class="fa-solid fa-plus"></i> New Purchase</button>
</div>

<!-- ===== Cards ===== -->
<div class="vd-cards">
    <div class="vd-card">
        <div class="vd-icon vd-icon-main"><i class="fa-solid fa-cart-shopping"></i></div>
        <div>
            <div class="vd-value" id="cdMonth">0</div>
            <div class="vd-label">Purchases This Month</div>
            <div class="vd-note" id="cdMonthNote"></div>
        </div>
    </div>

    <div class="vd-card">
        <div class="vd-icon vd-icon-blue"><i class="fa-solid fa-wallet"></i></div>
        <div>
            <div class="vd-value" id="cdPayable">0</div>
            <div class="vd-label">Total Payable</div>
            <div class="vd-note" id="cdPayableNote"></div>
        </div>
    </div>

    <div class="vd-card">
        <div class="vd-icon vd-icon-orange"><i class="fa-regular fa-calendar-check"></i></div>
        <div>
            <div class="vd-value" id="cdDue">0</div>
            <div class="vd-label">Due in 7 Days</div>
            <div class="vd-note" id="cdDueNote"></div>
        </div>
    </div>

    <div class="vd-card">
        <div class="vd-icon vd-icon-red"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div>
            <div class="vd-value vd-red" id="cdOverdue">0</div>
            <div class="vd-label">Overdue</div>
            <div class="vd-note" id="cdOverdueNote"></div>
        </div>
    </div>
</div>

<!-- ===== List ===== -->
<div class="vd-panel">

    <div class="vd-toolbar fb-toolbar">
        <div class="vd-search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="puSearch" placeholder="Search by PO number or vendor">
        </div>

        <!-- Bare boxes pehle (Search, From - To), chhote Status aur Sort baad mein -->
        <div id="puDate"></div>
        <div id="puStatus"></div>


        <div id="puSortBox"></div>
    </div>

    <div class="vd-table-wrap">
        <table class="vd-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Purchase</th>
                    <th>Vendor</th>
                    <th>Due</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="puRows"></tbody>
        </table>
    </div>

</div>

<!-- ===== Detail side panel ===== -->
<div class="vd-overlay" id="puOverlay"></div>

<aside class="vd-side pu-side" id="puSide" aria-hidden="true">
    <div class="vd-side-head">
        <h3>Purchase Details</h3>
        <button type="button" class="vd-close" id="puClose"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <div class="vd-side-body" id="puSideBody"></div>

    <div class="vd-side-foot">
        <button type="button" class="vd-btn-ghost" id="puEditBtn"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
        <button type="button" class="vd-btn-primary" id="puPayBtn"><i class="fa-solid fa-money-bill-wave"></i> Record Payment</button>
    </div>
</aside>

<!-- ===== New / Edit purchase popup ===== -->
<div class="vd-modal-overlay" id="puFormModal">
    <div class="vd-modal vd-modal-lg">
        <div class="vd-modal-head">
            <h3 id="pfTitle">New Purchase</h3>
            <button type="button" class="vd-close" data-close="puFormModal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="vd-modal-body">
            <div class="vd-grid pu-grid3">
                <div class="vd-field">
                    <label>Vendor <span class="vd-req">*</span></label>
                    <div id="pfVendorBox"></div>
                    <small class="vd-err" data-err="pfVendor"></small>
                </div>

                <div class="vd-field">
                    <label>Purchase Date <span class="vd-req">*</span></label>
                    <input type="date" class="vd-input" id="pfDate">
                    <small class="vd-err" data-err="pfDate"></small>
                </div>

                <div class="vd-field">
                    <label>Due Date <span class="vd-req">*</span></label>
                    <input type="date" class="vd-input" id="pfDue">
                    <small class="vd-err" data-err="pfDue"></small>
                </div>
            </div>

            <h4 class="vd-sec">Items</h4>
            <div class="pu-items" id="pfItems">
                <div class="pu-item-head">
                    <span>Product</span><span>Qty</span><span>Buy price</span><span>Sale price</span><span>Total</span><span></span>
                </div>
                <div id="pfItemRows"></div>
            </div>
            <small class="vd-err" data-err="pfItems"></small>
            <button type="button" class="vd-btn-ghost pu-add-item" id="pfAddItem"><i class="fa-solid fa-plus"></i> Add item</button>

            <div class="pu-form-total"><span>Total</span><b id="pfTotal">0</b></div>

            <div class="vd-field pu-notes">
                <label>Notes</label>
                <textarea class="vd-input" id="pfNotes" rows="2" maxlength="300" placeholder="Anything worth remembering about this purchase"></textarea>
            </div>
        </div>

        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="puFormModal">Cancel</button>
            <button type="button" class="vd-btn-primary" id="pfSave">Save Purchase</button>
        </div>
    </div>
</div>

<!-- ===== Record payment popup ===== -->
<div class="vd-modal-overlay" id="puPayModal">
    <div class="vd-modal vd-modal-sm">
        <div class="vd-modal-head">
            <h3>Record Payment</h3>
            <button type="button" class="vd-close" data-close="puPayModal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="vd-modal-body">
            <div class="vd-pay-sum" id="ppSummary"></div>

            <div class="vd-field">
                <label>Amount (<span class="cur-sym">Rs</span>) <span class="vd-req">*</span></label>
                <div class="vd-inline">
                    <input type="number" class="vd-input" id="ppAmount" min="0" step="any" placeholder="0">
                    <button type="button" class="vd-btn-ghost vd-small" id="ppFull">Pay full</button>
                </div>
                <small class="vd-err" data-err="ppAmount"></small>
            </div>

            <div class="vd-field">
                <label>Date <span class="vd-req">*</span></label>
                <input type="date" class="vd-input" id="ppDate">
                <small class="vd-err" data-err="ppDate"></small>
            </div>

            <div class="vd-field">
                <label>Paid from <span class="vd-req">*</span></label>
                <select class="vd-input" id="ppAccount"></select>
                <small class="vd-err" data-err="ppAccount"></small>
            </div>

            <div style="display:none">
            <div class="vd-field" id="ppMethodBox">
                <label>Method</label>
                <select class="vd-input" id="ppMethod">
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                    <option>Online</option>
                    <option>Cash</option>
                </select>
            </div>
            </div>

            <div class="vd-field" id="ppRefBox">
                <label>Reference no.</label>
                <input type="text" class="vd-input" id="ppRef" maxlength="60" placeholder="Optional">
            </div>
        </div>

        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="puPayModal">Cancel</button>
            <button type="button" class="vd-btn-primary" id="ppSave">Save Payment</button>
        </div>
    </div>
</div>

<!-- ===== Delete confirm popup ===== -->
<div class="vd-modal-overlay" id="puConfirmModal">
    <div class="vd-modal vd-modal-sm">
        <div class="vd-modal-body vd-confirm">
            <div class="vd-confirm-icon"><i class="fa-regular fa-trash-can"></i></div>
            <h3>Delete this purchase?</h3>
            <p id="pcText"></p>
        </div>
        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="puConfirmModal">Cancel</button>
            <button type="button" class="vd-btn-danger" id="pcOk">Yes, delete</button>
        </div>
    </div>
</div>

<div class="vd-toast" id="puToast"></div>

@endsection