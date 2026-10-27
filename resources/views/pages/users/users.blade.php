@extends('layout.app')

@section('title', 'Users and Roles')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/vendors/vendors.css') }}">
<link rel="stylesheet" href="{{ asset('css/users/users.css') }}">
@endpush

@push('scripts')
<script src="{{ asset('js/users/users.js') }}"></script>
@endpush

@section('content')

<div class="vd-head">
    <div>
        <h1 class="vd-title">Users and Roles</h1>
        <p class="vd-sub">Add your team and decide who can see and do what.</p>
    </div>
    <button type="button" class="vd-btn-primary" id="usNew"><i class="fa-solid fa-user-plus"></i> Add User</button>
</div>

<!-- ===== Cards ===== -->
<div class="vd-cards">
    <div class="vd-card">
        <div class="vd-icon vd-icon-main"><i class="fa-solid fa-users"></i></div>
        <div>
            <div class="vd-value" id="usCardTotal">0</div>
            <div class="vd-label">Total Users</div>
        </div>
    </div>
    <div class="vd-card">
        <div class="vd-icon vd-icon-blue"><i class="fa-solid fa-user-check"></i></div>
        <div>
            <div class="vd-value" id="usCardActive">0</div>
            <div class="vd-label">Active</div>
        </div>
    </div>
    <div class="vd-card">
        <div class="vd-icon vd-icon-orange"><i class="fa-solid fa-user-slash"></i></div>
        <div>
            <div class="vd-value" id="usCardInactive">0</div>
            <div class="vd-label">Inactive</div>
        </div>
    </div>
    <div class="vd-card">
        <div class="vd-icon vd-icon-red"><i class="fa-solid fa-crown"></i></div>
        <div>
            <div class="vd-value" id="usCardOwners">0</div>
            <div class="vd-label">Owners</div>
        </div>
    </div>
</div>

<!-- ===== Roles explained ===== -->
<div class="us-roles" id="usRoles"></div>

<!-- ===== List ===== -->
<div class="vd-panel">
    <div class="vd-toolbar">
        <div class="vd-search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="usSearch" placeholder="Search by name, email or job title">
        </div>

        <div class="vd-chips" id="usChips">
            <button type="button" class="vd-chip active" data-filter="all">All <span>0</span></button>
            <button type="button" class="vd-chip" data-filter="active">Active <span>0</span></button>
            <button type="button" class="vd-chip" data-filter="inactive">Inactive <span>0</span></button>
        </div>

        <select class="vd-sort" id="usRole"></select>
    </div>

    <div class="vd-table-wrap">
        <table class="vd-table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Contact</th>
                    <th>Last Login</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="usRows"></tbody>
        </table>
    </div>
</div>

<!-- ===== Add / Edit popup ===== -->
<div class="vd-modal-overlay" id="usFormModal">
    <div class="vd-modal vd-modal-lg">
        <div class="vd-modal-head">
            <h3 id="usFormTitle">Add User</h3>
            <button type="button" class="vd-close" data-close="usFormModal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="vd-modal-body">
            <div class="vd-grid">
                <div class="vd-field">
                    <label>Full Name <span class="vd-req">*</span></label>
                    <input type="text" class="vd-input" id="ufName" maxlength="80" placeholder="e.g. Ayesha Khan">
                    <small class="vd-err" data-err="ufName"></small>
                </div>

                <div class="vd-field">
                    <label>Email <span class="vd-req">*</span></label>
                    <input type="email" class="vd-input" id="ufEmail" maxlength="120" placeholder="name@company.com" autocomplete="off">
                    <small class="vd-err" data-err="ufEmail"></small>
                </div>

                <div class="vd-field">
                    <label>Phone</label>
                    <input type="text" class="vd-input" id="ufPhone" maxlength="30" placeholder="Optional">
                    <small class="vd-err" data-err="ufPhone"></small>
                </div>

                <div class="vd-field">
                    <label>Job Title</label>
                    <input type="text" class="vd-input" id="ufJob" maxlength="80" placeholder="e.g. Sales Executive">
                </div>

                <div class="vd-field">
                    <label>Role <span class="vd-req">*</span></label>
                    <select class="vd-input" id="ufRole"></select>
                    <small class="vd-hint" id="ufRoleAbout"></small>
                    <small class="vd-err" data-err="ufRole"></small>
                </div>

                <div class="vd-field">
                    <label>Status</label>
                    <select class="vd-input" id="ufStatus">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive (cannot log in)</option>
                    </select>
                </div>

                <div class="vd-field vd-full">
                    <label id="ufPassLabel">Password <span class="vd-req">*</span></label>
                    <input type="password" class="vd-input" id="ufPass" maxlength="100" autocomplete="new-password" placeholder="At least 8 characters, letters and numbers">
                    <small class="vd-hint" id="ufPassHint"></small>
                    <small class="vd-err" data-err="ufPass"></small>
                </div>
            </div>
        </div>

        <div class="vd-modal-foot">
            <button type="button" class="vd-btn-ghost" data-close="usFormModal">Cancel</button>
            <button type="button" class="vd-btn-primary" id="usSave">Save User</button>
        </div>
    </div>
</div>

<div class="vd-toast" id="usToast"></div>

@endsection