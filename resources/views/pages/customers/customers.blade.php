@extends('layout.app')

@section('title', 'Customers')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/customers/customers.css') }}">
@endpush

@push('scripts')
    <script src="{{ asset('js/customers/customers.js') }}"></script>
@endpush

@section('content')
<div class="cust">

    <div class="cust-head">
        <div>
            <h1 class="cust-title">Customers</h1>
            <p class="cust-sub">Manage your customers and their accounts.</p>
        </div>
        <button class="btn-main" id="open-add"><i class="fa-solid fa-plus"></i> Add Customer</button>
    </div>

    <div class="cust-cards">
        <div class="sum-card">
            <span class="sum-icon c-main"><i class="fa-solid fa-users"></i></span>
            <div><p class="sum-label">Total Customers</p><p class="sum-value" id="sum-total">0</p></div>
        </div>
        <div class="sum-card">
            <span class="sum-icon c-red"><i class="fa-solid fa-hand-holding-dollar"></i></span>
            <div><p class="sum-label">Receivable (we get)</p><p class="sum-value" id="sum-recv">0</p></div>
        </div>
        <div class="sum-card">
            <span class="sum-icon c-green"><i class="fa-solid fa-wallet"></i></span>
            <div><p class="sum-label">Payable (we pay)</p><p class="sum-value" id="sum-pay">0</p></div>
        </div>
        <div class="sum-card">
            <span class="sum-icon c-amber"><i class="fa-solid fa-triangle-exclamation"></i></span>
            <div><p class="sum-label">Over Credit Limit</p><p class="sum-value" id="sum-over">0</p></div>
        </div>
    </div>

    <div class="cust-box">
        <div class="cust-toolbar">
            <div class="cust-search">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="search-box" placeholder="Search by name, phone or city...">
            </div>
            <div class="cust-filters">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="receivable">Receivable</button>
                <button class="filter-btn" data-filter="payable">Payable</button>
                <button class="filter-btn" data-filter="inactive">Inactive</button>
            </div>
        </div>

        <div class="table-wrap">
            <table class="cust-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Balance</th>
                        <th>Credit Limit Used</th>
                        <th>Status</th>
                        <th>Quick Actions</th>
                    </tr>
                </thead>
                <tbody id="cust-body"></tbody>
            </table>
        </div>

        <div class="cust-empty" id="cust-empty" style="display:none;">
            <i class="fa-solid fa-user-plus"></i>
            <p>No Customer Found</p>
            <button class="btn-main" id="empty-add">Add your first customer</button>
        </div>
    </div>

</div>

<!-- Detail panel -->
<div class="overlay" id="overlay"></div>
<aside class="panel" id="panel">
    <div id="panel-body"></div>
</aside>

<!-- Add / Edit popup -->
<div class="modal-back" id="modal">
    <div class="modal-box">
        <div class="modal-top">
            <h3 id="modal-title">Add Customer</h3>
            <button class="icon-x" id="modal-close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="form-grid">
            <div><label>Name *</label><input type="text" id="f-name" placeholder="Customer name"></div>
            <div><label>Phone *</label><input type="text" id="f-phone" placeholder="03XX XXXXXXX"></div>
            <div><label>WhatsApp</label><input type="text" id="f-whatsapp" placeholder="Same as phone if empty"></div>
            <div><label>Email</label><input type="text" id="f-email" placeholder="Email address"></div>
            <div><label>City</label><input type="text" id="f-city" placeholder="City"></div>
            <div><label>Credit Limit (<span class="cur-sym">Rs</span>)</label><input type="number" id="f-limit" placeholder="0"></div>
            <div><label>Opening Balance (<span class="cur-sym">Rs</span>)</label><input type="number" id="f-opening" placeholder="0"></div>
            <div>
                <label>Opening Balance Type</label>
                <select id="f-type">
                    <option value="receivable">Receivable (customer owes us)</option>
                    <option value="payable">Payable (we owe customer)</option>
                </select>
            </div>
            <div class="full"><label>Address</label><input type="text" id="f-address" placeholder="Full address"></div>
            <div class="full"><label>Notes</label><input type="text" id="f-notes" placeholder="e.g. Pays on the 15th"></div>
        </div>
        <p class="form-error" id="form-error"></p>
        <div class="modal-foot">
            <button class="btn-ghost" id="modal-cancel">Cancel</button>
            <button class="btn-main" id="modal-save">Save Customer</button>
        </div>
    </div>
</div>

<div class="toast" id="toast"></div>
@endsection