@extends('layout.app')

@section('title', 'Reports')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/report/report.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/reports/reports.js') }}"></script>
@endpush

@section('content')

<div class="rp-head">
    <div>
        <h1 class="rp-title">Reports</h1>
        <p class="rp-sub" id="rpRange"></p>
    </div>

    <div class="rp-controls">
        <div class="rp-periods" id="rpPeriods">
            <button type="button" class="rp-period active" data-p="month">This Month</button>
            <button type="button" class="rp-period" data-p="last">Last Month</button>
            <button type="button" class="rp-period" data-p="q">Last 3 Months</button>
            <button type="button" class="rp-period" data-p="six">Last 6 Months</button>
        </div>
        <button type="button" class="rp-btn" id="rpExport"><i class="fa-solid fa-file-arrow-down"></i> Export CSV</button>
        <button type="button" class="rp-btn" id="rpPrint"><i class="fa-solid fa-print"></i> Print</button>
    </div>
</div>

<div class="rp-cards" id="rpCards"></div>

<div class="rp-insight">
    <i class="fa-solid fa-wand-magic-sparkles"></i>
    <p id="rpInsight"></p>
</div>

<div class="rp-tabs" id="rpTabs">
    <button type="button" class="rp-tab active" data-tab="pl"><i class="fa-solid fa-scale-balanced"></i> Profit and Loss</button>
    <button type="button" class="rp-tab" data-tab="sales"><i class="fa-solid fa-chart-line"></i> Sales</button>
    <button type="button" class="rp-tab" data-tab="exp"><i class="fa-solid fa-receipt"></i> Expenses</button>
    <button type="button" class="rp-tab" data-tab="age"><i class="fa-solid fa-hourglass-half"></i> Aging</button>
</div>

<div id="rpBody"></div>

@endsection