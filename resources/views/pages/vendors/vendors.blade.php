@extends('layout.app')

@section('title', 'Vendors')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/vendors/vendors.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/vendors/vendors.js') }}"></script>
@endpush

@section('content')

<div class="vd-head">
    <div>
        <h1 class="vd-title">Vendors</h1>
        <p class="vd-sub">Manage your suppliers and what you owe them.</p>
    </div>
    <button type="button" class="vd-btn-primary" id="addVendorBtn">
        <i class="fa-solid fa-plus"></i> Add Vendor
    </button>
</div>

<!-- ===== Cards ===== -->
<div class="vd-cards">
    <div class="vd-card">
        <div class="vd-icon vd-icon-main"><i class="fa-solid fa-truck"></i></div>
        <div>
            <div class="vd-value" id="cardTotal">0</div>
            <div class="vd-label">Total Vendors</div>
            <div class="vd-note" id="cardTotalNote"></div>
        </div>
    </div>

    <div class="vd-card">
        <div class="vd-icon vd-icon-blue"><i class="fa-solid fa-wallet"></i></div>
        <div>
            <div class="vd-value" id="cardPayable">Rs 0</div>
            <div class="vd-label">Total Payable</div>
            <div class="vd-note" id="cardPayableNote"></div>
        </div>
    </div>

    <div class="vd-card">
        <div class="vd-icon vd-icon-orange"><i class="fa-regular fa-calendar-check"></i></div>
        <div>
            <div class="vd-value" id="cardDue">Rs 0</div>
            <div class="vd-label">Due in 7 Days</div>
            <div class="vd-note" id="cardDueNote"></div>
        </div>
    </div>

    <div class="vd-card">
        <div class="vd-icon vd-icon-red"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div>
            <div class="vd-value vd-red" id="cardOverdue">Rs 0</div>
            <div class="vd-label">Overdue Payable</div>
            <div class="vd-note" id="cardOverdueNote"></div>
        </div>
    </div>
</div>

<!-- ===== List ===== -->
<div class="vd-panel">

    <div class="vd-toolbar">
        <div class="vd-search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="vendorSearch" placeholder="Search by name, company or phone">
        </div>

        <div class="vd-chips" id="vendorChips">
            <button type="button" class="vd-chip active" data-filter="all">All <span id="cntAll">0</span></button>
            <button type="button" class="vd-chip" data-filter="active">Active <span id="cntActive">0</span></button>
            <button type="button" class="vd-chip" data-filter="due">Balance Due <span id="cntDue">0</span></button>
            <button type="button" class="vd-chip" data-filter="overdue">Overdue <span id="cntOverdue">0</span></button>
        </div>

        <select class="vd-sort" id="vendorSort">
            <option value="name">Sort: Name</option>
            <option value="balance">Sort: Highest balance</option>
            <option value="new">Sort: Newest first</option>
        </select>
    </div>

    <div class="vd-table-wrap">
        <table class="vd-table">
            <thead>
                <tr>
                    <th>Vendor</th>
                    <th>Category</th>
                    <th>Phone</th>
                    <th>Payable</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="vendorRows"></tbody>
        </table>
    </div>

    <div class="vd-foot">
        <div class="vd-foot-info" id="vdInfo"></div>
        <div class="vd-foot-right">
            <label class="vd-perpage">Rows
                <select id="vdPerPage">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                </select>
            </label>
            <div class="vd-pager" id="vdPager"></div>
        </div>
    </div>

</div>

<!-- ===== Detail side panel ===== -->
<div class="vd-overlay" id="vdOverlay"></div>

<aside class="vd-side" id="vdSide" aria-hidden="true">
    <div class="vd-side-head">
        <h3>Vendor Details</h3>
        <button type="button" class="vd-close" id="vdClose"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <div class="vd-side-body" id="vdSideBody"></div>

    <div class="vd-side-foot">
        <button type="button" class="vd-btn-ghost" id="vdEditBtn"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
        <button type="button" class="vd-btn-primary" id="vdPayBtn"><i class="fa-solid fa-money-bill-wave"></i> Record Payment</button>
    </div>
</aside>

