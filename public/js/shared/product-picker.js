// Product selector used on Invoices and Purchases.
// ProductPicker.create({ mode: 'sale' | 'purchase', products: function () { return [...]; }, onSelect: function (p) {} })
// returns { el, get(), set(id, fallbackName), clear() }
(function () {
    var panel = null, search = null, listEl = null, emptyEl = null;
    var active = null, hi = -1, shown = [];

    function esc(t) {
        return String(t == null ? '' : t)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function money(n) { return typeof formatMoney === 'function' ? formatMoney(Number(n) || 0) : String(n); }
    function num(n) { return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }); }

    function avatarHtml(p) {
        return p.image ? '<img src="' + esc(p.image) + '" alt="">' : esc(String(p.name).charAt(0).toUpperCase());
    }

    function isOut(p) { return active && active.opts.mode === 'sale' && p.stock <= 0; }

    function firstEnabled() {
        for (var i = 0; i < shown.length; i++) { if (!isOut(shown[i])) { return i; } }
        return -1;
    }

    // ---------- The dropdown panel (one shared panel for the whole page) ----------
    function ensurePanel() {
        if (panel) { return; }

        panel = document.createElement('div');
        panel.className = 'pp-panel';
        panel.innerHTML =
            '<div class="pp-search"><i class="fa-solid fa-magnifying-glass"></i>' +
            '<input type="text" placeholder="Search product" autocomplete="off"></div>' +
            '<div class="pp-list"></div>' +
            '<div class="pp-empty">No product found</div>';
        document.body.appendChild(panel);

        search = panel.querySelector('input');
        listEl = panel.querySelector('.pp-list');
        emptyEl = panel.querySelector('.pp-empty');

        search.addEventListener('input', function () { hi = -1; render(); });
        search.addEventListener('keydown', onKey);

        listEl.addEventListener('mousedown', function (e) { e.preventDefault(); });
        listEl.addEventListener('click', function (e) {
            var row = e.target.closest('.pp-item');
            if (!row || row.classList.contains('disabled')) { return; }
            choose(Number(row.getAttribute('data-id')));
        });
        listEl.addEventListener('mousemove', function (e) {
            var row = e.target.closest('.pp-item');
            if (!row || row.classList.contains('disabled')) { return; }
            var idx = Number(row.getAttribute('data-i'));
            if (idx !== hi) { hi = idx; markHi(false); }
        });

        document.addEventListener('mousedown', function (e) {
            if (!active) { return; }
            if (panel.contains(e.target) || active.el.contains(e.target)) { return; }
            close();
        });
        window.addEventListener('resize', close);
        window.addEventListener('scroll', function (e) {
            if (active && !panel.contains(e.target)) { close(); }
        }, true);
    }

    function render() {
        var q = search.value.trim().toLowerCase();
        var mode = active.opts.mode;

        shown = (active.opts.products() || []).filter(function (p) {
            if (!q) { return true; }
            return (p.name + ' ' + (p.sku || '') + ' ' + (p.category || '')).toLowerCase().indexOf(q) !== -1;
        });

        if (hi < 0 || hi >= shown.length || isOut(shown[hi])) { hi = firstEnabled(); }

        listEl.innerHTML = shown.map(function (p, i) {
            var out = isOut(p);
            var price = mode === 'sale' ? p.sale : p.cost;
            var label = mode === 'sale' ? 'Sale price' : 'Last cost';
            var stockText = p.stock <= 0 ? 'Out of stock' : num(p.stock) + ' ' + esc(p.unit) + ' in stock';

            return '<div class="pp-item' + (out ? ' disabled' : '') + (i === hi ? ' hi' : '') +
                (p.id === active.value ? ' sel' : '') + '" data-id="' + p.id + '" data-i="' + i + '">' +
                '<span class="pp-av">' + avatarHtml(p) + '</span>' +
                '<span class="pp-info"><b>' + esc(p.name) + '</b>' +
                    '<small class="' + (p.stock <= 0 ? 'bad' : '') + '">' + stockText + '</small></span>' +
                '<span class="pp-price">' + money(price) + '<small>' + label + '</small></span>' +
            '</div>';
        }).join('');

        listEl.style.display = shown.length ? '' : 'none';
        emptyEl.style.display = shown.length ? 'none' : 'block';
    }

    function markHi(scroll) {
        var rows = listEl.querySelectorAll('.pp-item');
        rows.forEach(function (r, i) {
            r.classList.toggle('hi', i === hi);
            if (i === hi && scroll) { r.scrollIntoView({ block: 'nearest' }); }
        });
    }

    function move(step) {
        if (!shown.length) { return; }
        var i = hi;
        for (var n = 0; n < shown.length; n++) {
            i = (i + step + shown.length) % shown.length;
            if (!isOut(shown[i])) { hi = i; break; }
        }
        markHi(true);
    }

    function onKey(e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (hi >= 0 && shown[hi]) { choose(shown[hi].id); }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            var el = active && active.el;
            close();
            if (el) { el.focus(); }
        }
    }

    function position(el) {
        var r = el.getBoundingClientRect();
        var w = Math.max(r.width, 340);
        var left = Math.min(Math.max(10, r.left), window.innerWidth - w - 10);
        var below = window.innerHeight - r.bottom;

        panel.style.width = w + 'px';
        panel.style.left = left + 'px';

        if (below < 330 && r.top > below) {
            panel.style.top = 'auto';
            panel.style.bottom = (window.innerHeight - r.top + 6) + 'px';
            panel.classList.add('up');
        } else {
            panel.style.bottom = 'auto';
            panel.style.top = (r.bottom + 6) + 'px';
            panel.classList.remove('up');
        }
    }

    function open(api) {
        ensurePanel();
        if (active === api) { close(); return; }
        if (active) { active.el.classList.remove('open'); }

        active = api;
        search.value = '';
        hi = -1;
        render();
        position(api.el);

        panel.classList.add('fresh');
        panel.classList.add('open');
        api.el.classList.add('open');
        setTimeout(function () { panel.classList.remove('fresh'); }, 450);
        setTimeout(function () { search.focus(); }, 30);
    }

    function close() {
        if (!panel) { return; }
        panel.classList.remove('open');
        if (active) { active.el.classList.remove('open'); }
        active = null;
    }

    function choose(id) {
        if (!active) { return; }
        var api = active;
        var p = (api.opts.products() || []).filter(function (x) { return x.id === id; })[0];
        if (!p) { return; }

        close();
        api.setProduct(p);
        api.el.focus();
        if (api.opts.onSelect) { api.opts.onSelect(p); }
    }

    // ---------- One picker (the box shown inside a row) ----------
    window.ProductPicker = {
        create: function (opts) {
            var el = document.createElement('div');
            el.className = 'pp';
            el.tabIndex = 0;

            var api = { el: el, opts: opts, value: null };

            function paint(p) {
                if (!p) {
                    el.innerHTML = '<span class="pp-av pp-av-empty"><i class="fa-solid fa-box"></i></span>' +
                        '<span class="pp-text pp-placeholder">Select product</span>' +
                        '<i class="fa-solid fa-chevron-down pp-chev"></i>';
                    return;
                }
                el.innerHTML = '<span class="pp-av">' + avatarHtml(p) + '</span>' +
                    '<span class="pp-text"><b>' + esc(p.name) + '</b>' + (p.unit ? '<small>' + esc(p.unit) + '</small>' : '') + '</span>' +
                    '<i class="fa-solid fa-chevron-down pp-chev"></i>';
            }

            api.get = function () { return api.value; };

            api.setProduct = function (p) {
                api.value = p ? p.id : null;
                paint(p);
                el.classList.remove('is-invalid');
            };

            // Used when an old record is opened. If the product is not in the list (inactive), show its name
            api.set = function (id, fallbackName) {
                var p = (opts.products() || []).filter(function (x) { return x.id === Number(id); })[0];

                if (p) { api.setProduct(p); }
                else {
                    api.value = Number(id);
                    paint({ name: fallbackName || 'Product', image: '', unit: '' });
                }
            };

            api.clear = function () { api.value = null; paint(null); };

            el.addEventListener('click', function () { open(api); });
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    open(api);
                }
            });

            paint(null);
            return api;
        }
    };
})();