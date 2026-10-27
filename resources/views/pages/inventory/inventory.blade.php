@extends('layout.app')

@section('title', 'Inventory')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/vendors/vendors.css') }}">
<link rel="stylesheet" href="{{ asset('css/inventory/inventory.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/inventory/inventory.js') }}"></script>
@endpush

@section('content')

<div id="ivPage" class="iv-view-all">

<div class="vd-head">
    <div>
        <h1 class="vd-title" id="ivTitle">Inventory</h1>
        <p class="vd-sub" id="ivSub"></p>
    </div>
    <button type="button" class="vd-btn-primary" id="ivNew"><i class="fa-solid fa-plus"></i> Add Product</button>
</div>

<!-- ================= VIEW 1: ALL PRODUCTS (Catalog) ================= -->
<div id="viewAll">

    <div class="vd-cards">
        <div class="vd-card">
            <div class="vd-icon vd-icon-main"><i class="fa-solid fa-boxes-stacked"></i></div>
            <div>
                <div class="vd-value" id="ivCardCount">0</div>
                <div class="vd-label">Products</div>
                <div class="vd-note" id="ivCardCountNote"></div>
            </div>
        </div>

        <div class="vd-card">
            <div class="vd-icon vd-icon-blue"><i class="fa-solid fa-warehouse"></i></div>
            <div>
                <div class="vd-value" id="ivCardValue">0</div>
                <div class="vd-label">Stock Value (at cost)</div>
                <div class="vd-note" id="ivCardValueNote"></div>
            </div>
        </div>

        <div class="vd-card">
            <div class="vd-icon vd-icon-orange"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <div>
                <div class="vd-value" id="ivCardLow">0</div>
                <div class="vd-label">Low or Out of Stock</div>
                <div class="vd-note" id="ivCardLowNote"></div>
            </div>
        </div>

        <div class="vd-card">
            <div class="vd-icon vd-icon-red"><i class="fa-solid fa-hourglass-half"></i></div>
            <div>
                <div class="vd-value" id="ivCardSlow">0</div>
                <div class="vd-label">Money Stuck in Slow Stock</div>
                <div class="vd-note" id="ivCardSlowNote"></div>
            </div>
        </div>
    </div>

    <div class="vd-panel iv-mb">
        <div class="iv-box-body">
            <h3 class="iv-box-title"><i class="fa-solid fa-heart-pulse"></i> Stock Health</h3>
            <div class="iv-health-bar" id="ivHealthBar"></div>
            <div class="iv-health-legend" id="ivHealthLegend"></div>
        </div>
    </div>

    <div class="iv-insights">
        <div class="vd-panel">
            <div class="iv-box-body">
                <h3 class="iv-box-title"><i class="fa-solid fa-fire"></i> Best Sellers</h3>
                <div id="ivBest"></div>
            </div>
        </div>

        <div class="vd-panel">
            <div class="iv-box-body">
                <h3 class="iv-box-title"><i class="fa-solid fa-sack-dollar"></i> Most Profitable</h3>
                <div id="ivProfit"></div>
            </div>
        </div>

        <div class="vd-panel">
            <div class="iv-box-body">
                <h3 class="iv-box-title"><i class="fa-solid fa-layer-group"></i> Value by Category</h3>
                <div id="ivCats"></div>
            </div>
        </div>
    </div>

    <div class="vd-panel">
        <div class="vd-toolbar">
            <div class="vd-search">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="ivSearch" placeholder="Search by name, SKU or category">
            </div>

            <div class="vd-chips" id="ivChips">
                <button type="button" class="vd-chip active" data-filter="all">All <span id="ivcAll">0</span></button>
                <button type="button" class="vd-chip" data-filter="in">In Stock <span id="ivcIn">0</span></button>
                <button type="button" class="vd-chip" data-filter="low">Low <span id="ivcLow">0</span></button>
                <button type="button" class="vd-chip" data-filter="out">Out <span id="ivcOut">0</span></button>
                <button type="button" class="vd-chip" data-filter="slow">Slow <span id="ivcSlow">0</span></button>
                <button type="button" class="vd-chip" data-filter="inactive">Inactive <span id="ivcInactive">0</span></button>
            </div>

            <select class="vd-sort" id="ivCat"></select>

            <select class="vd-sort" id="ivSort">
                <option value="name">Sort: Name</option>
                <option value="stock">Sort: Lowest stock</option>
                <option value="value">Sort: Highest value</option>
                <option value="sold">Sort: Best selling</option>
            </select>

            <div class="iv-layout" id="ivLayout">
                <button type="button" data-layout="grid" title="Cards"><i class="fa-solid fa-table-cells-large"></i></button>
                <button type="button" data-layout="table" title="Table"><i class="fa-solid fa-list"></i></button>
            </div>
        </div>

        <div class="iv-grid" id="ivGrid"></div>

        <div class="vd-table-wrap" id="ivTableWrap">
            <table class="vd-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Stock</th>
                        <th>Price</th>
                        <th>Stock Value</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="ivRows"></tbody>
            </table>
        </div>
    </div>