<!-- ===== Add / Edit vendor popup ===== -->
<div class="vd-modal-overlay" id="vdFormModal">
    <div class="vd-modal">
        <div class="vd-modal-head">
            <h3 id="vdFormTitle">Add Vendor</h3>
            <button type="button" class="vd-close" data-close="vdFormModal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="vd-modal-body">
            <div class="vd-grid">
                <div class="vd-field">
                    <label>Name <span class="vd-req">*</span></label>
                    <input type="text" class="vd-input" id="fName" maxlength="60" placeholder="Vendor name">
                    <small class="vd-err" data-err="fName"></small>
                </div>

                <div class="vd-field">
                    <label>Company</label>
                    <input type="text" class="vd-input" id="fCompany" maxlength="60" placeholder="Company name">
                    <small class="vd-err" data-err="fCompany"></small>
                </div>

                <div class="vd-field">
                    <label>Category</label>
                    <select class="vd-input" id="fCategory">
                        <option>Raw Material</option>
                        <option>Services</option>
                        <option>Utilities</option>
                        <option>Transport</option>
                        <option>Other</option>
                    </select>
                </div>

                <div class="vd-field">
                    <label>Phone <span class="vd-req">*</span></label>
                    <input type="text" class="vd-input" id="fPhone" maxlength="16" placeholder="0300-1234567">
                    <small class="vd-err" data-err="fPhone"></small>
                </div>

                <div class="vd-field">
                    <label>Email</label>
                    <input type="text" class="vd-input" id="fEmail" maxlength="80" placeholder="vendor@example.com">
                    <small class="vd-err" data-err="fEmail"></small>
                </div>

                <div class="vd-field">
                    <label>City</label>
                    <input type="text" class="vd-input" id="fCity" maxlength="40" placeholder="City">
                    <small class="vd-err" data-err="fCity"></small>
                </div>

                <div class="vd-field">
                    <label>Opening Balance (Rs)</label>
                    <input type="number" class="vd-input" id="fBalance" min="0" step="any" placeholder="0">
                    <small class="vd-hint" id="fBalanceHint"></small>
                    <small class="vd-err" data-err="fBalance"></small>
                </div>

                <div class="vd-field">
                    <label>Payment Terms (days) <span class="vd-req">*</span></label>
                    <input type="number" class="vd-input" id="fTerms" min="0" max="365" placeholder="30">
                    <small class="vd-err" data-err="fTerms"></small>
                </div>

                <div class="vd-field">
                    <label>Status</label>
                    <select class="vd-input" id="fStatus">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div class="vd-field vd-full">
                    <label>Address</label>
                    <input type="text" class="vd-input" id="fAddress" maxlength="150" placeholder="Street address">
                </div>

                <div class="vd-field vd-full">
                    <label>Notes</label>
                    <textarea class="vd-input" id="fNotes" rows="3" maxlength="300" placeholder="Anything worth remembering about this vendor"></textarea>
                </div>
            </div>
        </div>

        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="vdFormModal">Cancel</button>
            <button type="button" class="vd-btn-primary" id="vdFormSave">Add Vendor</button>
        </div>
    </div>
</div>

<!-- ===== Record payment popup ===== -->
<div class="vd-modal-overlay" id="vdPayModal">
    <div class="vd-modal vd-modal-sm">
        <div class="vd-modal-head">
            <h3>Record Payment</h3>
            <button type="button" class="vd-close" data-close="vdPayModal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="vd-modal-body">
            <div class="vd-pay-sum" id="pSummary"></div>

            <div class="vd-field">
                <label>Amount (Rs) <span class="vd-req">*</span></label>
                <div class="vd-inline">
                    <input type="number" class="vd-input" id="pAmount" min="0" step="any" placeholder="0">
                    <button type="button" class="vd-btn-ghost vd-small" id="pFull">Pay full</button>
                </div>
                <small class="vd-err" data-err="pAmount"></small>
            </div>

            <div class="vd-field">
                <label>Date <span class="vd-req">*</span></label>
                <input type="date" class="vd-input" id="pDate">
                <small class="vd-err" data-err="pDate"></small>
            </div>

            <div class="vd-field">
                <label>Method</label>
                <select class="vd-input" id="pMethod">
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                    <option>Online</option>
                </select>
            </div>

            <div class="vd-field">
                <label>Note</label>
                <input type="text" class="vd-input" id="pNote" maxlength="100" placeholder="Optional">
            </div>
        </div>

        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="vdPayModal">Cancel</button>
            <button type="button" class="vd-btn-primary" id="vdPaySave">Save Payment</button>
        </div>
    </div>
</div>

<!-- ===== Delete confirm popup ===== -->
<div class="vd-modal-overlay" id="vdConfirmModal">
    <div class="vd-modal vd-modal-sm">
        <div class="vd-modal-body vd-confirm">
            <div class="vd-confirm-icon"><i class="fa-regular fa-trash-can"></i></div>
            <h3>Delete this vendor?</h3>
            <p id="cText"></p>
        </div>
        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="vdConfirmModal">Cancel</button>
            <button type="button" class="vd-btn-danger" id="cOk">Yes, delete</button>
        </div>
    </div>
</div>

<div class="vd-toast" id="vdToast"></div>

@endsection