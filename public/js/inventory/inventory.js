(function () {
    // ---------- Helpers ----------
    function $(id) { return document.getElementById(id); }
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function toStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function todayStr() { return toStr(new Date()); }
    function parse(s) { var p = s.split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
    function fmtDate(s) { return parse(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    function money(n) { return formatMoney(Math.round(n * 100) / 100); }
    function num(n) { return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
    function sum(list, fn) { return list.reduce(function (s, x) { return s + fn(x); }, 0); }

    function esc(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ---------- Talking to Laravel ----------
    function api(method, url, body) {
        return fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: body ? JSON.stringify(body) : undefined
        }).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
                if (!res.ok) { throw new Error(data.message || 'request failed'); }
                return data;
            });
        });
    }

    // ---------- State ----------
    var products = [];
    var state = { filter: 'all', search: '', category: 'all', sort: 'name' };
    var openId = null;
    var current = null;
    var editingId = null;
    var adjustId = null;
    var deleteId = null;

    function find(id) {
        return products.filter(function (p) { return p.id === id; })[0];
    }

    function loadProducts() {
        return api('GET', '/inventory/list').then(function (data) {
            products = data;
            fillCategories();
            render();

            if (current && $('ivSide').classList.contains('open')) {
                var fresh = find(current.id);
                if (fresh) { openDetail(fresh); }
            }
        });
    }

    // ---------- Small calculations ----------
    function margin(p) { return p.sale > 0 ? Math.round(((p.sale - p.cost) / p.sale) * 100) : 0; }
    function stockValue(p) { return Math.max(p.stock, 0) * p.cost; }

    function statusBadge(p) {
        if (!p.active) { return '<span class="vd-badge vd-badge-inactive">Inactive</span>'; }
        var labels = { in: 'In stock', low: 'Low stock', out: 'Out of stock' };
        return '<span class="iv-badge iv-badge-' + p.status + '">' + labels[p.status] + '</span>';
    }

    function daysText(p) {
        if (p.stock <= 0) { return 'Out of stock'; }
        if (p.daysLeft !== null) { return 'About ' + p.daysLeft + ' days left'; }
        return 'No sales in 30 days';
    }

    function toast(message, type) {
        var t = $('ivToast');
        t.textContent = message;
        t.className = 'vd-toast show ' + (type || 'ok');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(function () { t.className = 'vd-toast'; }, 2600);
    }

    function openModal(id) { $(id).classList.add('open'); }
    function closeModal(id) { $(id).classList.remove('open'); }

    function setErr(id, msg) {
        var el = document.querySelector('[data-err="' + id + '"]');
        if (el) { el.textContent = msg || ''; }
        var input = $(id);
        if (input) { input.classList.toggle('vd-invalid', !!msg); }
    }

    function clearErrs(ids) { ids.forEach(function (id) { setErr(id, ''); }); }

    // ---------- Cards ----------
    function renderCards() {
        var active = products.filter(function (p) { return p.active; });
        var stocked = active.filter(function (p) { return p.stock > 0; });
        var costValue = sum(stocked, function (p) { return p.stock * p.cost; });
        var saleValue = sum(stocked, function (p) { return p.stock * p.sale; });
        var lowList = active.filter(function (p) { return p.status === 'low' || p.status === 'out'; });
        var outList = active.filter(function (p) { return p.status === 'out'; });
        var slow = active.filter(function (p) { return p.dead; });
        var slowValue = sum(slow, function (p) { return p.stock * p.cost; });

        $('ivCardCount').textContent = products.length;
        $('ivCardCountNote').textContent = active.length + ' active';
        $('ivCardValue').textContent = money(costValue);
        $('ivCardValueNote').textContent = 'Worth ' + money(saleValue) + ' when sold';
        $('ivCardLow').textContent = lowList.length;
        $('ivCardLowNote').textContent = outList.length + ' out of stock';
        $('ivCardSlow').textContent = money(slowValue);
        $('ivCardSlowNote').textContent = slow.length + ' product(s) not sold in 60 days';
    }

    // ---------- Insights ----------
    function insightRows(list, rowFn, emptyText) {
        return list.length ? list.map(rowFn).join('') : '<div class="iv-empty">' + esc(emptyText) + '</div>';
    }

    function renderInsights() {
        var active = products.filter(function (p) { return p.active; });

        var best = active.filter(function (p) { return p.revenue > 0; })
            .sort(function (a, b) { return b.revenue - a.revenue; }).slice(0, 5);

        $('ivBest').innerHTML = insightRows(best, function (p) {
            return '<div class="iv-row"><div>' + esc(p.name) + '<small>' + num(p.sold) + ' ' + esc(p.unit) + ' sold</small></div>' +
                '<b>' + money(p.revenue) + '</b></div>';
        }, 'No sales yet. Link products in invoices to see this.');

        var reorder = active.filter(function (p) { return p.suggest > 0; })
            .sort(function (a, b) {
                if ((a.status === 'out') !== (b.status === 'out')) { return a.status === 'out' ? -1 : 1; }
                return (a.daysLeft === null ? 9999 : a.daysLeft) - (b.daysLeft === null ? 9999 : b.daysLeft);
            }).slice(0, 5);

        $('ivReorder').innerHTML = insightRows(reorder, function (p) {
            return '<div class="iv-row"><div>' + esc(p.name) + '<small>' + esc(daysText(p)) + '</small></div>' +
                '<b>Order ' + num(p.suggest) + ' ' + esc(p.unit) + '</b></div>';
        }, 'Nothing to reorder right now.');

        var slow = active.filter(function (p) { return p.dead; })
            .sort(function (a, b) { return b.stock * b.cost - a.stock * a.cost; }).slice(0, 5);

        $('ivSlow').innerHTML = insightRows(slow, function (p) {
            return '<div class="iv-row"><div>' + esc(p.name) + '<small>' +
                (p.lastSold ? 'Last sold ' + fmtDate(p.lastSold) : 'Never sold') + '</small></div>' +
                '<b>' + money(p.stock * p.cost) + '</b></div>';
        }, 'No slow stock. Everything is moving.');
    }

    // ---------- Product list ----------
    function fillCategories() {
        var cats = {};
        products.forEach(function (p) { cats[p.category] = true; });
        var names = Object.keys(cats).sort();

        var selected = state.category;
        $('ivCat').innerHTML = '<option value="all">All categories</option>' + names.map(function (c) {
            return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
        }).join('');
        $('ivCat').value = names.indexOf(selected) !== -1 ? selected : 'all';
        state.category = $('ivCat').value;

        var defaults = ['General', 'Raw Material', 'Finished Goods', 'Packaging', 'Spare Parts', 'Other'];
        defaults.forEach(function (d) { if (names.indexOf(d) === -1) { names.push(d); } });
        $('ivCategories').innerHTML = names.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('');
    }

    function matchesFilter(p) {
        if (state.filter === 'inactive') { return !p.active; }
        if (state.filter === 'attention') { return p.active && p.status !== 'in'; }
        if (state.filter === 'all') { return true; }
        if (!p.active) { return false; }
        if (state.filter === 'slow') { return p.dead; }
        return p.status === state.filter;
    }

    function getVisible() {
        var q = state.search.trim().toLowerCase();

        var list = products.filter(function (p) {
            if (!matchesFilter(p)) { return false; }
            if (state.category !== 'all' && p.category !== state.category) { return false; }
            if (q && (p.name + ' ' + p.sku + ' ' + p.category).toLowerCase().indexOf(q) === -1) { return false; }
            return true;
        });

        list.sort(function (a, b) {
            if (state.sort === 'stock') { return a.stock - b.stock; }
            if (state.sort === 'value') { return stockValue(b) - stockValue(a); }
            if (state.sort === 'sold') { return b.revenue - a.revenue; }
            return a.name.localeCompare(b.name);
        });

        return list;
    }

    function rowHtml(p) {
        var width = p.reorder > 0
            ? Math.min(100, Math.round((p.stock / (p.reorder * 3)) * 100))
            : (p.stock > 0 ? 100 : 0);
        var risky = p.status !== 'in';
        var avatar = 'vd-av-' + (((p.id - 1) % 5) + 1);

        return '<tr>' +
            '<td><div class="vd-vendor">' +
                '<span class="vd-avatar ' + avatar + '">' + esc(p.name.charAt(0).toUpperCase()) + '</span>' +
                '<div><div class="vd-name">' + esc(p.name) + (p.dead && p.active ? '<span class="iv-slow-tag">Slow</span>' : '') + '</div>' +
                '<div class="vd-company">' + (p.sku ? esc(p.sku) + ' - ' : '') + esc(p.category) + '</div></div>' +
            '</div></td>' +
            '<td><div class="vd-amount' + (p.stock <= 0 ? ' vd-red' : '') + '">' + num(p.stock) + ' ' + esc(p.unit) + '</div>' +
                '<div class="vd-bar' + (risky ? ' vd-bar-red' : '') + '"><span style="width:' + Math.max(0, width) + '%"></span></div>' +
                '<div class="vd-bar-note">' + esc(daysText(p)) + '</div></td>' +
            '<td><div class="vd-amount">' + money(p.sale) + '</div>' +
                '<div class="vd-bar-note">Cost ' + money(p.cost) + ' - ' + margin(p) + '% margin</div></td>' +
            '<td>' + money(stockValue(p)) + '</td>' +
            '<td>' + statusBadge(p) + '</td>' +
            '<td class="vd-actions"><button type="button" class="vd-dots" data-id="' + p.id + '"><i class="fa-solid fa-ellipsis-vertical"></i></button></td>' +
        '</tr>';
    }

    function renderChips() {
        var active = products.filter(function (p) { return p.active; });
        $('ivcAll').textContent = products.length;
        $('ivcIn').textContent = active.filter(function (p) { return p.status === 'in'; }).length;
        $('ivcLow').textContent = active.filter(function (p) { return p.status === 'low'; }).length;
        $('ivcOut').textContent = active.filter(function (p) { return p.status === 'out'; }).length;
        $('ivcSlow').textContent = active.filter(function (p) { return p.dead; }).length;
        $('ivcInactive').textContent = products.filter(function (p) { return !p.active; }).length;
    }

    function render() {
        var list = getVisible();

        $('ivRows').innerHTML = list.length
            ? list.map(rowHtml).join('')
            : '<tr class="vd-empty"><td colspan="6"><i class="fa-regular fa-folder-open"></i>No products found</td></tr>';

        renderCards();
        renderInsights();
        renderChips();
    }

    // ---------- Three dots menu ----------
    var menu = document.createElement('div');
    menu.className = 'vd-menu';
    menu.style.display = 'none';
    document.body.appendChild(menu);

    function menuItem(action, icon, label, extra) {
        return '<button type="button" class="vd-menu-item' + (extra ? ' ' + extra : '') + '" data-action="' + action + '">' +
            '<i class="' + icon + '"></i>' + label + '</button>';
    }

    function closeMenu() {
        menu.style.display = 'none';
        openId = null;
    }

    function openMenu(btn, p) {
        var html = menuItem('view', 'fa-regular fa-eye', 'View Details');
        html += menuItem('adjust', 'fa-solid fa-sliders', 'Adjust Stock');
        html += menuItem('edit', 'fa-regular fa-pen-to-square', 'Edit');
        html += menuItem('toggle', p.active ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye', p.active ? 'Make inactive' : 'Make active');
        html += '<div class="vd-menu-sep"></div>';
        html += menuItem('delete', 'fa-regular fa-trash-can', 'Delete', 'vd-danger');

        menu.innerHTML = html;
        menu.style.display = 'block';
        openId = p.id;

        var r = btn.getBoundingClientRect();
        var top = r.bottom + 6;
        if (top + menu.offsetHeight > window.innerHeight - 10) { top = r.top - menu.offsetHeight - 6; }
        var left = Math.max(10, r.right - menu.offsetWidth);

        menu.style.top = Math.max(10, top) + 'px';
        menu.style.left = left + 'px';
    }

    $('ivRows').addEventListener('click', function (e) {
        var btn = e.target.closest('.vd-dots');

        if (btn) {
            var id = Number(btn.getAttribute('data-id'));
            if (openId === id && menu.style.display === 'block') { closeMenu(); }
            else { openMenu(btn, find(id)); }
            return;
        }

        var row = e.target.closest('tr');
        var dots = row && row.querySelector('.vd-dots');
        if (!dots) { return; }
        var p = find(Number(dots.getAttribute('data-id')));
        if (p) { openDetail(p); }
    });

    menu.addEventListener('click', function (e) {
        var el = e.target.closest('.vd-menu-item');
        if (!el) { return; }

        var action = el.getAttribute('data-action');
        var p = find(openId);
        closeMenu();
        if (!p) { return; }

        if (action === 'view') { openDetail(p); }
        else if (action === 'adjust') { openAdjust(p); }
        else if (action === 'edit') { openForm(p); }
        else if (action === 'delete') { askDelete(p); }
        else if (action === 'toggle') {
            var next = !p.active;
            api('PUT', '/inventory/' + p.id, { active: next })
                .then(function () {
                    toast(next ? 'Product is active' : 'Product is inactive');
                    loadProducts();
                })
                .catch(function (err) { toast(err.message || 'Could not change status', 'err'); });
        }
    });

    document.addEventListener('click', function (e) {
        if (!menu.contains(e.target) && !e.target.closest('.vd-dots')) { closeMenu(); }
    });
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);

    // ---------- Detail panel ----------
    var side = $('ivSide');
    var overlay = $('ivOverlay');

    function moveHtml(m) {
        var labels = { in: 'Purchase', out: 'Sale', adj: 'Adjustment' };
        var sub = fmtDate(m.date) + (m.party ? ' - ' + m.party : '') + (m.note ? ' - ' + m.note : '');

        return '<div class="vd-item">' +
            '<div><div class="vd-item-main">' + labels[m.type] + ' - ' + esc(m.ref) + '</div>' +
            '<div class="vd-item-sub">' + esc(sub) + '</div></div>' +
            '<div class="vd-item-right"><div class="vd-item-main ' + (m.qty > 0 ? 'vd-green' : 'vd-red') + '">' +
            (m.qty > 0 ? '+' : '') + num(m.qty) + '</div></div>' +
        '</div>';
    }

    function panelHtml(p) {
        var avatar = 'vd-av-' + (((p.id - 1) % 5) + 1);

        return '' +
            '<div class="vd-profile">' +
                '<span class="vd-avatar vd-avatar-lg ' + avatar + '">' + esc(p.name.charAt(0).toUpperCase()) + '</span>' +
                '<div>' +
                    '<div class="vd-profile-name">' + esc(p.name) + '</div>' +
                    '<div class="vd-company">' + (p.sku ? esc(p.sku) + ' - ' : '') + esc(p.category) + '</div>' +
                    '<div class="vd-profile-tags">' + statusBadge(p) + '</div>' +
                '</div>' +
            '</div>' +

            '<div class="iv-stats">' +
                '<div class="iv-stat"><span>In stock</span><b>' + num(p.stock) + ' ' + esc(p.unit) + '</b></div>' +
                '<div class="iv-stat"><span>Stock value</span><b>' + money(stockValue(p)) + '</b></div>' +
                '<div class="iv-stat"><span>Margin</span><b>' + margin(p) + '%</b></div>' +
            '</div>' +

            '<h4 class="vd-sec">Details</h4>' +
            '<div class="vd-info">' +
                '<div class="vd-info-row"><span>Cost price</span><b>' + money(p.cost) + '</b></div>' +
                '<div class="vd-info-row"><span>Sale price</span><b>' + money(p.sale) + '</b></div>' +
                '<div class="vd-info-row"><span>Opening stock</span><b>' + num(p.opening) + '</b></div>' +
                '<div class="vd-info-row"><span>Reorder level</span><b>' + (p.reorder ? num(p.reorder) : 'Not set') + '</b></div>' +
                '<div class="vd-info-row"><span>Total purchased</span><b>' + num(p.purchased) + '</b></div>' +
                '<div class="vd-info-row"><span>Total sold</span><b>' + num(p.sold) + '</b></div>' +
                '<div class="vd-info-row"><span>Adjustments</span><b>' + (p.adjusted > 0 ? '+' : '') + num(p.adjusted) + '</b></div>' +
                '<div class="vd-info-row"><span>Selling per day (30 days)</span><b>' + num(p.avgDaily) + '</b></div>' +
                '<div class="vd-info-row"><span>Stock will last</span><b>' + esc(daysText(p)) + '</b></div>' +
                '<div class="vd-info-row"><span>Last sold</span><b>' + (p.lastSold ? fmtDate(p.lastSold) : 'Never') + '</b></div>' +
                (p.suggest > 0 ? '<div class="vd-info-row"><span>Suggested order</span><b>' + num(p.suggest) + ' ' + esc(p.unit) + '</b></div>' : '') +
            '</div>' +

            (p.notes ? '<h4 class="vd-sec">Notes</h4><div class="vd-info"><div class="vd-info-row"><b>' + esc(p.notes) + '</b></div></div>' : '') +

            '<h4 class="vd-sec">Stock History</h4>' +
            '<div class="vd-list">' + (p.movements.length ? p.movements.map(moveHtml).join('') : '<div class="vd-none">No movement yet</div>') + '</div>';
    }

    function openDetail(p) {
        current = p;
        $('ivSideBody').innerHTML = panelHtml(p);
        $('ivSideBody').scrollTop = 0;

        side.classList.add('open');
        overlay.classList.add('open');
        side.setAttribute('aria-hidden', 'false');
    }

    function closeDetail() {
        side.classList.remove('open');
        overlay.classList.remove('open');
        side.setAttribute('aria-hidden', 'true');
    }

    $('ivClose').addEventListener('click', closeDetail);
    overlay.addEventListener('click', closeDetail);

    $('ivEditBtn').addEventListener('click', function () {
        if (!current) { return; }
        closeDetail();
        openForm(current);
    });

    $('ivAdjBtn').addEventListener('click', function () {
        if (!current) { return; }
        closeDetail();
        openAdjust(current);
    });

    // ---------- Add / Edit product ----------
    var formIds = ['fiName', 'fiSku', 'fiCost', 'fiSale', 'fiOpening', 'fiReorder'];

    function updateMarginHint() {
        var cost = parseFloat($('fiCost').value) || 0;
        var sale = parseFloat($('fiSale').value);
        $('fiMargin').textContent = (!isNaN(sale) && sale > 0)
            ? 'Profit per unit: ' + money(sale - cost) + ' (' + Math.round(((sale - cost) / sale) * 100) + '% margin)'
            : '';
    }

    $('fiCost').addEventListener('input', updateMarginHint);
    $('fiSale').addEventListener('input', updateMarginHint);

    function openForm(p) {
        editingId = p ? p.id : null;
        clearErrs(formIds);

        $('ivFormTitle').textContent = p ? 'Edit Product' : 'Add Product';
        $('ivFormSave').textContent = p ? 'Save Changes' : 'Save Product';

        $('fiName').value = p ? p.name : '';
        $('fiSku').value = p ? p.sku : '';
        $('fiCategory').value = p ? p.category : '';
        $('fiUnit').value = p ? p.unit : 'pcs';
        $('fiCost').value = p ? p.cost : '';
        $('fiSale').value = p ? p.sale : '';
        $('fiOpening').value = p ? p.opening : '';
        $('fiReorder').value = p ? p.reorder : '';
        $('fiStatus').value = p ? (p.active ? 'active' : 'inactive') : 'active';
        $('fiNotes').value = p ? p.notes : '';

        updateMarginHint();
        openModal('ivFormModal');
        setTimeout(function () { $('fiName').focus(); }, 60);
    }

    function readNumber(id, label, required) {
        var raw = $(id).value.trim();
        if (raw === '') {
            if (required) { setErr(id, 'Enter the ' + label); return null; }
            return 0;
        }
        var n = Number(raw);
        if (isNaN(n) || n < 0) { setErr(id, 'Enter a number of 0 or more'); return null; }
        return n;
    }

    function saveForm() {
        clearErrs(formIds);
        var ok = true;

        var name = $('fiName').value.trim();
        if (name.length < 2) {
            setErr('fiName', 'Enter the product name (at least 2 letters)');
            ok = false;
        } else if (products.some(function (p) { return p.id !== editingId && p.name.toLowerCase() === name.toLowerCase(); })) {
            setErr('fiName', 'A product with this name already exists');
            ok = false;
        }

        var cost = readNumber('fiCost', 'cost price', false);
        var sale = readNumber('fiSale', 'sale price', true);
        var opening = readNumber('fiOpening', 'opening stock', false);
        var reorder = readNumber('fiReorder', 'reorder level', false);
        if (cost === null || sale === null || opening === null || reorder === null) { ok = false; }

        if (!ok) { return; }

        var data = {
            name: name,
            sku: $('fiSku').value.trim(),
            category: $('fiCategory').value.trim() || 'General',
            unit: $('fiUnit').value.trim() || 'pcs',
            cost: cost,
            sale: sale,
            opening: opening,
            reorder: reorder,
            active: $('fiStatus').value === 'active',
            notes: $('fiNotes').value.trim()
        };

        var request = editingId
            ? api('PUT', '/inventory/' + editingId, data)
            : api('POST', '/inventory', data);

        request
            .then(function () {
                toast(editingId ? 'Product updated' : 'Product added');
                closeModal('ivFormModal');
                loadProducts();
            })
            .catch(function (err) { toast(err.message || 'Could not save product', 'err'); });
    }

    $('ivNew').addEventListener('click', function () { openForm(null); });
    $('ivFormSave').addEventListener('click', saveForm);

    // ---------- Adjust stock ----------
    var adjIds = ['aiQty', 'aiDate'];

    function openAdjust(p) {
        adjustId = p.id;
        clearErrs(adjIds);

        $('aiSummary').innerHTML = '<div class="vd-pay-name">' + esc(p.name) + '</div>' +
            '<div class="vd-pay-bal">Current stock: <b>' + num(p.stock) + ' ' + esc(p.unit) + '</b></div>';

        $('aiType').value = 'add';
        $('aiQty').value = '';
        $('aiReason').value = 'Count correction';
        $('aiDate').value = todayStr();
        $('aiNote').value = '';

        openModal('ivAdjModal');
        setTimeout(function () { $('aiQty').focus(); }, 60);
    }

    $('aiSave').addEventListener('click', function () {
        var p = find(adjustId);
        if (!p) { return; }

        clearErrs(adjIds);
        var ok = true;
        var qty = parseFloat($('aiQty').value);
        var date = $('aiDate').value;
        var removing = $('aiType').value === 'remove';

        if (isNaN(qty) || qty <= 0) {
            setErr('aiQty', 'Enter a quantity greater than 0');
            ok = false;
        } else if (removing && qty > p.stock) {
            setErr('aiQty', 'You cannot remove more than the current stock (' + num(p.stock) + ')');
            ok = false;
        }

        if (!date) {
            setErr('aiDate', 'Choose the date');
            ok = false;
        } else if (date > todayStr()) {
            setErr('aiDate', 'Date cannot be in the future');
            ok = false;
        }

        if (!ok) { return; }

        api('POST', '/inventory/' + p.id + '/adjust', {
            qty: removing ? -qty : qty,
            reason: $('aiReason').value,
            date: date,
            note: $('aiNote').value.trim()
        })
            .then(function () {
                toast('Stock adjusted');
                closeModal('ivAdjModal');
                loadProducts();
            })
            .catch(function (err) { toast(err.message || 'Could not adjust stock', 'err'); });
    });

    // ---------- Delete ----------
    function askDelete(p) {
        deleteId = p.id;
        $('icText').textContent = p.name + ' will be removed. This cannot be undone.';
        openModal('ivConfirmModal');
    }

    $('icOk').addEventListener('click', function () {
        var p = find(deleteId);
        if (!p) { return; }

        api('DELETE', '/inventory/' + p.id)
            .then(function () {
                closeModal('ivConfirmModal');
                toast('Product deleted');
                loadProducts();
            })
            .catch(function (err) {
                closeModal('ivConfirmModal');
                toast(err.message || 'Could not delete product', 'err');
            });
    });

    // ---------- Closing popups ----------
    document.addEventListener('click', function (e) {
        var closer = e.target.closest('[data-close]');
        if (closer) { closeModal(closer.getAttribute('data-close')); return; }

        if (e.target.classList.contains('vd-modal-overlay')) {
            e.target.classList.remove('open');
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') { return; }
        closeMenu();
        document.querySelectorAll('.vd-modal-overlay.open').forEach(function (m) { m.classList.remove('open'); });
        closeDetail();
    });

    // ---------- Search, filters, sort ----------
    $('ivSearch').addEventListener('input', function () {
        state.search = this.value;
        render();
    });

    $('ivChips').addEventListener('click', function (e) {
        var chip = e.target.closest('.vd-chip');
        if (!chip) { return; }

        document.querySelectorAll('#ivChips .vd-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        state.filter = chip.getAttribute('data-filter');
        render();
    });

    $('ivCat').addEventListener('change', function () {
        state.category = this.value;
        render();
    });

    $('ivSort').addEventListener('change', function () {
        state.sort = this.value;
        render();
    });
    // Open with a filter when coming from the sidebar links
    var urlFilter = new URLSearchParams(window.location.search).get('filter');
    var allowedFilters = ['in', 'low', 'out', 'slow', 'inactive', 'attention'];

    if (urlFilter && allowedFilters.indexOf(urlFilter) !== -1) {
        state.filter = urlFilter;
        document.querySelectorAll('#ivChips .vd-chip').forEach(function (c) {
            c.classList.toggle('active', c.getAttribute('data-filter') === urlFilter);
        });
    }
    // ---------- Load data ----------
    loadProducts();
})();