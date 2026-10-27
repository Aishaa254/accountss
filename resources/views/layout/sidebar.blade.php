@php $me = auth()->user(); @endphp
<aside class="sidebar">

    <div class="logo">
        <img id="sidebarLogo" class="logo-img" alt="Logo" style="display:none">
        <span class="logo-icon" id="sidebarIcon">A</span>
        <h2 id="sidebarTitle">AccountPro</h2>
    </div>

    @if ($me->hasPermission('dashboard'))
    <p class="menu-title">Overview</p>
    <a href="/" class="menu-link {{ request()->is('/') ? 'active' : '' }}">
        <i class="fa-solid fa-house"></i> Dashboard
    </a>
    @endif

    @if ($me->hasPermission('sales'))
    <p class="menu-title">Sales</p>
    <a href="/invoices" class="menu-link {{ request()->is('invoices') ? 'active' : '' }}">
        <i class="fa-solid fa-file-invoice"></i> Invoices
    </a>
    <a href="/customers" class="menu-link {{ request()->is('customers') ? 'active' : '' }}">
        <i class="fa-solid fa-users"></i> Customers
    </a>
    @endif

    @if ($me->hasPermission('purchases'))
    <p class="menu-title">Purchase</p>
    <a href="/vendors" class="menu-link {{ request()->is('vendors') ? 'active' : '' }}">
        <i class="fa-solid fa-truck"></i> Vendors
    </a>
    <a href="/purchases" class="menu-link {{ request()->is('purchases') ? 'active' : '' }}">
        <i class="fa-solid fa-cart-shopping"></i> Purchases
    </a>
    @endif

    @if ($me->hasPermission('inventory'))
    <p class="menu-title">Inventory</p>
    <a href="/inventory" class="menu-link {{ request()->is('inventory') && !request('filter') ? 'active' : '' }}">
        <i class="fa-solid fa-boxes-stacked"></i> All Products
    </a>
    <a href="/inventory?filter=attention" class="menu-link has-badge {{ request()->is('inventory') && request('filter') === 'attention' ? 'active' : '' }}">
        <i class="fa-solid fa-triangle-exclamation"></i> Low Stock
        <span class="menu-badge" id="invLowBadge" style="display:none"></span>
    </a>
    <a href="/inventory?filter=slow" class="menu-link {{ request()->is('inventory') && request('filter') === 'slow' ? 'active' : '' }}">
        <i class="fa-solid fa-hourglass-half"></i> Slow Moving
    </a>
    @endif

    @if ($me->hasPermission('expenses') || $me->hasPermission('reports'))
    <p class="menu-title">Accounting</p>
    @endif
    @if ($me->hasPermission('expenses'))
    <a href="/expenses" class="menu-link {{ request()->is('expenses') ? 'active' : '' }}">
        <i class="fa-solid fa-wallet"></i> Expenses
    </a>
    @endif
    @if ($me->hasPermission('reports'))
    <a href="/reports" class="menu-link {{ request()->is('reports') ? 'active' : '' }}">
        <i class="fa-solid fa-chart-pie"></i> Reports
    </a>
    @endif

    @if ($me->hasPermission('users') || $me->hasPermission('audit'))
    <p class="menu-title">Team</p>
    @endif
    @if ($me->hasPermission('users'))
    <a href="/users" class="menu-link {{ request()->is('users') ? 'active' : '' }}">
        <i class="fa-solid fa-user-group"></i> Users and Roles
    </a>
    @endif
    @if ($me->hasPermission('audit'))
    <a href="/audit-log" class="menu-link {{ request()->is('audit-log') ? 'active' : '' }}">
        <i class="fa-solid fa-clock-rotate-left"></i> Activity Log
    </a>
    @endif

    @if ($me->hasPermission('settings'))
    <p class="menu-title">Settings</p>
    <a href="/settings" class="menu-link {{ request()->is('settings') ? 'active' : '' }}">
        <i class="fa-solid fa-gear"></i> Settings
    </a>
    @endif
</aside>
@if ($me->hasPermission('inventory'))
<script>
    fetch('/inventory/summary', { headers: { 'Accept': 'application/json' } })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (d) {
            if (!d || !d.attention) { return; }
            var b = document.getElementById('invLowBadge');
            b.textContent = d.attention > 99 ? '99+' : d.attention;
            b.title = d.low + ' low, ' + d.out + ' out of stock';
            b.style.display = 'inline-block';
        });
</script>
@endif