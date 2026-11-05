// CustomerPicker.create({ noun: 'vendor', customers: function () { return [...]; }, onSelect: function (c) {} })
// returns { el, get(), set(id), clear() }
(function () {
    var panel = null, search = null, listEl = null, emptyEl = null;
    var active = null, hi = -1, shown = [];

    function esc(t) {
        return String(t == null ? '' : t)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function letter(c) { return esc(String(c.name).charAt(0).toUpperCase()); }

    function ensurePanel() {
        if (panel) { return; }

        panel = document.createElement('div');
        panel.className = 'pp-panel';
        panel.innerHTML =
            '<div class="pp-search"><i class="fa-solid fa-magnifying-glass"></i>' +
            '<input type="text" placeholder="Search customer" autocomplete="off"></div>' +
            '<div class="pp-list"></div>' +
            '<div class="pp-empty">No customer found</div>';
        document.body.appendChild(panel);

        search = panel.querySelector('input');
        listEl = panel.querySelector('.pp-list');
        emptyEl = panel.querySelector('.pp-empty');

        search.addEventListener('input', function () { hi = -1; render(); });
        search.addEventListener('keydown', onKey);

        listEl.addEventListener('mousedown', function (e) { e.preventDefault(); });
        listEl.addEventListener('click', function (e) {
            var row = e.target.closest('.pp-item');
            if (!row) { return; }
            choose(Number(row.getAttribute('data-id')));
        });
        listEl.addEventListener('mousemove', function (e) {
            var row = e.target.closest('.pp-item');
            if (!row) { return; }
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

        shown = (active.opts.customers() || []).filter(function (c) {
            if (!q) { return true; }
            return (c.name + ' ' + (c.phone || '')).toLowerCase().indexOf(q) !== -1;
        });

        if (hi < 0 || hi >= shown.length) { hi = shown.length ? 0 : -1; }

        listEl.innerHTML = shown.map(function (c, i) {
            return '<div class="pp-item' + (i === hi ? ' hi' : '') +
                (c.id === active.value ? ' sel' : '') + '" data-id="' + c.id + '" data-i="' + i + '">' +
                '<span class="pp-av">' + letter(c) + '</span>' +
                '<span class="pp-info"><b>' + esc(c.name) + '</b>' +
                    (c.phone ? '<small>' + esc(c.phone) + '</small>' : '') + '</span>' +
            '</div>';
        }).join('');

        listEl.style.display = shown.length ? '' : 'none';
        emptyEl.style.display = shown.length ? 'none' : 'block';
    }

    function markHi(scroll) {
        listEl.querySelectorAll('.pp-item').forEach(function (r, i) {
            r.classList.toggle('hi', i === hi);
            if (i === hi && scroll) { r.scrollIntoView({ block: 'nearest' }); }
        });
    }

    function move(step) {
        if (!shown.length) { return; }
        hi = (hi + step + shown.length) % shown.length;
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
        var w = Math.max(r.width, 300);
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
        search.placeholder = 'Search ' + (api.opts.noun || 'customer');
        emptyEl.textContent = 'No ' + (api.opts.noun || 'customer') + ' found';
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
        var c = (api.opts.customers() || []).filter(function (x) { return x.id === id; })[0];
        if (!c) { return; }

        close();
        api.setCustomer(c);
        api.el.focus();
        if (api.opts.onSelect) { api.opts.onSelect(c); }
    }

    window.CustomerPicker = {
        create: function (opts) {
            var el = document.createElement('div');
            el.className = 'pp';
            el.tabIndex = 0;

            var api = { el: el, opts: opts, value: null };

            function paint(c) {
                if (!c) {
                    el.innerHTML = '<span class="pp-av pp-av-empty"><i class="fa-solid fa-user"></i></span>' +
                        '<span class="pp-text pp-placeholder">Select ' + (opts.noun || 'customer') + '</span>' +
                        '<i class="fa-solid fa-chevron-down pp-chev"></i>';
                    return;
                }
                el.innerHTML = '<span class="pp-av">' + letter(c) + '</span>' +
                    '<span class="pp-text"><b>' + esc(c.name) + '</b></span>' +
                    '<i class="fa-solid fa-chevron-down pp-chev"></i>';
            }

            api.get = function () { return api.value; };

            api.setCustomer = function (c) {
                api.value = c ? c.id : null;
                paint(c);
                el.classList.remove('is-invalid');
            };

            api.set = function (id) {
                var c = (opts.customers() || []).filter(function (x) { return x.id === Number(id); })[0];
                api.setCustomer(c || null);
            };

            api.clear = function () { api.setCustomer(null); };

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