</div>

<!-- ================= VIEW 2: LOW STOCK (Reorder Planner) ================= -->
<div id="viewLow" style="display:none">

    <div class="iv-hero iv-hero-low">
        <div class="iv-hero-text">
            <h2><i class="fa-solid fa-cart-arrow-down"></i> Reorder Planner</h2>
            <p id="ivLowSummary"></p>
        </div>
        <div class="iv-hero-stats">
            <div><b id="lowCount">0</b><span>need attention</span></div>
            <div><b id="lowOut">0</b><span>out of stock</span></div>
            <div><b id="lowBudget">0</b><span>estimated budget</span></div>
        </div>
    </div>

    <div id="ivPlanner"></div>

    <div class="iv-planbar" id="ivPlanBar">
        <div class="iv-plan-info">
            <b id="planSel">0</b> selected
            <span class="iv-plan-total">Total <b id="planTotal">0</b></span>
        </div>
        <div class="iv-plan-actions">
            <button type="button" class="vd-btn-ghost" id="planCopy"><i class="fa-brands fa-whatsapp"></i> Copy message</button>
            <button type="button" class="vd-btn-ghost" id="planCsv"><i class="fa-solid fa-file-arrow-down"></i> CSV</button>
            <button type="button" class="vd-btn-primary" id="planDraft"><i class="fa-solid fa-cart-shopping"></i> Create purchase</button>
        </div>
    </div>
</div>

<!-- ================= VIEW 3: SLOW MOVING (Dead Stock) ================= -->
<div id="viewSlow" style="display:none">

    <div class="iv-hero iv-hero-slow">
        <div class="iv-hero-text">
            <h2><i class="fa-solid fa-snowflake"></i> Slow Moving Stock</h2>
            <p id="ivSlowSummary"></p>
        </div>
        <div class="iv-hero-stats">
            <div><b id="slowCount">0</b><span>products idle</span></div>
            <div><b id="slowStuck">0</b><span>money stuck (cost)</span></div>
            <div><b id="slowRecover">0</b><span>you get back</span></div>
        </div>
    </div>

    <div class="vd-panel iv-mb">
        <div class="iv-box-body">
            <div class="iv-disc">
                <span>Clearance discount</span>
                <div class="iv-disc-btns" id="ivDisc">
                    <button type="button" data-disc="10">10%</button>
                    <button type="button" data-disc="20" class="active">20%</button>
                    <button type="button" data-disc="30">30%</button>
                    <button type="button" data-disc="40">40%</button>
                </div>
            </div>
            <div id="ivAging"></div>
        </div>
    </div>

    <div class="iv-slow-list" id="ivSlowList"></div>
</div>

<!-- ===== Detail side panel ===== -->
<div class="vd-overlay" id="ivOverlay"></div>

<aside class="vd-side" id="ivSide" aria-hidden="true">
    <div class="vd-side-head">
        <h3>Product Details</h3>
        <button type="button" class="vd-close" id="ivClose"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <div class="vd-side-body" id="ivSideBody"></div>

    <div class="vd-side-foot">
        <button type="button" class="vd-btn-ghost" id="ivEditBtn"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
        <button type="button" class="vd-btn-primary" id="ivAdjBtn"><i class="fa-solid fa-sliders"></i> Adjust Stock</button>
    </div>
</aside>

