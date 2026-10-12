<nav class="navbar">
    <div class="navbar-left">
        <button class="menu-btn"><i class="fa-solid fa-bars"></i></button>
        <p class="breadcrumb">
            Home <i class="fa-solid fa-angle-right"></i>
            <span>@yield('title')</span>
        </p>
    </div>

    <div class="navbar-right">
        <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search...">
        </div>

        <button class="icon-btn">
            <i class="fa-regular fa-bell"></i>
            <span class="dot"></span>
        </button>

        <div class="user">
            <div class="user-circle">A</div>
            <div class="user-info">
                <p class="user-name">Admin</p>
                <p class="user-role">Accountant</p>
            </div>
        </div>
    </div>
</nav>