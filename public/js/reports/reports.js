(function () {
    // ---------- Chhote helpers ----------
    function $(id) { return document.getElementById(id); }
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function toStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

    function money(n) {
        return (n < 0 ? '- ' : '') + formatMoney(Math.round(Math.abs(n)));
    }

    function esc(t) {
        return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function fmtD(s) {
        var p = s.split('-');
        return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    var now = new Date();
    var sales = [], items = [], purchases = [], expenses = [], receivables = [], payables = [];

    var buckets = [
        { label: 'Not due', color: '#22c55e', test: function (x) { return x.late <= 0; } },
        { label: '1-30', color: '#eab308', test: function (x) { return x.late >= 1 && x.late <= 30; } },
        { label: '31-60', color: '#f97316', test: function (x) { return x.late >= 31 && x.late <= 60; } },
        { label: '61-90', color: '#ef4444', test: function (x) { return x.late >= 61 && x.late <= 90; } },
        { label: '90+', color: '#b91c1c', test: function (x) { return x.late > 90; } }
    ];

    var palette = ['#0ea5e9', '#8b5cf6', '#f97316', '#ec4899', '#10b981', '#f59e0b'];

    // ---------- Muddat aur hisaab ----------
    function back(d, k) {
        var lastDay = new Date(d.getFullYear(), d.getMonth() - k + 1, 0).getDate();
        return new Date(d.getFullYear(), d.getMonth() - k, Math.min(d.getDate(), lastDay));
    }

    function periodRange(key) {
        var y = now.getFullYear();
        var mo = now.getMonth();
        var r;

        if (key === 'month') { r = [new Date(y, mo, 1), now, new Date(y, mo - 1, 1), back(now, 1)]; }
        else if (key === 'last') { r = [new Date(y, mo - 1, 1), new Date(y, mo, 0), new Date(y, mo - 2, 1), new Date(y, mo - 1, 0)]; }
        else if (key === 'q') { r = [new Date(y, mo - 2, 1), now, new Date(y, mo - 5, 1), back(now, 3)]; }
        else { r = [new Date(y, mo - 5, 1), now, new Date(y, mo - 11, 1), back(now, 6)]; }

        return { s: toStr(r[0]), e: toStr(r[1]), ps: toStr(r[2]), pe: toStr(r[3]) };
    }

    function inRange(list, a, b) { return list.filter(function (x) { return x.date >= a && x.date <= b; }); }
    function sum(list) { return list.reduce(function (s, x) { return s + x.amount; }, 0); }

    function sumKey(list, key) { return list.reduce(function (s, x) { return s + x[key]; }, 0); }

    // Asli profit: Sales (tax ke baghair) - bike hue maal ki cost - Expenses.
    // Purchases profit se minus nahi hoti, wo sirf maloomat hai.
    function calc(a, b) {
        var s = inRange(sales, a, b);
        var p = inRange(purchases, a, b);
        var e = inRange(expenses, a, b);
        var it = inRange(items, a, b);
        var S = sum(s), C = sumKey(s, 'cost'), P = sum(p), E = sum(e);
        var gross = S - C;
        var profit = gross - E;
        return { s: s, p: p, e: e, it: it, S: S, C: C, P: P, E: E, gross: gross, profit: profit, margin: S ? (profit / S) * 100 : 0 };
    }

    function group(list, key) {
        var map = {};
        list.forEach(function (x) {
            var k = x[key];
            if (!map[k]) { map[k] = { name: k, value: 0, count: 0 }; }
            map[k].value += x.amount;
            map[k].count += 1;
        });
        return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.value - a.value; });
    }

    function groupSales(list) {
        var map = {};
        list.forEach(function (x) {
            if (!map[x.name]) { map[x.name] = { name: x.name, value: 0, profit: 0, count: 0 }; }
            map[x.name].value += x.amount;
            map[x.name].profit += x.amount - x.cost;
            map[x.name].count += 1;
        });
        return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.profit - a.profit; });
    }

    function groupProducts(list) {
        var map = {};
        list.forEach(function (x) {
            var k = x.product || 'Unknown product';
            if (!map[k]) { map[k] = { name: k, qty: 0, revenue: 0, cost: 0, unknown: false }; }
            map[k].qty += x.qty;
            map[k].revenue += x.revenue;
            map[k].cost += x.cost;
            if (x.unknown) { map[k].unknown = true; }
        });
        return Object.keys(map).map(function (k) {
            var m = map[k];
            m.profit = m.revenue - m.cost;
            m.margin = m.revenue ? (m.profit / m.revenue) * 100 : 0;
            return m;
        }).sort(function (a, b) { return b.profit - a.profit; });
    }

    var LOW_MARGIN = 10;
    var GREEN = '#22c55e', AMBER = '#f59e0b', RED = '#ef4444';

    // Bar ka rang: hara = achha munafa, peela = kam margin, laal = nuksaan
    function toneOf(p) { return p.profit < 0 ? RED : (p.margin < LOW_MARGIN ? AMBER : GREEN); }

    function profitRow(label, profit, base, color, extra) {
        var pct = profit !== 0 ? Math.max(2, Math.min(100, Math.round((Math.abs(profit) / base) * 100))) : 0;
        return '<div class="rp-row"><span class="rp-row-label" title="' + esc(label + (extra || '')) + '">' + esc(label) + '</span>' +
            '<div class="rp-track"><div class="rp-fill" style="background:' + color + '" data-w="' + pct + '"></div></div>' +
            '<b style="color:' + (profit < 0 ? RED : 'inherit') + '">' + money(profit) + '</b></div>';
    }

    function delta(curV, prevV, goodUp) {
        if (!prevV) { return '<span class="rp-delta flat">No previous data</span>'; }
        var pct = Math.round(((curV - prevV) / Math.abs(prevV)) * 100);
        var good = (pct >= 0) === goodUp;
        return '<span class="rp-delta ' + (good ? 'good' : 'bad') + '"><i class="fa-solid fa-arrow-' + (pct >= 0 ? 'up' : 'down') + '"></i> ' +
            Math.abs(pct) + '% vs previous</span>';
    }

    var state = { period: 'month', tab: 'pl' };
    var range, cur, prev, csv = [];

    function barRow(label, amount, base, cls, sign) {
        var pct = amount > 0 ? Math.max(2, Math.min(100, Math.round((amount / base) * 100))) : 0;
        return '<div class="rp-row"><span class="rp-row-label" title="' + esc(label) + '">' + esc(label) + '</span>' +
            '<div class="rp-track"><div class="rp-fill ' + cls + '" data-w="' + pct + '"></div></div>' +
            '<b>' + (sign || '') + money(amount) + '</b></div>';
    }

    function donut(items) {
        var total = items.reduce(function (s, x) { return s + x.value; }, 0) || 1;
        var offset = 0;
        var circles = '<circle class="rp-ring" cx="21" cy="21" r="15.9155"/>';

        items.forEach(function (x, i) {
            var share = (x.value / total) * 100;
            circles += '<circle class="rp-seg" cx="21" cy="21" r="15.9155" stroke="' + palette[i % palette.length] + '"' +
                ' stroke-dasharray="0 100" stroke-dashoffset="' + (-offset) + '" data-share="' + share + '"/>';
            offset += share;
        });

        var legend = items.map(function (x, i) {
            return '<li><i style="background:' + palette[i % palette.length] + '"></i>' + esc(x.name) +
                '<b>' + Math.round((x.value / total) * 100) + '%</b></li>';
        }).join('');

        return '<div class="rp-donut-wrap"><div class="rp-donut"><svg viewBox="0 0 42 42">' + circles + '</svg>' +
            '<div class="rp-donut-center"><b>' + money(total === 1 ? 0 : total) + '</b><span>total</span></div></div>' +
            '<ul class="rp-legend">' + legend + '</ul></div>';
    }

    // ---------- Reports ----------
    function viewPL() {
        var base = Math.max(cur.S, cur.C + cur.E, 1);
        var cats = group(cur.e, 'category');

        csv = [['Item', 'Amount'], ['Sales (without tax)', cur.S], ['Cost of goods sold', cur.C], ['Gross profit', cur.gross]];
        cats.forEach(function (c) { csv.push(['Expense: ' + c.name, c.value]); });
        csv.push(['Net profit', cur.profit]);
        csv.push(['Purchases in this period (information only)', cur.P]);

        var left = '<div class="rp-card"><h3>Profit and Loss</h3>' +
            barRow('Sales (without tax)', cur.S, base, 'f-sales') +
            barRow('Cost of goods sold', cur.C, base, 'f-buy', '- ') +
            '<div class="rp-subtotal"><span>Gross profit</span><b>' + money(cur.gross) + '</b></div>' +
            '<h4>Operating expenses</h4>' +
            (cats.length ? cats.map(function (c) { return barRow(c.name, c.value, base, 'f-exp', '- '); }).join('') : '<div class="rp-empty">No expenses in this period</div>') +
            '<div class="rp-net ' + (cur.profit >= 0 ? 'pos' : 'neg') + '"><span>Net profit</span><b>' + money(cur.profit) + '</b></div>' +
            '<h4>For your information</h4>' +
            '<div class="rp-item"><div>Purchases in this period<small>Not taken off your profit. Stock you bought but have not sold yet is not a loss.</small></div><b>' + money(cur.P) + '</b></div>' +
            '</div>';

        var rows = [['Sales', cur.S, prev.S, true], ['Cost of goods sold', cur.C, prev.C, false], ['Expenses', cur.E, prev.E, false], ['Net profit', cur.profit, prev.profit, true]];
        var right = '<div class="rp-card"><h3>Compared with previous period</h3>' + rows.map(function (r) {
            return '<div class="rp-cmp"><div><div class="rp-cmp-name">' + r[0] + '</div><div class="rp-cmp-sub">Before: ' + money(r[2]) + '</div></div>' +
                '<div class="rp-cmp-right"><b>' + money(r[1]) + '</b>' + delta(r[1], r[2], r[3]) + '</div></div>';
        }).join('') + '</div>';

        return '<div class="rp-split">' + left + right + '</div>';
    }

    function viewSales() {
        var top = groupSales(cur.s);

        csv = [['Customer', 'Invoices', 'Sales (without tax)', 'Profit']];
        top.forEach(function (c) { csv.push([c.name, c.count, c.value, c.profit]); });

        // Pichle 6 mahine ka trend
        var months = [];
        for (var i = 5; i >= 0; i--) {
            var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            var key = d.getFullYear() + '-' + pad(d.getMonth() + 1);
            var total = sum(sales.filter(function (x) { return x.date.slice(0, 7) === key; }));
            months.push({ label: d.toLocaleDateString('en-GB', { month: 'short' }), total: total, on: key >= range.s.slice(0, 7) && key <= range.e.slice(0, 7) });
        }
        var max = Math.max.apply(null, months.map(function (x) { return x.total; })) || 1;
        var biggest = top.reduce(function (m, c) { return Math.max(m, Math.abs(c.profit)); }, 0) || 1;

        var left = '<div class="rp-card"><h3>Profit from each customer</h3>' +
            '<div class="rp-stats">' +
            '<div class="rp-stat"><span>Total sales</span><b>' + money(cur.S) + '</b></div>' +
            '<div class="rp-stat"><span>Profit on sales</span><b>' + money(cur.gross) + '</b></div>' +
            '<div class="rp-stat"><span>Invoices</span><b>' + cur.s.length + '</b></div>' +
            '</div>' +
            (top.length ? top.map(function (c) {
                return profitRow(c.name, c.profit, biggest, c.profit < 0 ? RED : GREEN, ' - sales ' + money(c.value));
            }).join('') : '<div class="rp-empty">No sales in this period</div>') +
            '<div class="rp-cmp-sub" style="margin-top:12px">Profit here means sales minus the cost of the goods sold, before expenses.</div>' +
            '</div>';

        var right = '<div class="rp-card"><h3>Sales trend, last 6 months</h3><div class="rp-cols">' +
            months.map(function (x, i) {
                return '<div class="rp-col' + (x.on ? ' on' : '') + '"><small>' + (x.total ? Math.round(x.total / 1000) + 'K' : '-') + '</small>' +
                    '<div class="rp-col-bar" style="--i:' + i + '" data-h="' + Math.round((x.total / max) * 100) + '" title="' + money(x.total) + '"></div>' +
                    '<span>' + x.label + '</span></div>';
            }).join('') + '</div></div>';

        return '<div class="rp-split">' + left + right + '</div>';
    }

    function viewProducts() {
        var prods = groupProducts(cur.it);
        var biggest = prods.reduce(function (m, p) { return Math.max(m, Math.abs(p.profit)); }, 0) || 1;
        var watch = prods.filter(function (p) { return p.profit < 0 || p.margin < LOW_MARGIN; })
            .sort(function (a, b) { return a.margin - b.margin; });

        csv = [['Product', 'Quantity sold', 'Sales (without tax)', 'Cost', 'Profit', 'Margin %']];
        prods.forEach(function (p) { csv.push([p.name, p.qty, p.revenue, p.cost, p.profit, p.margin.toFixed(1)]); });

        var left = '<div class="rp-card"><h3>Products by profit</h3>' +
            (prods.length ? prods.map(function (p) {
                return profitRow(p.name, p.profit, biggest, toneOf(p), ' - margin ' + p.margin.toFixed(1) + '%');
            }).join('') : '<div class="rp-empty">No products sold in this period</div>') +
            '<div class="rp-cmp-sub" style="margin-top:12px">' +
            '<span style="color:' + GREEN + '">Green</span> = good profit, ' +
            '<span style="color:' + AMBER + '">yellow</span> = margin below ' + LOW_MARGIN + '%, ' +
            '<span style="color:' + RED + '">red</span> = selling at a loss.</div></div>';

        var right = '<div class="rp-card"><h3>Keep an eye on these</h3>' +
            (watch.length ? watch.map(function (p) {
                return '<div class="rp-item"><div>' + esc(p.name) + '<small>' + (p.profit < 0 ? 'Selling at a loss' : 'Very low margin') +
                    ' (' + p.margin.toFixed(1) + '%) - sold ' + p.qty + '</small></div><b style="color:' + toneOf(p) + '">' + money(p.profit) + '</b></div>';
            }).join('') : '<div class="rp-empty">No product is selling at a loss or at a very low margin.</div>') +
            '</div>';

        return '<div class="rp-split even">' + left + right + '</div>';
    }

    function viewExpenses() {
        var cats = group(cur.e, 'category');
        var biggest = cur.e.slice().sort(function (a, b) { return b.amount - a.amount; }).slice(0, 5);

        csv = [['Date', 'Expense', 'Category', 'Amount']];
        cur.e.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).forEach(function (x) {
            csv.push([x.date, x.title, x.category, x.amount]);
        });

        var left = '<div class="rp-card"><h3>Where the money went</h3>' +
            (cats.length ? donut(cats) : '<div class="rp-empty">No expenses in this period</div>') + '</div>';

        var right = '<div class="rp-card"><h3>Biggest expenses</h3>' +
            (biggest.length ? biggest.map(function (x) {
                return '<div class="rp-item"><div>' + esc(x.title) + '<small>' + fmtD(x.date) + ' - ' + esc(x.category) + '</small></div><b>' + money(x.amount) + '</b></div>';
            }).join('') : '<div class="rp-empty">No expenses in this period</div>') + '</div>';

        return '<div class="rp-split even">' + left + right + '</div>';
    }

    function ageBlock(title, items) {
        var total = sum2(items);
        var rows = buckets.map(function (b) {
            var list = items.filter(b.test);
            return { label: b.label, color: b.color, value: sum2(list), count: list.length };
        });
        var max = Math.max.apply(null, rows.map(function (r) { return r.value; })) || 1;
        var over60 = sum2(items.filter(function (x) { return x.late > 60; }));
        var oldest = items.filter(function (x) { return x.late > 0; }).sort(function (a, b) { return b.late - a.late; }).slice(0, 3);

        rows.forEach(function (r) { csv.push([title, r.label, r.value, r.count]); });

        return '<div class="rp-card"><h3>' + title + '</h3><div class="rp-age-total">' + money(total) + '</div>' +
            rows.map(function (r) {
                return '<div class="rp-age-row"><span>' + r.label + '</span>' +
                    '<div class="rp-track"><div class="rp-fill" style="background:' + r.color + '" data-w="' + (r.value ? Math.max(2, Math.round((r.value / max) * 100)) : 0) + '"></div></div>' +
                    '<b>' + money(r.value) + ' <small>(' + r.count + ')</small></b></div>';
            }).join('') +
            '<div class="rp-risk ' + (over60 ? 'warn' : 'ok') + '">' +
            (over60 ? money(over60) + ' is more than 60 days late' : 'Nothing is more than 60 days late') + '</div>' +
            (oldest.length ? '<h4>Oldest</h4>' + oldest.map(function (x) {
                return '<div class="rp-item"><div>' + esc(x.name) + '<small>' + x.late + ' days late</small></div><b>' + money(x.amount) + '</b></div>';
            }).join('') : '') + '</div>';
    }

    function sum2(list) { return list.reduce(function (s, x) { return s + x.amount; }, 0); }

    function viewAging() {
        csv = [['Type', 'Age (days late)', 'Amount', 'Count']];
        return '<div class="rp-split even">' + ageBlock('Receivable (customers owe you)', receivables) + ageBlock('Payable (you owe vendors)', payables) + '</div>';
    }

    // ---------- Screen par lagana ----------
    function countUp(el, target, fmt) {
        var start = null;
        function step(ts) {
            if (start === null) { start = ts; }
            var p = Math.min(1, (ts - start) / 1000);
            el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) { requestAnimationFrame(step); }
        }
        requestAnimationFrame(step);
    }

    function renderCards() {
        var diff = cur.margin - prev.margin;
        var cards = [
            { label: 'Revenue', icon: 'fa-arrow-trend-up', cls: 'c-sales', value: cur.S, fmt: money, d: delta(cur.S, prev.S, true) },
            { label: 'Costs', icon: 'fa-wallet', cls: 'c-cost', value: cur.C + cur.E, fmt: money, d: delta(cur.C + cur.E, prev.C + prev.E, false) },
            { label: 'Net Profit', icon: 'fa-sack-dollar', cls: 'c-profit', value: cur.profit, fmt: money, d: delta(cur.profit, prev.profit, true) },
            {
                label: 'Profit Margin', icon: 'fa-percent', cls: 'c-margin', value: cur.margin, fmt: function (v) { return v.toFixed(1) + '%'; },
                d: '<span class="rp-delta ' + (diff >= 0 ? 'good' : 'bad') + '">' + (diff >= 0 ? '+' : '') + diff.toFixed(1) + ' pts vs previous</span>'
            }
        ];

        $('rpCards').innerHTML = cards.map(function (c, i) {
            return '<div class="rp-kpi" style="--i:' + i + '"><div class="rp-kpi-icon ' + c.cls + '"><i class="fa-solid ' + c.icon + '"></i></div>' +
                '<div class="rp-kpi-label">' + c.label + '</div><div class="rp-kpi-value">0</div>' + c.d + '</div>';
        }).join('');

        document.querySelectorAll('.rp-kpi-value').forEach(function (el, i) { countUp(el, cards[i].value, cards[i].fmt); });
    }

    function renderInsight() {
        if (!cur.S) { $('rpInsight').textContent = 'There are no sales in this period yet.'; return; }

        var text = 'Net profit is ' + money(cur.profit);
        if (prev.profit) {
            var pct = Math.round(((cur.profit - prev.profit) / Math.abs(prev.profit)) * 100);
            text += ', ' + (pct >= 0 ? 'up ' : 'down ') + Math.abs(pct) + '% from the previous period';
        }
        text += '. ';

        var cat = group(cur.e, 'category')[0];
        var prods = groupProducts(cur.it);
        var best = prods.filter(function (p) { return p.profit > 0; })[0];
        var losing = prods.filter(function (p) { return p.profit < 0; });

        if (best) { text += 'The product earning the most is ' + best.name + ' (' + money(best.profit) + '). '; }
        if (losing.length) { text += losing[0].name + (losing.length > 1 ? ' and ' + (losing.length - 1) + ' more are' : ' is') + ' selling at a loss. '; }
        if (cat) { text += 'The biggest expense category is ' + cat.name + ' (' + money(cat.value) + ').'; }

        $('rpInsight').textContent = text;
    }

    function renderNote() {
        var unknown = cur.it.filter(function (x) { return x.unknown; }).length;
        var estimated = cur.it.filter(function (x) { return x.estimated; }).length;
        var text = '';

        if (unknown) { text += 'The cost of some sales is not known, so their profit may look higher than it really is. '; }
        if (estimated) { text += 'Some older sales use the product\'s current cost because the cost was not saved at that time.'; }

        $('rpNote').textContent = text;
        $('rpNote').style.display = text ? 'block' : 'none';
    }

    function renderBody() {
        var views = { pl: viewPL, sales: viewSales, prod: viewProducts, exp: viewExpenses, age: viewAging };
        $('rpBody').innerHTML = '<div class="rp-view">' + views[state.tab]() + '</div>';

        // Animation shuru
        setTimeout(function () {
            document.querySelectorAll('.rp-fill').forEach(function (f) { f.style.width = f.getAttribute('data-w') + '%'; });
            document.querySelectorAll('.rp-col-bar').forEach(function (b) { b.style.height = b.getAttribute('data-h') + '%'; });
            document.querySelectorAll('.rp-seg').forEach(function (s) {
                var share = Number(s.getAttribute('data-share'));
                s.setAttribute('stroke-dasharray', share + ' ' + (100 - share));
            });
        }, 80);
    }

    function update() {
        range = periodRange(state.period);
        cur = calc(range.s, range.e);
        prev = calc(range.ps, range.pe);

        $('rpRange').textContent = fmtD(range.s) + ' to ' + fmtD(range.e) + '  (compared with ' + fmtD(range.ps) + ' to ' + fmtD(range.pe) + ')';
        renderCards();
        renderInsight();
        renderNote();
        renderBody();
    }

    // ---------- Buttons ----------
    $('rpPeriods').addEventListener('click', function (e) {
        var b = e.target.closest('.rp-period');
        if (!b) { return; }
        document.querySelectorAll('.rp-period').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        state.period = b.getAttribute('data-p');
        update();
    });

    $('rpTabs').addEventListener('click', function (e) {
        var b = e.target.closest('.rp-tab');
        if (!b) { return; }
        document.querySelectorAll('.rp-tab').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        state.tab = b.getAttribute('data-tab');
        renderBody();
    });

    $('rpExport').addEventListener('click', function () {
        var text = csv.map(function (row) {
            return row.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
        }).join('\n');

        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' }));
        a.download = 'report-' + state.tab + '-' + toStr(now) + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    $('rpPrint').addEventListener('click', function () { window.print(); });
    fetch('/reports/data', { headers: { 'Accept': 'application/json' } })
        .then(function (res) {
            if (!res.ok) { throw new Error('request failed'); }
            return res.json();
        })
        .then(function (data) {
            sales = data.sales;
            items = data.items;
            purchases = data.purchases;
            expenses = data.expenses;
            receivables = data.receivables;
            payables = data.payables;
            update();
        })
        .catch(function () {
            $('rpRange').textContent = 'Reports could not be loaded';
        });
})();