<!-- ===== Add / Edit product popup ===== -->
<div class="vd-modal-overlay" id="ivFormModal">
    <div class="vd-modal vd-modal-lg">
        <div class="vd-modal-head">
            <h3 id="ivFormTitle">Add Product</h3>
            <button type="button" class="vd-close" data-close="ivFormModal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="vd-modal-body">
            <div class="vd-grid">
                <div class="vd-field">
                    <label>Product Name <span class="vd-req">*</span></label>
                    <input type="text" class="vd-input" id="fiName" maxlength="80" placeholder="e.g. Steel rod 10mm">
                    <small class="vd-err" data-err="fiName"></small>
                </div>

                <div class="vd-field">
                    <label>SKU / Code</label>
                    <input type="text" class="vd-input" id="fiSku" maxlength="40" placeholder="Optional">
                    <small class="vd-err" data-err="fiSku"></small>
                </div>

                <div class="vd-field">
                    <label>Category</label>
                    <input type="text" class="vd-input" id="fiCategory" list="ivCategories" maxlength="40" placeholder="General">
                </div>

                <div class="vd-field">
                    <label>Unit</label>
                    <input type="text" class="vd-input" id="fiUnit" list="ivUnits" maxlength="20" placeholder="pcs">
                </div>

                <div class="vd-field">
                    <label>Cost Price (<span class="cur-sym">Rs</span>)</label>
                    <input type="number" class="vd-input" id="fiCost" min="0" step="any" placeholder="0">
                    <small class="vd-err" data-err="fiCost"></small>
                </div>

                <div class="vd-field">
                    <label>Sale Price (<span class="cur-sym">Rs</span>) <span class="vd-req">*</span></label>
                    <input type="number" class="vd-input" id="fiSale" min="0" step="any" placeholder="0">
                    <small class="vd-hint" id="fiMargin"></small>
                    <small class="vd-err" data-err="fiSale"></small>
                </div>

                <div class="vd-field">
                    <label>Opening Stock</label>
                    <input type="number" class="vd-input" id="fiOpening" min="0" step="any" placeholder="0">
                    <small class="vd-hint">Stock you already have today</small>
                    <small class="vd-err" data-err="fiOpening"></small>
                </div>

                <div class="vd-field">
                    <label>Reorder Level</label>
                    <input type="number" class="vd-input" id="fiReorder" min="0" step="any" placeholder="0">
                    <small class="vd-hint">You are warned when stock falls to this number</small>
                    <small class="vd-err" data-err="fiReorder"></small>
                </div>

                <div class="vd-field">
                    <label>Status</label>
                    <select class="vd-input" id="fiStatus">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div class="vd-field vd-full">
                    <label>Notes</label>
                    <textarea class="vd-input" id="fiNotes" rows="2" maxlength="300" placeholder="Optional"></textarea>
                </div>
            </div>

            <datalist id="ivCategories"></datalist>
            <datalist id="ivUnits">
                <option value="pcs"><option value="kg"><option value="g"><option value="meter">
                <option value="box"><option value="dozen"><option value="liter"><option value="pack">
                <option value="set"><option value="roll">
            </datalist>
        </div>

        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="ivFormModal">Cancel</button>
            <button type="button" class="vd-btn-primary" id="ivFormSave">Save Product</button>
        </div>
    </div>
</div>

<!-- ===== Adjust stock popup ===== -->
<div class="vd-modal-overlay" id="ivAdjModal">
    <div class="vd-modal vd-modal-sm">
        <div class="vd-modal-head">
            <h3>Adjust Stock</h3>
            <button type="button" class="vd-close" data-close="ivAdjModal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="vd-modal-body">
            <div class="vd-pay-sum" id="aiSummary"></div>

            <div class="vd-field">
                <label>What happened?</label>
                <select class="vd-input" id="aiType">
                    <option value="add">Add stock</option>
                    <option value="remove">Remove stock</option>
                </select>
            </div>

            <div class="vd-field">
                <label>Quantity <span class="vd-req">*</span></label>
                <input type="number" class="vd-input" id="aiQty" min="0" step="any" placeholder="0">
                <small class="vd-err" data-err="aiQty"></small>
            </div>

            <div class="vd-field">
                <label>Reason</label>
                <select class="vd-input" id="aiReason">
                    <option>Count correction</option>
                    <option>Damaged</option>
                    <option>Lost or stolen</option>
                    <option>Customer return</option>
                    <option>Other</option>
                </select>
            </div>

            <div class="vd-field">
                <label>Date <span class="vd-req">*</span></label>
                <input type="date" class="vd-input" id="aiDate">
                <small class="vd-err" data-err="aiDate"></small>
            </div>

            <div class="vd-field">
                <label>Note</label>
                <input type="text" class="vd-input" id="aiNote" maxlength="100" placeholder="Optional">
            </div>
        </div>

        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="ivAdjModal">Cancel</button>
            <button type="button" class="vd-btn-primary" id="aiSave">Save Adjustment</button>
        </div>
    </div>
</div>

<!-- ===== Delete confirm popup ===== -->
<div class="vd-modal-overlay" id="ivConfirmModal">
    <div class="vd-modal vd-modal-sm">
        <div class="vd-modal-body vd-confirm">
            <div class="vd-confirm-icon"><i class="fa-regular fa-trash-can"></i></div>
            <h3>Delete this product?</h3>
            <p id="icText"></p>
        </div>
        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="ivConfirmModal">Cancel</button>
            <button type="button" class="vd-btn-danger" id="icOk">Yes, delete</button>
        </div>
    </div>
</div>

<div class="vd-toast" id="ivToast"></div>

</div>

@endsection