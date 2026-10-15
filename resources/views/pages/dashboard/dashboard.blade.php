@extends('layout.app')

@section('title', 'Dashboard')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/dashboard/dashboard.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/dashboard/dashboard.js') }}"></script>
@endpush

@section('content')

<!-- ===== Hero ===== -->
<section class="db-hero">
    <span class="db-blob b1"></span>
    <span class="db-blob b2"></span>
    <span class="db-blob b3"></span>

    <div class="db-hero-text">
        <h1 id="dbGreet">Hello, Admin</h1>
        <p id="dbDate"></p>
        <p class="db-summary" id="dbSummary"></p>
    </div>

    <div class="db-actions">
        <a class="db-qa" href="/invoices"><i class="fa-solid fa-file-invoice"></i> New Invoice</a>
        <a class="db-qa" href="/purchases"><i class="fa-solid fa-cart-shopping"></i> New Purchase</a>
        <a class="db-qa" href="/expenses"><i class="fa-solid fa-receipt"></i> Add Expense</a>
        <a class="db-qa" href="/customers"><i class="fa-solid fa-user-plus"></i> Add Customer</a>
    </div>
</section>

<!-- ===== KPI cards ===== -->
<div class="db-kpis" id="dbKpis"></div>

<!-- ===== Chart + Attention ===== -->
<div class="db-row db-row-2">
    <div class="db-panel">
        <div class="db-panel-head">
            <h3>Sales vs Spending</h3>
            <span>last 6 months</span>
        </div>
        <div class="db-chart" id="dbChart"></div>
        <div class="db-legend">
            <span><i class="db-dot sales"></i>Sales</span>
            <span><i class="db-dot spend"></i>Purchases + Expenses</span>
        </div>
    </div>

    <div class="db-panel">
        <div class="db-panel-head">
            <h3>Needs Attention</h3>
            <span id="dbAttCount"></span>
        </div>
        <div id="dbAttention"></div>
    </div>
</div>

<!-- ===== Cash, Expenses, Dues ===== -->
<div class="db-row db-row-3">
    <div class="db-panel">
        <div class="db-panel-head">
            <h3>Cash Position</h3>
            <span>right now</span>
        </div>

        <div class="db-cash-row">
            <div class="db-cash-line"><span>You will receive</span><b id="cashIn">0</b></div>
            <div class="db-track"><div class="db-fill fill-in" id="cashInBar"></div></div>
            <small>from customers</small>
        </div>

        <div class="db-cash-row">
            <div class="db-cash-line"><span>You need to pay</span><b id="cashOut">0</b></div>
            <div class="db-track"><div class="db-fill fill-out" id="cashOutBar"></div></div>
            <small>to vendors</small>
        </div>

        <div class="db-net"><span>Net position</span><b id="cashNet"></b></div>
    </div>

    <div class="db-panel">
        <div class="db-panel-head">
            <h3>Expenses by Category</h3>
            <span>this month</span>
        </div>
        <div class="db-donut-wrap">
            <div class="db-donut">
                <svg viewBox="0 0 42 42" id="dbDonut"></svg>
                <div class="db-donut-center"><b id="dbDonutTotal"></b><span>total</span></div>
            </div>
            <ul class="db-legend-list" id="dbLegend"></ul>
        </div>
    </div>

    <div class="db-panel">
        <div class="db-panel-head">
            <h3>Upcoming Dues</h3>
            <span>next 7 days</span>
        </div>
        <div id="dbDues"></div>
    </div>
</div>

<!-- ===== Recent activity ===== -->
<div class="db-panel">
    <div class="db-panel-head">
        <h3>Recent Activity</h3>
        <span>latest first</span>
    </div>
    <div class="db-activity" id="dbActivity"></div>
</div>

@endsection