@extends('layout.app')

@section('title', 'Invoices')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/customers/customers.css') }}">
    <link rel="stylesheet" href="{{ asset('css/invoices/invoices.css') }}">
@endpush

@push('scripts')
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script src="{{ asset('js/invoices/invoices.js') }}"></script>
@endpush

@section('content')
<div class="inv">

    <div class="cust-head">
        <div>
            <h1 class="cust-title">Invoices</h1>
            <p class="cust-sub">Create bills, track payments and download invoices.</p>
        </div>
        <button class="btn-main" id="open-new"><i class="fa-solid fa-plus"></i> New Invoice</button>
    </div>

    <div class="cust-cards">
        <div class="sum-card">
            <span class="sum-icon c-main"><i class="fa-solid fa-chart-line"></i></span>
            <div><p class="sum-label">This Month's Sales</p><p class="sum-value" id="sum-month">0</p><p class="sum-label" id="sum-month-note"></p></div>
        </div>
        <div class="sum-card">
            <span class="sum-icon c-blue"><i class="fa-solid fa-wallet"></i></span>
            <div><p class="sum-label">Total Receivable</p><p class="sum-value" id="sum-recv">0</p><p class="sum-label" id="sum-recv-note"></p></div>
        </div>
        <div class="sum-card">
            <span class="sum-icon c-amber"><i class="fa-regular fa-calendar-check"></i></span>
            <div><p class="sum-label">Due This Week</p><p class="sum-value" id="sum-week">0</p><p class="sum-label" id="sum-week-note"></p></div>
        </div>
        <div class="sum-card">
            <span class="sum-icon c-red"><i class="fa-solid fa-triangle-exclamation"></i></span>
            <div><p class="sum-label">Overdue</p><p class="sum-value t-red" id="sum-late">0</p><p class="sum-label" id="sum-late-note"></p></div>
        </div>
    </div>

    <div class="cust-box">
        <div class="cust-toolbar">
            <div class="cust-search">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="search-box" placeholder="Search by invoice number or customer...">
            </div>
            <div class="cust-filters">
                <button class="filter-btn active" data-filter="all">All <b id="cnt-all">0</b></button>
                <button class="filter-btn" data-filter="unpaid">Unpaid <b id="cnt-unpaid">0</b></button>
                <button class="filter-btn" data-filter="partial">Partial <b id="cnt-partial">0</b></button>
                <button class="filter-btn" data-filter="paid">Paid <b id="cnt-paid">0</b></button>
                <button class="filter-btn" data-filter="overdue">Overdue <b id="cnt-overdue">0</b></button>
            </div>
        </div>

        <div class="table-wrap">
            <table class="cust-table">
                <thead>
                    <tr>
                        <th>Invoice</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Due</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Quick Actions</th>
                    </tr>
                </thead>
                <tbody id="inv-body"></tbody>
            </table>
        </div>
    </div>

    <!-- New Invoice popup (left form, right live preview) -->
    <div class="modal-back" id="new-modal">
        <div class="modal-box wide">
            <div class="modal-top">
                <h3>New Invoice</h3>
                <button class="icon-x" id="new-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="inv-grid">
                <div id="new-form">
                    <div class="form-grid">
                        <div>
                            <label>Customer <span class="req">*</span></label>
                            <select id="n-customer"></select>
                            <small class="field-err" data-err="n-customer"></small>
                        </div>
                        <div>
                            <label>Due Date <span class="req">*</span></label>
                            <input type="date" id="n-due">
                            <small class="field-err" data-err="n-due"></small>
                        </div>
                    </div>

                    <span class="sec-label">Items <span class="req">*</span></span>
                    <div class="item-head"><span>Item</span><span>Qty</span><span>Price</span><span></span></div>
                    <div id="items"></div>
                    <datalist id="inv-products"></datalist>
                    <small class="field-err" data-err="items"></small>
                    <button type="button" class="add-item" id="add-item">+ Add item</button>

                    <div class="form-grid">
                        <div>
                            <label>Discount (<span class="cur-sym">Rs</span>)</label>
                            <input type="number" id="n-discount" value="0" min="0">
                            <small class="field-err" data-err="n-discount"></small>
                        </div>
                        <div>
                            <label>Tax (%)</label>
                            <input type="number" id="n-tax" value="0" min="0" max="100">
                            <small class="field-err" data-err="n-tax"></small>
                        </div>
                    </div>
                </div>
                <div class="preview-wrap"><div class="bill" id="new-bill"></div></div>
            </div>
            <p class="form-error" id="new-error"></p>
            <div class="modal-foot">
                <button class="btn-ghost" id="new-cancel">Cancel</button>
                <button class="btn-main" id="new-save">Save Invoice</button>
            </div>
        </div>
    </div>

    <!-- View invoice popup -->
    <div class="modal-back" id="view-modal">
        <div class="modal-box mid">
            <div class="modal-top">
                <h3>Invoice</h3>
                <button class="icon-x" id="view-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="bill" id="view-bill"></div>
            <div class="modal-foot">
                <button class="btn-ghost" id="view-pay"><i class="fa-solid fa-money-bill-wave"></i> Record Payment</button>
                <button class="btn-main" id="view-dl"><i class="fa-solid fa-download"></i> Download PDF</button>
            </div>
        </div>
    </div>

    <!-- Record payment popup -->
    <div class="modal-back" id="pay-modal">
        <div class="modal-box small">
            <div class="modal-top">
                <h3>Record Payment</h3>
                <button class="icon-x" id="pay-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <p class="sum-label" id="pay-info" style="margin-bottom:12px;"></p>
            <div class="form-grid" style="grid-template-columns:1fr;">
                <div><label>Amount received (<span class="cur-sym">Rs</span>)</label><input type="number" id="pay-amount"></div>
                <div><label>Payment date</label><input type="date" id="pay-date"></div>
            </div>
            <p class="form-error" id="pay-error"></p>
            <div class="modal-foot">
                <button class="btn-ghost" id="pay-cancel">Cancel</button>
                <button class="btn-main" id="pay-save">Save Payment</button>
            </div>
        </div>
    </div>

    <!-- Delete popup -->
    <div class="modal-back" id="del-modal">
        <div class="modal-box small">
            <div class="modal-top">
                <h3>Delete invoice?</h3>
                <button class="icon-x" id="del-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <p class="sum-label" id="del-text"></p>
            <div class="modal-foot">
                <button class="btn-ghost" id="del-cancel">Cancel</button>
                <button class="btn-main" id="del-ok" style="background:#ef4444;">Yes, delete</button>
            </div>
        </div>
    </div>

    <div class="toast" id="toast"></div>
</div>
@endsection