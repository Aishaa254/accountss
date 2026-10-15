<aside class="sidebar">

    <div class="logo">
        <img id="sidebarLogo" class="logo-img" alt="Logo" style="display:none">
        <span class="logo-icon" id="sidebarIcon">A</span>
        <h2 id="sidebarTitle">AccountPro</h2>
    </div>

    <p class="menu-title">Overview</p>
    <a href="/" class="menu-link {{ request()->is('/') ? 'active' : '' }}">
        <i class="fa-solid fa-house"></i> Dashboard
    </a>
    <p class="menu-title">Sales</p>
    <a href="/invoices" class="menu-link {{ request()->is('invoices') ? 'active' : '' }}">
        <i class="fa-solid fa-file-invoice"></i> Invoices
    </a>
    <a href="/customers" class="menu-link {{ request()->is('customers') ? 'active' : '' }}">
        <i class="fa-solid fa-users"></i> Customers
    </a>

    <p class="menu-title">Purchase</p>
    <a href="/vendors" class="menu-link {{ request()->is('vendors') ? 'active' : '' }}">
        <i class="fa-solid fa-truck"></i> Vendors
    </a>
    <a href="/purchases" class="menu-link {{ request()->is('purchases') ? 'active' : '' }}">
        <i class="fa-solid fa-cart-shopping"></i> Purchases
    </a>

    <p class="menu-title">Accounting</p>
    <a href="/expenses" class="menu-link {{ request()->is('expenses') ? 'active' : '' }}">
        <i class="fa-solid fa-wallet"></i> Expenses
    </a>
    <a href="/reports" class="menu-link {{ request()->is('reports') ? 'active' : '' }}">
        <i class="fa-solid fa-chart-pie"></i> Reports
    </a>

    <p class="menu-title">Settings</p>
    <a href="/settings" class="menu-link">
        <i class="fa-solid fa-gear"></i> Settings
    </a>
</aside>