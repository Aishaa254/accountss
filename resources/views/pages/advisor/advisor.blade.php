@extends('layout.app')

@section('title', 'Business Advisor')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/advisor/advisor.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/advisor/advisor.js') }}"></script>
@endpush

@section('content')

<div class="ad-head">
    <h1 class="ad-title">Business Advisor</h1>
    <p class="ad-sub">Simple advice based on your own sales, stock, customers and expenses.</p>
</div>

<!-- ===== 1. Profit Pulse ===== -->
<section class="ad-section">
    <h2 class="ad-h2"><i class="fa-solid fa-heart-pulse"></i> Profit Pulse</h2>
    <p class="ad-note">Real profit = sales (without tax) minus the cost of goods sold, minus expenses.</p>
    <div class="ad-pulse" id="adPulse"></div>
</section>

<!-- ===== 2. Smart tips ===== -->
<section class="ad-section">
    <h2 class="ad-h2"><i class="fa-solid fa-lightbulb"></i> Smart Tips</h2>
    <p class="ad-note">
        <span class="ad-key green"></span> Green = a chance to earn more
        &nbsp;&nbsp;
        <span class="ad-key red"></span> Red = a risk of losing money
    </p>
    <div class="ad-tips" id="adTips"></div>
</section>

<!-- ===== 3. What if ===== -->
<section class="ad-section">
    <h2 class="ad-h2"><i class="fa-solid fa-sliders"></i> What if I...?</h2>
    <p class="ad-note" id="adWhatBase"></p>

    <div class="ad-panel ad-what">
        <div class="ad-sliders">
            <label class="ad-slider">
                <span>Raise prices by <b id="wPriceVal">5%</b></span>
                <input type="range" id="wPrice" min="0" max="30" step="1" value="5">
            </label>
            <label class="ad-slider">
                <span>Give a discount of <b id="wDiscVal">0%</b></span>
                <input type="range" id="wDisc" min="0" max="30" step="1" value="0">
            </label>
            <label class="ad-slider">
                <span>Quantity sold changes by <b id="wQtyVal">0%</b></span>
                <input type="range" id="wQty" min="-30" max="30" step="1" value="0">
            </label>
            <p class="ad-note">Expenses are kept the same. A higher price or a discount can change how much you sell, so move the third slider to try that too.</p>
        </div>

        <div class="ad-result">
            <div class="ad-res-row"><span>Profit now (last 30 days)</span><b id="wNow">0</b></div>
            <div class="ad-bar"><div class="ad-bar-fill" id="wNowBar"></div></div>

            <div class="ad-res-row"><span>Profit with this change</span><b id="wNew">0</b></div>
            <div class="ad-bar"><div class="ad-bar-fill" id="wNewBar"></div></div>

            <div class="ad-diff" id="wDiff"></div>
        </div>
    </div>
</section>

<!-- ===== 4. Savings plan ===== -->
<section class="ad-section">
    <h2 class="ad-h2"><i class="fa-solid fa-piggy-bank"></i> Saving and profit plan</h2>
    <p class="ad-note" id="adPlanBase"></p>

    <div class="ad-panel ad-what">
        <div class="ad-sliders">
            <label class="ad-slider">
                <span>Back into the business <b id="sBizVal">50%</b></span>
                <input type="range" id="sBiz" min="0" max="100" step="5" value="50">
            </label>
            <label class="ad-slider">
                <span>Emergency savings <b id="sEmVal">20%</b></span>
                <input type="range" id="sEm" min="0" max="100" step="5" value="20">
            </label>
            <p class="ad-note">The rest is for you. You decide the split, this page only does the sums.</p>
        </div>

        <div class="ad-result">
            <div class="ad-split" id="sSplit">
                <div class="ad-seg biz" id="sSegBiz"></div>
                <div class="ad-seg em" id="sSegEm"></div>
                <div class="ad-seg me" id="sSegMe"></div>
            </div>
            <div class="ad-res-row"><span><i class="ad-dot biz"></i> Back into the business</span><b id="sBizAmt">0</b></div>
            <div class="ad-res-row"><span><i class="ad-dot em"></i> Emergency savings</span><b id="sEmAmt">0</b></div>
            <div class="ad-res-row"><span><i class="ad-dot me"></i> For you</span><b id="sMeAmt">0</b></div>
            <div class="ad-diff" id="sTarget"></div>
        </div>
    </div>
</section>

<!-- ===== 5. Ideas ===== -->
<section class="ad-section">
    <h2 class="ad-h2"><i class="fa-solid fa-seedling"></i> Ideas corner</h2>

    <h3 class="ad-h3">Ways to grow</h3>
    <div class="ad-ideas" id="adGrow"></div>

    <h3 class="ad-h3">Common ways to save</h3>
    <div class="ad-ideas" id="adSave"></div>

    <div class="ad-warn">
        <i class="fa-solid fa-circle-info"></i>
        <p>These are options to think about, not advice on what you should do. Each one has good and bad sides. Rates, rules and prices change, so please check them yourself, or ask a qualified person, before you decide.</p>
    </div>
</section>

@endsection