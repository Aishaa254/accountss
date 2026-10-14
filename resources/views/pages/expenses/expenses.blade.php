@extends('layout.app')

@section('title', 'Expenses')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/vendors/vendors.css') }}">
<link rel="stylesheet" href="{{ asset('css/expenses/expenses.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/expenses/expenses.js') }}"></script>
@endpush

@section('content')

<div class="vd-head">
    <div>
        <h1 class="vd-title">Expenses</h1>
        <p class="vd-sub">Track your daily business spending.</p>
    </div>
    <button type="button" class="vd-btn-primary" id="exNew"><i class="fa-solid fa-plus"></i> Add Expense</button>
</div>

<div class="vd-cards">
    <div class="vd-card">
        <div class="vd-icon vd-icon-main"><i class="fa-solid fa-receipt"></i></div>
        <div>
            <div class="vd-value" id="cdMonth">Rs 0</div>
            <div class="vd-label">This Month</div>
            <div class="vd-note" id="cdMonthNote"></div>
        </div>
    </div>

    <div class="vd-card">
        <div class="vd-icon vd-icon-blue"><i class="fa-solid fa-calendar-days"></i></div>
        <div>
            <div class="vd-value" id="cdLast">Rs 0</div>
            <div class="vd-label">Last Month</div>
            <div class="vd-note" id="cdLastNote"></div>
        </div>
    </div>

    <div class="vd-card">
        <div class="vd-icon vd-icon-orange"><i class="fa-solid fa-arrow-trend-up"></i></div>
        <div>
            <div class="vd-value" id="cdBig">-</div>
            <div class="vd-label">Biggest This Month</div>
            <div class="vd-note" id="cdBigNote"></div>
        </div>
    </div>

    <div class="vd-card">
        <div class="vd-icon vd-icon-red"><i class="fa-solid fa-tags"></i></div>
        <div>
            <div class="vd-value" id="cdTop">-</div>
            <div class="vd-label">Top Category</div>
            <div class="vd-note" id="cdTopNote"></div>
        </div>
    </div>
</div>

<div class="vd-panel">
    <div class="vd-toolbar">
        <div class="vd-search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="exSearch" placeholder="Search expenses">
        </div>
        <select class="vd-sort" id="exCat"></select>
    </div>

    <div class="vd-table-wrap">
        <table class="vd-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Expense</th>
                    <th>Category</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="exRows"></tbody>
        </table>
    </div>

    <div class="vd-foot">
        <div class="vd-foot-info" id="exInfo"></div>
    </div>
</div>

<!-- Add / Edit popup -->
<div class="vd-modal-overlay" id="exModal">
    <div class="vd-modal">
        <div class="vd-modal-head">
            <h3 id="exTitle">Add Expense</h3>
            <button type="button" class="vd-close" data-close="exModal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="vd-modal-body">
            <div class="vd-grid">
                <div class="vd-field vd-full">
                    <label>Title <span class="vd-req">*</span></label>
                    <input type="text" class="vd-input" id="efTitle" maxlength="60" placeholder="e.g. Shop rent">
                    <small class="vd-err" data-err="efTitle"></small>
                </div>

                <div class="vd-field">
                    <label>Amount (Rs) <span class="vd-req">*</span></label>
                    <input type="number" class="vd-input" id="efAmount" min="0" step="any" placeholder="0">
                    <small class="vd-err" data-err="efAmount"></small>
                </div>

                <div class="vd-field">
                    <label>Date <span class="vd-req">*</span></label>
                    <input type="date" class="vd-input" id="efDate">
                    <small class="vd-err" data-err="efDate"></small>
                </div>

                <div class="vd-field">
                    <label>Category</label>
                    <select class="vd-input" id="efCategory"></select>
                </div>

                <div class="vd-field">
                    <label>Payment Method</label>
                    <select class="vd-input" id="efMethod">
                        <option>Cash</option>
                        <option>Bank Transfer</option>
                        <option>Cheque</option>
                        <option>Online</option>
                    </select>
                </div>

                <div class="vd-field vd-full">
                    <label>Note</label>
                    <input type="text" class="vd-input" id="efNote" maxlength="100" placeholder="Optional">
                </div>
            </div>
        </div>

        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="exModal">Cancel</button>
            <button type="button" class="vd-btn-primary" id="efSave">Save</button>
        </div>
    </div>
</div>

<!-- Delete popup -->
<div class="vd-modal-overlay" id="exConfirm">
    <div class="vd-modal vd-modal-sm">
        <div class="vd-modal-body vd-confirm">
            <div class="vd-confirm-icon"><i class="fa-regular fa-trash-can"></i></div>
            <h3>Delete this expense?</h3>
            <p id="ecText"></p>
        </div>
        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="exConfirm">Cancel</button>
            <button type="button" class="vd-btn-danger" id="ecOk">Yes, delete</button>
        </div>
    </div>
</div>

<div class="vd-toast" id="exToast"></div>

@endsection