(function () {
    // ---------- Helpers ----------
    function $(id) { return document.getElementById(id); }
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function toStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function todayStr() { return toStr(new Date()); }
    function parse(s) { var p = s.split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
    function fmtDate(s) { return parse(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
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
                if (!res.ok) {
                    var keys = Object.keys(data.errors || {});
                    throw new Error(keys.length ? data.errors[keys[0]][0] : (data.message || 'request failed'));
                }
                return data;
            });
        });
    }

    // ---------- Which page are we on? ----------
    var params = new URLSearchParams(window.location.search);
    var urlFilter = params.get('filter');
    var view = urlFilter === 'attention' ? 'low' : (urlFilter === 'slow' ? 'slow' : 'all');

    var titles = {
        all: ['Inventory', 'Know what you have, what is selling, and what to order next.'],
        low: ['Low Stock', 'Pick what to buy, set the quantity, and send the list to your supplier in one click.'],
        slow: ['Slow Moving', 'Money sitting on the shelf. Clear it before it costs you more.']
    };

    function setupView() {
        $('ivPage').className = 'iv-view-' + view;
        $('ivTitle').textContent = titles[view][0];
        $('ivSub').textContent = titles[view][1];
        $('viewAll').style.display = view === 'all' ? '' : 'none';
        $('viewLow').style.display = view === 'low' ? '' : 'none';
        $('viewSlow').style.display = view === 'slow' ? '' : 'none';
        document.title = titles[view][0] + ' - AccountPro';
    }

    // ---------- State ----------
    var products = [];
    var state = { filter: 'all', search: '', category: 'all', sort: 'name', layout: localStorage.getItem('ivLayout') || 'grid' };
    var openId = null;
    var current = null;
    var editingId = null;
    var adjustId = null;
    var deleteId = null;
    var plan = {};
    var disc = 20;

    // Picture chosen in the form
    var formImage = null;      // new picture (data url), if one was chosen
    var removeImage = false;   // true if the old picture must be removed

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
    function avatarOf(p) { return 'vd-av-' + (((p.id - 1) % 5) + 1); }

    // Picture if there is one, otherwise the first letter
    function avatarHtml(p, big) {
        var cls = 'vd-avatar' + (big ? ' vd-avatar-lg' : '') + (p.image ? ' has-img' : ' ' + avatarOf(p));
        return '<span class="' + cls + '">' +
            (p.image ? '<img src="' + esc(p.image) + '" alt="">' : esc(p.name.charAt(0).toUpperCase())) +
            '</span>';
    }

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

    function gaugeWidth(p) {
        if (p.reorder > 0) { return Math.max(0, Math.min(100, Math.round((p.stock / (p.reorder * 3)) * 100))); }
        return p.stock > 0 ? 100 : 0;
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

    function active() { return products.filter(function (p) { return p.active; }); }

    // =====================================================
    //  VIEW 1: ALL PRODUCTS (Catalog)
    // =====================================================
    function renderCards() {
        var act = active();
        var stocked = act.filter(function (p) { return p.stock > 0; });
        var costValue = sum(stocked, function (p) { return p.stock * p.cost; });
        var saleValue = sum(stocked, function (p) { return p.stock * p.sale; });
        var lowList = act.filter(function (p) { return p.status === 'low' || p.status === 'out'; });
        var outList = act.filter(function (p) { return p.status === 'out'; });
        var slow = act.filter(function (p) { return p.dead; });
        var slowValue = sum(slow, function (p) { return p.stock * p.cost; });

        $('ivCardCount').textContent = products.length;
        $('ivCardCountNote').textContent = act.length + ' active';
        $('ivCardValue').textContent = money(costValue);
        $('ivCardValueNote').textContent = 'Worth ' + money(saleValue) + ' when sold';
        $('ivCardLow').textContent = lowList.length;
        $('ivCardLowNote').textContent = outList.length + ' out of stock';
        $('ivCardSlow').textContent = money(slowValue);
        $('ivCardSlowNote').textContent = slow.length + ' product(s) not sold in 60 days';
    }

    function renderHealth() {
        var act = active();
        var total = act.length;

        if (!total) {
            $('ivHealthBar').innerHTML = '';
            $('ivHealthLegend').innerHTML = 'Add products to see how healthy your stock is.';
            return;
        }

        var parts = [
            { cls: 'iv-h-in', label: 'In stock', n: act.filter(function (p) { return p.status === 'in'; }).length },
            { cls: 'iv-h-low', label: 'Low', n: act.filter(function (p) { return p.status === 'low'; }).length },
            { cls: 'iv-h-out', label: 'Out', n: act.filter(function (p) { return p.status === 'out'; }).length }
        ];

        $('ivHealthBar').innerHTML = parts.map(function (x) {
            return '<span class="' + x.cls + '" style="width:' + (x.n / total * 100) + '%"></span>';
        }).join('');

        $('ivHealthLegend').innerHTML = parts.map(function (x) {
            return '<span><i class="' + x.cls + '"></i>' + x.label + ': ' + x.n + ' (' + Math.round(x.n / total * 100) + '%)</span>';
        }).join('');
    }

    function insightRows(list, rowFn, emptyText) {
        return list.length ? list.map(rowFn).join('') : '<div class="iv-empty">' + esc(emptyText) + '</div>';
    }

    function renderInsights() {
        var act = active();

        var best = act.filter(function (p) { return p.revenue > 0; })
            .sort(function (a, b) { return b.revenue - a.revenue; }).slice(0, 5);

        $('ivBest').innerHTML = insightRows(best, function (p) {
            return '<div class="iv-row"><div>' + esc(p.name) + '<small>' + num(p.sold) + ' ' + esc(p.unit) + ' sold</small></div>' +
                '<b>' + money(p.revenue) + '</b></div>';
        }, 'No sales yet. Pick products when you make invoices.');

        var profitable = act.map(function (p) { return { p: p, profit: p.revenue - p.sold * p.cost }; })
            .filter(function (x) { return x.profit > 0; })
            .sort(function (a, b) { return b.profit - a.profit; }).slice(0, 5);

        $('ivProfit').innerHTML = insightRows(profitable, function (x) {
            return '<div class="iv-row"><div>' + esc(x.p.name) + '<small>' + margin(x.p) + '% margin</small></div>' +
                '<b>' + money(x.profit) + '</b></div>';
        }, 'Profit shows up after your first sale.');

        var cats = {};
        act.forEach(function (p) { cats[p.category] = (cats[p.category] || 0) + stockValue(p); });
        var catList = Object.keys(cats).map(function (k) { return { name: k, value: cats[k] }; })
            .filter(function (c) { return c.value > 0; })
            .sort(function (a, b) { return b.value - a.value; }).slice(0, 5);
        var maxCat = catList.length ? catList[0].value : 1;

        $('ivCats').innerHTML = insightRows(catList, function (c) {
            return '<div class="iv-row" style="display:block"><div style="display:flex;justify-content:space-between"><span>' +
                esc(c.name) + '</span><b>' + money(c.value) + '</b></div>' +
                '<div class="iv-mini-track"><span style="width:' + Math.round((c.value / maxCat) * 100) + '%"></span></div></div>';
        }, 'Add products with stock to see this.');
    }

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

    function dotsButton(p) {
        return '<button type="button" class="vd-dots" data-id="' + p.id + '"><i class="fa-solid fa-ellipsis-vertical"></i></button>';
    }

    function rowHtml(p) {
        var risky = p.status !== 'in';

        return '<tr data-id="' + p.id + '">' +
            '<td><div class="vd-vendor">' +
                avatarHtml(p) +
                '<div><div class="vd-name">' + esc(p.name) + (p.dead && p.active ? '<span class="iv-slow-tag">Slow</span>' : '') + '</div>' +
                '<div class="vd-company">' + (p.sku ? esc(p.sku) + ' - ' : '') + esc(p.category) + '</div></div>' +
            '</div></td>' +
            '<td><div class="vd-amount' + (p.stock <= 0 ? ' vd-red' : '') + '">' + num(p.stock) + ' ' + esc(p.unit) + '</div>' +
                '<div class="vd-bar' + (risky ? ' vd-bar-red' : '') + '"><span style="width:' + gaugeWidth(p) + '%"></span></div>' +
                '<div class="vd-bar-note">' + esc(daysText(p)) + '</div></td>' +
            '<td><div class="vd-amount">' + money(p.sale) + '</div>' +
                '<div class="vd-bar-note">Cost ' + money(p.cost) + ' - ' + margin(p) + '% margin</div></td>' +
            '<td>' + money(stockValue(p)) + '</td>' +
            '<td>' + statusBadge(p) + '</td>' +
            '<td class="vd-actions">' + dotsButton(p) + '</td>' +
        '</tr>';
    }

    function cardHtml(p) {
        var risky = p.status !== 'in';

        return '<div class="iv-card" data-id="' + p.id + '">' +
            '<div class="iv-card-top">' +
                avatarHtml(p) +
                '<div class="iv-card-name"><b>' + esc(p.name) + '</b><small>' + (p.sku ? esc(p.sku) + ' - ' : '') + esc(p.category) + '</small></div>' +
                dotsButton(p) +
            '</div>' +
            '<div class="iv-card-stock"><strong' + (p.stock <= 0 ? ' class="vd-red"' : '') + '>' + num(p.stock) + '<small>' + esc(p.unit) + '</small></strong>' + statusBadge(p) + '</div>' +
            '<div class="vd-bar' + (risky ? ' vd-bar-red' : '') + '"><span style="width:' + gaugeWidth(p) + '%"></span></div>' +
            '<div class="iv-card-meta">' +
                '<div>Sale price<b class="t">' + money(p.sale) + '</b></div>' +
                '<div>Margin<b class="t">' + margin(p) + '%</b></div>' +
                '<div>Cost<b class="t">' + money(p.cost) + '</b></div>' +
                '<div>Stock value<b class="t">' + money(stockValue(p)) + '</b></div>' +
            '</div>' +
            '<div class="iv-card-foot">' + esc(daysText(p)) + (p.dead && p.active ? ' - slow moving' : '') + '</div>' +
        '</div>';
    }

    function renderChips() {
        var act = active();
        $('ivcAll').textContent = products.length;
        $('ivcIn').textContent = act.filter(function (p) { return p.status === 'in'; }).length;
        $('ivcLow').textContent = act.filter(function (p) { return p.status === 'low'; }).length;
        $('ivcOut').textContent = act.filter(function (p) { return p.status === 'out'; }).length;
        $('ivcSlow').textContent = act.filter(function (p) { return p.dead; }).length;
        $('ivcInactive').textContent = products.filter(function (p) { return !p.active; }).length;
    }

    function renderList() {
        var list = getVisible();
        var grid = state.layout === 'grid';

        $('ivGrid').style.display = grid ? '' : 'none';
        $('ivTableWrap').style.display = grid ? 'none' : '';
        document.querySelectorAll('#ivLayout button').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-layout') === state.layout);
        });

        if (grid) {
            $('ivGrid').innerHTML = list.length
                ? list.map(cardHtml).join('')
                : '<div class="iv-empty-big"><i class="fa-regular fa-folder-open"></i>No products found</div>';
        } else {
            $('ivRows').innerHTML = list.length
                ? list.map(rowHtml).join('')
                : '<tr class="vd-empty"><td colspan="6"><i class="fa-regular fa-folder-open"></i>No products found</td></tr>';
        }
    }

    function renderAll() {
        renderCards();
        renderHealth();
        renderInsights();
        renderChips();
        renderList();
    }

    // =====================================================
    //  VIEW 2: LOW STOCK (Reorder Planner)
    // =====================================================
    function plannerItems() {
        return active().filter(function (p) { return p.status !== 'in' || p.suggest > 0; });
    }

    function defaultQty(p) {
        return p.suggest > 0 ? p.suggest : Math.max(Math.ceil(p.reorder * 2 - p.stock), 1);
    }

    function planRowHtml(p) {
        var e = plan[p.id];

        return '<div class="iv-plan-row' + (e.on ? '' : ' off') + '" data-id="' + p.id + '">' +
            '<label class="iv-check"><input type="checkbox" class="pl-on"' + (e.on ? ' checked' : '') + '></label>' +
            '<div class="iv-plan-main"><b>' + esc(p.name) + '</b><small>' + esc(p.category) + ' - ' + esc(daysText(p)) + '</small></div>' +
            '<div class="iv-plan-gauge"><div class="vd-bar vd-bar-red"><span style="width:' + gaugeWidth(p) + '%"></span></div>' +
                '<small>' + num(p.stock) + ' ' + esc(p.unit) + ' left' + (p.reorder ? ' (reorder at ' + num(p.reorder) + ')' : '') + '</small></div>' +
            '<div class="iv-plan-qty"><input type="number" class="pl-qty" min="0" step="any" value="' + e.qty + '"><span>' + esc(p.unit) + '</span></div>' +
            '<div class="iv-plan-cost">' + num(e.qty) + ' x ' + money(p.cost) + '<b class="pl-line">' + money(e.qty * p.cost) + '</b></div>' +
        '</div>';
    }

    function renderLow() {
        var items = plannerItems();

        items.forEach(function (p) {
            if (!plan[p.id]) { plan[p.id] = { on: true, qty: defaultQty(p) }; }
        });

        function byUrgency(a, b) {
            var da = a.daysLeft === null ? 9999 : a.daysLeft;
            var db = b.daysLeft === null ? 9999 : b.daysLeft;
            return da - db || a.name.localeCompare(b.name);
        }

        var groups = [
            { key: 'out', title: 'Out of stock', icon: 'fa-circle-xmark',
              list: items.filter(function (p) { return p.status === 'out'; }) },
            { key: 'urgent', title: 'Running out within 7 days', icon: 'fa-bolt',
              list: items.filter(function (p) { return p.status !== 'out' && p.daysLeft !== null && p.daysLeft <= 7; }) },
            { key: 'low', title: 'Low stock', icon: 'fa-triangle-exclamation',
              list: items.filter(function (p) { return p.status !== 'out' && !(p.daysLeft !== null && p.daysLeft <= 7); }) }
        ];

        if (!items.length) {
            $('ivPlanner').innerHTML = '<div class="iv-empty-big"><i class="fa-regular fa-circle-check"></i>All stocked up! Nothing needs reordering right now.</div>';
            $('ivPlanBar').style.display = 'none';
        } else {
            $('ivPlanBar').style.display = '';
            $('ivPlanner').innerHTML = groups.filter(function (g) { return g.list.length; }).map(function (g) {
                return '<div class="iv-group iv-group-' + g.key + '">' +
                    '<h3 class="iv-group-title"><i class="fa-solid ' + g.icon + '"></i>' + g.title + '<span>' + g.list.length + '</span></h3>' +
                    g.list.sort(byUrgency).map(planRowHtml).join('') +
                '</div>';
            }).join('');
        }

        $('lowCount').textContent = items.length;
        $('lowOut').textContent = items.filter(function (p) { return p.status === 'out'; }).length;
        updatePlanTotals();
    }

    function selectedPlan() {
        return plannerItems().filter(function (p) { return plan[p.id] && plan[p.id].on && plan[p.id].qty > 0; });
    }

    function updatePlanTotals() {
        var chosen = selectedPlan();
        var total = sum(chosen, function (p) { return plan[p.id].qty * p.cost; });

        $('planSel').textContent = chosen.length;
        $('planTotal').textContent = money(total);
        $('lowBudget').textContent = money(total);
        $('ivLowSummary').textContent = plannerItems().length
            ? plannerItems().length + ' product(s) need attention. Ordering your selection costs about ' + money(total) + '.'
            : 'Everything is well stocked. Check back after your next sales.';
    }

    $('ivPlanner').addEventListener('input', function (e) {
        var row = e.target.closest('.iv-plan-row');
        if (!row || !e.target.classList.contains('pl-qty')) { return; }

        var p = find(Number(row.getAttribute('data-id')));
        var qty = Math.max(0, parseFloat(e.target.value) || 0);
        plan[p.id].qty = qty;

        row.querySelector('.iv-plan-cost').innerHTML = num(qty) + ' x ' + money(p.cost) + '<b class="pl-line">' + money(qty * p.cost) + '</b>';
        updatePlanTotals();
    });

    $('ivPlanner').addEventListener('change', function (e) {
        var row = e.target.closest('.iv-plan-row');
        if (!row || !e.target.classList.contains('pl-on')) { return; }

        var id = Number(row.getAttribute('data-id'));
        plan[id].on = e.target.checked;
        row.classList.toggle('off', !e.target.checked);
        updatePlanTotals();
    });

    function planText() {
        var lines = selectedPlan().map(function (p, i) {
            return (i + 1) + '. ' + p.name + ' - ' + num(plan[p.id].qty) + ' ' + p.unit;
        });
        return 'Order request (' + fmtDate(todayStr()) + ')\n\n' + lines.join('\n') + '\n\nPlease confirm price and delivery time. Thank you.';
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }

        return new Promise(function (resolve) {
            var area = document.createElement('textarea');
            area.value = text;
            document.body.appendChild(area);
            area.select();
            document.execCommand('copy');
            document.body.removeChild(area);
            resolve();
        });
    }

    $('planCopy').addEventListener('click', function () {
        if (!selectedPlan().length) { toast('Select at least one product', 'err'); return; }
        copyText(planText()).then(function () { toast('Order list copied. Paste it in WhatsApp.'); });
    });

    $('planCsv').addEventListener('click', function () {
        var chosen = selectedPlan();
        if (!chosen.length) { toast('Select at least one product', 'err'); return; }

        var rows = [['Product', 'Unit', 'Current stock', 'Order quantity', 'Cost price', 'Line total']];
        chosen.forEach(function (p) {
            rows.push([p.name, p.unit, p.stock, plan[p.id].qty, p.cost, plan[p.id].qty * p.cost]);
        });

        var text = rows.map(function (r) {
            return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
        }).join('\n');

        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' }));
        a.download = 'reorder-list-' + todayStr() + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    $('planDraft').addEventListener('click', function () {
        var chosen = selectedPlan();
        if (!chosen.length) { toast('Select at least one product', 'err'); return; }

        sessionStorage.setItem('purchaseDraft', JSON.stringify(chosen.map(function (p) {
            return { product_id: p.id, desc: p.name, qty: plan[p.id].qty, price: p.cost };
        })));

        window.location.href = '/purchases?draft=1';
    });

    // =====================================================
    //  VIEW 3: SLOW MOVING (Dead stock)
    // =====================================================
    function clearPrice(p) { return Math.round(p.sale * (1 - disc / 100)); }
    function idleDays(p) { return Math.max(daysBetween(p.idleSince, todayStr()), 0); }

    function renderSlow() {
        var items = active().filter(function (p) { return p.dead; })
            .sort(function (a, b) { return stockValue(b) - stockValue(a); });

        var stuck = sum(items, function (p) { return p.stock * p.cost; });
        var recover = sum(items, function (p) { return p.stock * clearPrice(p); });

        $('slowCount').textContent = items.length;
        $('slowStuck').textContent = money(stuck);
        $('slowRecover').textContent = money(recover);
        $('ivSlowSummary').textContent = items.length
            ? money(stuck) + ' is tied up in ' + items.length + ' product(s) that have not sold for 60+ days. At ' + disc + '% off you would get back ' + money(recover) + '.'
            : 'Nothing is stuck. Every product is moving.';

        document.querySelectorAll('#ivDisc button').forEach(function (b) {
            b.classList.toggle('active', Number(b.getAttribute('data-disc')) === disc);
        });

        // Age buckets
        var buckets = [
            { label: '60 - 90 days', min: 60, max: 90 },
            { label: '91 - 180 days', min: 91, max: 180 },
            { label: '181+ days', min: 181, max: 99999 }
        ].map(function (b) {
            var list = items.filter(function (p) { var d = idleDays(p); return d >= b.min && d <= b.max; });
            return { label: b.label, count: list.length, value: sum(list, function (p) { return p.stock * p.cost; }) };
        });
        var maxBucket = Math.max.apply(null, buckets.map(function (b) { return b.value; })) || 1;

        $('ivAging').innerHTML = items.length ? buckets.map(function (b) {
            return '<div class="iv-bucket"><span>' + b.label + '</span>' +
                '<div class="iv-mini-track"><span style="width:' + Math.round((b.value / maxBucket) * 100) + '%"></span></div>' +
                '<b>' + money(b.value) + ' <small>(' + b.count + ')</small></b></div>';
        }).join('') : '';

        // Cards
        if (!items.length) {
            $('ivSlowList').innerHTML = '<div class="iv-empty-big"><i class="fa-regular fa-face-smile"></i>Great news! No slow moving stock.</div>';
            return;
        }

        $('ivSlowList').innerHTML = items.map(function (p) {
            var days = idleDays(p);
            var price = clearPrice(p);
            var below = price < p.cost;

            return '<div class="iv-slow-card" data-id="' + p.id + '">' +
                '<div class="iv-slow-main"><b>' + esc(p.name) + '</b>' +
                    '<small>' + esc(p.category) + ' - ' + (p.lastSold ? 'Last sold ' + fmtDate(p.lastSold) : 'Never sold') + '</small>' +
                    '<span class="iv-idle' + (days > 120 ? ' hot' : '') + '">' + days + ' days idle</span></div>' +
                '<div class="iv-slow-nums">' +
                    '<div>In stock<b>' + num(p.stock) + ' ' + esc(p.unit) + '</b></div>' +
                    '<div>Money stuck<b>' + money(p.stock * p.cost) + '</b></div>' +
                    '<div>Sell at (-' + disc + '%)<b>' + money(price) + '</b>' + (below ? '<span class="warn">below cost</span>' : '') + '</div>' +
                    '<div>You get back<b>' + money(p.stock * price) + '</b></div>' +
                '</div>' +
                '<div class="iv-slow-actions">' +
                    '<button type="button" data-act="edit"><i class="fa-regular fa-pen-to-square"></i> Edit price</button>' +
                    '<button type="button" data-act="adjust"><i class="fa-solid fa-sliders"></i> Write off</button>' +
                    '<button type="button" data-act="toggle"><i class="fa-solid fa-eye-slash"></i> Make inactive</button>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    $('ivDisc').addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) { return; }
        disc = Number(b.getAttribute('data-disc'));
        renderSlow();
    });

    $('ivSlowList').addEventListener('click', function (e) {
        var card = e.target.closest('.iv-slow-card');
        if (!card) { return; }

        var p = find(Number(card.getAttribute('data-id')));
        if (!p) { return; }

        var btn = e.target.closest('[data-act]');
        if (!btn) { openDetail(p); return; }

        var act = btn.getAttribute('data-act');
        if (act === 'edit') { openForm(p); }
        else if (act === 'adjust') { openAdjust(p); }
        else if (act === 'toggle') { toggleActive(p); }
    });

    // =====================================================
    //  Render dispatcher
    // =====================================================
    function render() {
        if (view === 'low') { renderLow(); }
        else if (view === 'slow') { renderSlow(); }
        else { renderAll(); }
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

    function toggleActive(p) {
        var next = !p.active;
        api('PUT', '/inventory/' + p.id, { active: next })
            .then(function () {
                toast(next ? 'Product is active' : 'Product is inactive');
                loadProducts();
            })
            .catch(function (err) { toast(err.message || 'Could not change status', 'err'); });
    }

    function handleListClick(e) {
        var btn = e.target.closest('.vd-dots');

        if (btn) {
            var id = Number(btn.getAttribute('data-id'));
            if (openId === id && menu.style.display === 'block') { closeMenu(); }
            else { openMenu(btn, find(id)); }
            return;
        }

        var holder = e.target.closest('[data-id]');
        if (!holder) { return; }
        var p = find(Number(holder.getAttribute('data-id')));
        if (p) { openDetail(p); }
    }

    $('ivRows').addEventListener('click', handleListClick);
    $('ivGrid').addEventListener('click', handleListClick);

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
        else if (action === 'toggle') { toggleActive(p); }
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
        return '' +
            '<div class="vd-profile">' +
                avatarHtml(p, true) +
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
                (p.opening > 0 ? '<div class="vd-info-row"><span>Opening stock</span><b>' + num(p.opening) + '</b></div>' : '') +
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
    var formIds = ['fiName', 'fiSku', 'fiCost', 'fiSale', 'fiReorder'];

    function updateMarginHint() {
        var cost = parseFloat($('fiCost').value) || 0;
        var sale = parseFloat($('fiSale').value);
        $('fiMargin').textContent = (!isNaN(sale) && sale > 0)
            ? 'Profit per unit: ' + money(sale - cost) + ' (' + Math.round(((sale - cost) / sale) * 100) + '% margin)'
            : '';
    }

    $('fiCost').addEventListener('input', updateMarginHint);
    $('fiSale').addEventListener('input', updateMarginHint);

    // Picture preview in the form
    function showPicture(src) {
        var img = $('fiPreview');

        if (src) {
            img.src = src;
            $('fiPicBox').classList.add('has');
        } else {
            img.removeAttribute('src');
            $('fiPicBox').classList.remove('has');
        }
    }

    $('fiPicBox').addEventListener('click', function () { $('fiFile').click(); });
    $('fiPicChoose').addEventListener('click', function () { $('fiFile').click(); });

    $('fiPicRemove').addEventListener('click', function () {
        formImage = null;
        removeImage = true;
        setErr('fiFile', '');
        showPicture('');
    });

    // The picture is made smaller (320px) before it is sent, so it saves quickly
    $('fiFile').addEventListener('change', function () {
        var input = this;
        var f = input.files[0];
        setErr('fiFile', '');
        if (!f) { return; }

        if (!/^image\/(png|jpeg|webp)$/.test(f.type)) {
            setErr('fiFile', 'Use a PNG, JPG or WebP image');
            input.value = '';
            return;
        }
        if (f.size > 10 * 1024 * 1024) {
            setErr('fiFile', 'Image is too big (maximum 10 MB)');
            input.value = '';
            return;
        }

        var reader = new FileReader();
        reader.onload = function () {
            var img = new Image();
            img.onload = function () {
                var scale = Math.min(1, 320 / Math.max(img.width, img.height));
                var canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

                formImage = canvas.toDataURL('image/png');
                removeImage = false;
                showPicture(formImage);
            };
            img.onerror = function () { setErr('fiFile', 'This image could not be read'); };
            img.src = reader.result;
        };
        reader.readAsDataURL(f);
        input.value = '';
    });

    // More details (opens and closes)
    $('ivMoreToggle').addEventListener('click', function () {
        var box = $('ivMore');
        var open = box.style.display === 'none';
        box.style.display = open ? '' : 'none';
        this.classList.toggle('open', open);
    });

    function openForm(p) {
        editingId = p ? p.id : null;
        clearErrs(formIds);
        setErr('fiFile', '');

        $('ivFormTitle').textContent = p ? 'Edit Product' : 'Add Product';
        $('ivFormSave').textContent = p ? 'Save Changes' : 'Save Product';

        $('fiName').value = p ? p.name : '';
        $('fiSku').value = p ? p.sku : '';
        $('fiCategory').value = p ? p.category : '';
        $('fiUnit').value = p ? p.unit : 'pcs';
        $('fiCost').value = p ? p.cost : '';
        $('fiSale').value = p ? p.sale : '';
        $('fiReorder').value = p ? p.reorder : '';
        $('fiStatus').value = p ? (p.active ? 'active' : 'inactive') : 'active';
        $('fiNotes').value = p ? p.notes : '';

        formImage = null;
        removeImage = false;
        showPicture(p && p.image ? p.image : '');

        $('ivMore').style.display = 'none';
        $('ivMoreToggle').classList.remove('open');

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
        var reorder = readNumber('fiReorder', 'reorder level', false);
        if (cost === null || sale === null || reorder === null) {
            ok = false;
            // The error may be inside the hidden "More details" part, so open it
            if (cost === null || reorder === null) {
                $('ivMore').style.display = '';
                $('ivMoreToggle').classList.add('open');
            }
        }

        if (!ok) { return; }

        var data = {
            name: name,
            sku: $('fiSku').value.trim(),
            category: $('fiCategory').value.trim() || 'General',
            unit: $('fiUnit').value.trim() || 'pcs',
            cost: cost,
            sale: sale,
            reorder: reorder,
            active: $('fiStatus').value === 'active',
            notes: $('fiNotes').value.trim()
        };

        if (formImage) { data.image = formImage; }
        else if (removeImage) { data.remove_image = true; }

        var request = editingId
            ? api('PUT', '/inventory/' + editingId, data)
            : api('POST', '/inventory', data);

        $('ivFormSave').disabled = true;

        request
            .then(function () {
                toast(editingId ? 'Product updated' : 'Product added');
                closeModal('ivFormModal');
                loadProducts();
            })
            .catch(function (err) { toast(err.message || 'Could not save product', 'err'); })
            .then(function () { $('ivFormSave').disabled = false; });
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

    // ---------- Search, filters, sort, layout ----------
    $('ivSearch').addEventListener('input', function () {
        state.search = this.value;
        renderList();
    });

    $('ivChips').addEventListener('click', function (e) {
        var chip = e.target.closest('.vd-chip');
        if (!chip) { return; }

        document.querySelectorAll('#ivChips .vd-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        state.filter = chip.getAttribute('data-filter');
        renderList();
    });

    $('ivCat').addEventListener('change', function () {
        state.category = this.value;
        renderList();
    });

    $('ivSort').addEventListener('change', function () {
        state.sort = this.value;
        renderList();
    });

    $('ivLayout').addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) { return; }
        state.layout = b.getAttribute('data-layout');
        localStorage.setItem('ivLayout', state.layout);
        renderList();
    });

    // ---------- Start ----------
    var chipFilters = ['in', 'low', 'out', 'inactive'];
    if (view === 'all' && urlFilter && chipFilters.indexOf(urlFilter) !== -1) {
        state.filter = urlFilter;
        document.querySelectorAll('#ivChips .vd-chip').forEach(function (c) {
            c.classList.toggle('active', c.getAttribute('data-filter') === urlFilter);
        });
    }

    setupView();
    loadProducts();
})();