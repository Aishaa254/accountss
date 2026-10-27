(function () {
    function $(id) { return document.getElementById(id); }

    function esc(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function fmtWhen(iso) {
        var d = new Date(iso);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
            d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    var labels = {
        created: 'Added',
        updated: 'Changed',
        deleted: 'Deleted',
        login: 'Logged in',
        logout: 'Logged out',
        password_reset: 'Password reset',
        password_changed: 'Password changed'
    };

    // Database ke naam ko insaani naam mein (cost_price -> Cost price)
    function fieldName(key) {
        var s = key.replace(/_/g, ' ');
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function show(v) {
        if (v === null || v === undefined || v === '') { return 'empty'; }
        return String(v);
    }

    var state = { page: 1, q: '', user: '', action: '', from: '', to: '' };
    var pages = 1;

    function changesHtml(changes) {
        var keys = Object.keys(changes || {});
        if (!keys.length) { return ''; }
        return '<div class="au-changes">' + keys.slice(0, 6).map(function (k) {
            var c = changes[k];
            return '<div class="au-change"><b>' + esc(fieldName(k)) + ':</b> ' +
                '<span class="au-from">' + esc(show(c.from)) + '</span><i class="fa-solid fa-arrow-right au-arrow"></i>' +
                '<span>' + esc(show(c.to)) + '</span></div>';
        }).join('') + (keys.length > 6 ? '<div class="au-change">and ' + (keys.length - 6) + ' more</div>' : '') + '</div>';
    }

    function rowHtml(r) {
        var what = r.text ? esc(r.text) : '-';
        return '<tr>' +
            '<td>' + esc(fmtWhen(r.when)) + '</td>' +
            '<td><div class="vd-name">' + esc(r.user) + '</div>' + (r.ip ? '<div class="au-type">' + esc(r.ip) + '</div>' : '') + '</td>' +
            '<td><span class="au-badge au-' + esc(r.action) + '">' + esc(labels[r.action] || r.action) + '</span></td>' +
            '<td><div>' + what + '</div>' + (r.type ? '<div class="au-type">' + esc(r.type) + '</div>' : '') + changesHtml(r.changes) + '</td>' +
        '</tr>';
    }

    function load() {
        var params = new URLSearchParams();
        params.set('page', state.page);
        ['q', 'user', 'action', 'from', 'to'].forEach(function (k) { if (state[k]) { params.set(k, state[k]); } });

        fetch('/audit-log/list?' + params.toString(), { headers: { 'Accept': 'application/json' } })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                pages = data.pages;

                if (!$('auUser').options.length) {
                    $('auUser').innerHTML = '<option value="">Everyone</option>' + data.users.map(function (u) {
                        return '<option value="' + u.id + '">' + esc(u.name) + '</option>';
                    }).join('');
                }

                $('auRows').innerHTML = data.data.length
                    ? data.data.map(rowHtml).join('')
                    : '<tr class="vd-empty"><td colspan="4"><i class="fa-regular fa-folder-open"></i>No activity found</td></tr>';

                $('auInfo').textContent = data.total + ' record(s) - page ' + data.page + ' of ' + data.pages;
                $('auPrev').disabled = data.page <= 1;
                $('auNext').disabled = data.page >= data.pages;
            });
    }

    function reset() { state.page = 1; load(); }

    var timer;
    $('auSearch').addEventListener('input', function () {
        state.q = this.value.trim();
        clearTimeout(timer);
        timer = setTimeout(reset, 300);
    });
    $('auUser').addEventListener('change', function () { state.user = this.value; reset(); });
    $('auAction').addEventListener('change', function () { state.action = this.value; reset(); });
    $('auFrom').addEventListener('change', function () { state.from = this.value; reset(); });
    $('auTo').addEventListener('change', function () { state.to = this.value; reset(); });

    $('auClear').addEventListener('click', function () {
        state = { page: 1, q: '', user: '', action: '', from: '', to: '' };
        $('auSearch').value = '';
        $('auUser').value = '';
        $('auAction').value = '';
        $('auFrom').value = '';
        $('auTo').value = '';
        load();
    });

    $('auPrev').addEventListener('click', function () { if (state.page > 1) { state.page--; load(); } });
    $('auNext').addEventListener('click', function () { if (state.page < pages) { state.page++; load(); } });

    load();
})();