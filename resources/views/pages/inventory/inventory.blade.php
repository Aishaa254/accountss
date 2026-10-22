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

<div class="vd-head">
    <div>
        <h1 class="vd-title">Inventory</h1>
        <p class="vd-sub">Know what you have, what is selling, and what to order next.</p>
    </div>
    <button type="button" class="vd-btn-primary" id="ivNew"><i class="fa-solid fa-plus"></i> Add Product</button>
</div>

<!-- ===== Cards ===== -->
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

<!-- ===== Insights ===== -->
<div class="iv-insights">
    <div class="vd-panel">
        <div class="iv-box-body">
            <h3 class="iv-box-title"><i class="fa-solid fa-fire"></i> Best Sellers</h3>
            <div id="ivBest"></div>
        </div>
    </div>

    <div class="vd-panel">
        <div class="iv-box-body">
            <h3 class="iv-box-title"><i class="fa-solid fa-cart-arrow-down"></i> Time to Reorder</h3>
            <div id="ivReorder"></div>
        </div>
    </div>

    <div class="vd-panel">
        <div class="iv-box-body">
            <h3 class="iv-box-title"><i class="fa-solid fa-snowflake"></i> Slow Moving</h3>
            <div id="ivSlow"></div>
        </div>
    </div>
</div>

<!-- ===== List ===== -->
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
    </div>

    <div class="vd-table-wrap">
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

@endsection