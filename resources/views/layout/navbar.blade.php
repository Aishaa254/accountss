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

        <div class="user" id="userMenuBtn" tabindex="0">
            <div class="user-circle">{{ strtoupper(mb_substr(auth()->user()->name, 0, 1)) }}</div>
            <div class="user-info">
                <p class="user-name">{{ auth()->user()->name }}</p>
                <p class="user-role">{{ auth()->user()->roleLabel() }}</p>
            </div>
            <i class="fa-solid fa-chevron-down user-caret"></i>

            <div class="user-dropdown" id="userDropdown">
                <button type="button" class="ud-item" id="udPassword"><i class="fa-solid fa-key"></i> Change password</button>
                <form method="POST" action="/logout">
                    @csrf
                    <button type="submit" class="ud-item ud-danger"><i class="fa-solid fa-right-from-bracket"></i> Log out</button>
                </form>
            </div>
        </div>
    </div>
</nav>

<!-- ===== Change my password ===== -->
<div class="pw-overlay" id="pwOverlay">
    <div class="pw-box">
        <div class="pw-head">
            <h3>Change password</h3>
            <button type="button" class="pw-x" id="pwClose"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="pw-field">
            <label>Current password <span class="pw-req">*</span></label>
            <input type="password" id="pwCurrent" maxlength="100" autocomplete="current-password">
            <small class="pw-err" id="pwCurrentErr"></small>
        </div>
        <div class="pw-field">
            <label>New password <span class="pw-req">*</span></label>
            <input type="password" id="pwNew" maxlength="100" autocomplete="new-password" placeholder="At least 8 characters, letters and numbers">
            <small class="pw-err" id="pwNewErr"></small>
        </div>
        <div class="pw-field">
            <label>Confirm new password <span class="pw-req">*</span></label>
            <input type="password" id="pwConfirm" maxlength="100" autocomplete="new-password">
            <small class="pw-err" id="pwConfirmErr"></small>
        </div>

        <div class="pw-foot">
            <button type="button" class="pw-btn pw-ghost" id="pwCancel">Cancel</button>
            <button type="button" class="pw-btn pw-main" id="pwSave">Save password</button>
        </div>
    </div>
</div>
<div class="pw-toast" id="pwToast"></div>

<script>
    (function () {
        var btn = document.getElementById('userMenuBtn');
        var dd = document.getElementById('userDropdown');
        var ov = document.getElementById('pwOverlay');
        function $(id) { return document.getElementById(id); }

        btn.addEventListener('click', function (e) {
            if (e.target.closest('.user-dropdown')) { return; }
            dd.classList.toggle('open');
        });
        document.addEventListener('click', function (e) {
            if (!btn.contains(e.target)) { dd.classList.remove('open'); }
        });

        function clearErrs() {
            ['pwCurrentErr', 'pwNewErr', 'pwConfirmErr'].forEach(function (id) { $(id).textContent = ''; });
        }
        function openPw() {
            ['pwCurrent', 'pwNew', 'pwConfirm'].forEach(function (id) { $(id).value = ''; });
            clearErrs();
            dd.classList.remove('open');
            ov.classList.add('open');
            setTimeout(function () { $('pwCurrent').focus(); }, 80);
        }
        function closePw() { ov.classList.remove('open'); }

        $('udPassword').addEventListener('click', openPw);
        $('pwClose').addEventListener('click', closePw);
        $('pwCancel').addEventListener('click', closePw);
        ov.addEventListener('click', function (e) { if (e.target === ov) { closePw(); } });

        function showToast(text) {
            var t = $('pwToast');
            t.textContent = text;
            t.classList.add('show');
            setTimeout(function () { t.classList.remove('show'); }, 2600);
        }

        $('pwSave').addEventListener('click', function () {
            clearErrs();
            var cur = $('pwCurrent').value;
            var pw = $('pwNew').value;
            var cf = $('pwConfirm').value;
            var ok = true;

            if (!cur) { $('pwCurrentErr').textContent = 'Enter your current password'; ok = false; }
            if (pw.length < 8) { $('pwNewErr').textContent = 'Use at least 8 characters'; ok = false; }
            else if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) { $('pwNewErr').textContent = 'Use both letters and numbers'; ok = false; }
            if (cf !== pw) { $('pwConfirmErr').textContent = 'The two passwords do not match'; ok = false; }
            if (!ok) { return; }

            fetch('/profile/password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ current_password: cur, password: pw, password_confirmation: cf })
            }).then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (data) {
                    if (res.ok) { closePw(); showToast('Password changed'); return; }
                    var e = data.errors || {};
                    if (e.current_password) { $('pwCurrentErr').textContent = e.current_password[0]; }
                    if (e.password) { $('pwNewErr').textContent = e.password[0]; }
                    if (!e.current_password && !e.password) { $('pwNewErr').textContent = data.message || 'Could not change password'; }
                });
            });
        });
    })();
</script>