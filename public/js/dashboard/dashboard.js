(function () {
    function $(id) { return document.getElementById(id); }
    function money(n) { return formatMoney(Math.round(n)); }

    function esc(t) {
        return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    var categoryColors = {
        Rent: '#0ea5e9',
        Salaries: '#8b5cf6',
        Utilities: '#f97316',
        Transport: '#ec4899',
        Supplies: '#10b981',
        Other: '#f59e0b'
    };
    var fallbackColors = ['#14b8a6', '#6366f1', '#eab308', '#ef4444'];

    function empty(text) {
        return '<div class="db-item-sub" style="padding:14px 4px;">' + esc(text) + '</div>';
    }

    function build(data) {
        var sales = data.sales;
        var purchases = data.purchases;
        var expenses = data.expenses;
        var profit = sales.map(function (s, i) { return s - purchases[i] - expenses[i]; });

        var receivable = data.receivable;
        var payable = data.payable;
        var attention = data.attention;
        var dues = data.dues;
        var activity = data.activity;

        var categories = data.categories.map(function (c, i) {
            return { name: c.name, value: c.value, color: categoryColors[c.name] || fallbackColors[i % fallbackColors.length] };
        });

        // ---------- Hero ----------
        var now = new Date();
        var hour = now.getHours();
        var greet = hour < 12 ? 'Good morning' : (hour < 17 ? 'Good afternoon' : 'Good evening');

        $('dbGreet').textContent = greet + ', Admin';
        $('dbDate').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        $('dbSummary').textContent = attention.length === 0
            ? 'Everything looks good today.'
            : attention.length + (attention.length === 1 ? ' thing needs' : ' things need') + ' your attention today.';

        // ---------- KPI cards ----------
        var kpis = [
            { label: 'Sales',      icon: 'fa-arrow-trend-up', cls: 'k-sales',  data: sales,     goodUp: true },
            { label: 'Purchases',  icon: 'fa-cart-shopping',  cls: 'k-buy',    data: purchases, goodUp: false },
            { label: 'Expenses',   icon: 'fa-receipt',        cls: 'k-exp',    data: expenses,  goodUp: false },
            { label: 'Net Profit', icon: 'fa-sack-dollar',    cls: 'k-profit', data: profit,    goodUp: true }
        ];

        function sparkPoints(list) {
            var min = Math.min.apply(null, list);
            var max = Math.max.apply(null, list);
            var range = max - min || 1;
            return list.map(function (v, i) {
                return Math.round(i * (160 / (list.length - 1))) + ',' + Math.round(36 - ((v - min) / range) * 32);
            }).join(' ');
        }

        $('dbKpis').innerHTML = kpis.map(function (k, i) {
            var last = k.data[k.data.length - 1];
            var prev = k.data[k.data.length - 2];
            var pct = prev ? Math.round(((last - prev) / Math.abs(prev)) * 100) : 0;
            var good = (pct >= 0) === k.goodUp;

            return '<div class="db-kpi" style="--i:' + i + '">' +
                '<div class="db-kpi-top">' +
                    '<div class="db-kpi-icon ' + k.cls + '"><i class="fa-solid ' + k.icon + '"></i></div>' +
                    '<span class="db-trend ' + (good ? 'good' : 'bad') + '">' +
                        '<i class="fa-solid fa-arrow-' + (pct >= 0 ? 'up' : 'down') + '"></i> ' + Math.abs(pct) + '%</span>' +
                '</div>' +
                '<div class="db-kpi-label">' + k.label + ' this month</div>' +
                '<div class="db-kpi-value" data-count="' + last + '">' + money(0) + '</div>' +
                '<svg class="db-spark" viewBox="0 0 160 40" preserveAspectRatio="xMinYMid meet">' +
                    '<polyline pathLength="1" points="' + sparkPoints(k.data) + '"/></svg>' +
            '</div>';
        }).join('');

        // Numbers count up
        document.querySelectorAll('[data-count]').forEach(function (el) {
            var target = Number(el.getAttribute('data-count'));
            var start = null;

            function step(ts) {
                if (start === null) { start = ts; }
                var p = Math.min(1, (ts - start) / 1100);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = money(target * eased);
                if (p < 1) { requestAnimationFrame(step); }
            }
            requestAnimationFrame(step);
        });

        // ---------- Chart ----------
        var maxValue = 0;
        var spending = purchases.map(function (p, i) { return p + expenses[i]; });
        sales.concat(spending).forEach(function (v) { if (v > maxValue) { maxValue = v; } });
        maxValue = maxValue || 1;

        $('dbChart').innerHTML = sales.map(function (s, i) {
            var d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            var label = d.toLocaleDateString('en-GB', { month: 'short' });

            return '<div class="db-month">' +
                '<div class="db-bars">' +
                    '<div class="db-bar sales" style="--i:' + i + '" data-h="' + Math.round((s / maxValue) * 100) + '" title="Sales ' + money(s) + '"></div>' +
                    '<div class="db-bar spend" style="--i:' + i + '" data-h="' + Math.round((spending[i] / maxValue) * 100) + '" title="Spending ' + money(spending[i]) + '"></div>' +
                '</div>' +
                '<span>' + label + '</span>' +
            '</div>';
        }).join('');

        // ---------- Needs attention ----------
        $('dbAttCount').textContent = attention.length + (attention.length === 1 ? ' item' : ' items');
        $('dbAttention').innerHTML = attention.length ? attention.map(function (a, i) {
            var sub = (a.amount !== null ? money(a.amount) + ' ' : '') + a.sub;
            return '<a class="db-att" href="' + a.href + '" style="--i:' + i + '">' +
                '<span class="db-att-icon ' + a.tone + (a.pulse ? ' pulse' : '') + '"><i class="fa-solid ' + a.icon + '"></i></span>' +
                '<div><div class="db-att-title">' + esc(a.title) + '</div><div class="db-att-sub">' + esc(sub) + '</div></div>' +
                '<i class="fa-solid fa-chevron-right db-att-arrow"></i>' +
            '</a>';
        }).join('') : empty('Nothing needs your attention right now.');

        // ---------- Cash position ----------
        var cashMax = Math.max(receivable, payable) || 1;
        var net = receivable - payable;

        $('cashIn').textContent = money(receivable);
        $('cashOut').textContent = money(payable);
        $('cashNet').textContent = (net >= 0 ? '+ ' : '- ') + money(Math.abs(net));
        $('cashNet').style.color = net >= 0 ? '#16a34a' : '#ef4444';

        // ---------- Donut ----------
        var total = categories.reduce(function (s, c) { return s + c.value; }, 0);
        var offset = 0;
        var circles = '<circle class="db-ring" cx="21" cy="21" r="15.9155"/>';

        categories.forEach(function (c) {
            var share = (c.value / total) * 100;
            circles += '<circle class="db-seg" cx="21" cy="21" r="15.9155" stroke="' + c.color + '"' +
                ' stroke-dasharray="0 100" stroke-dashoffset="' + (-offset) + '" data-share="' + share + '"/>';
            offset += share;
        });

        $('dbDonut').innerHTML = circles;
        $('dbDonutTotal').textContent = money(total);
        $('dbLegend').innerHTML = categories.length ? categories.map(function (c) {
            return '<li><i style="background:' + c.color + '"></i>' + esc(c.name) + '<b>' + Math.round((c.value / total) * 100) + '%</b></li>';
        }).join('') : '<li>No expenses this month</li>';

        // ---------- Upcoming dues ----------
        $('dbDues').innerHTML = dues.length ? dues.map(function (d, i) {
            var receive = d.type === 'in';
            return '<div class="db-item" style="--i:' + i + '">' +
                '<span class="db-item-icon ' + (receive ? 'green' : 'red') + '"><i class="fa-solid fa-arrow-' + (receive ? 'down' : 'up') + '"></i></span>' +
                '<div><div class="db-item-main">' + esc(d.name) + '</div>' +
                '<div class="db-item-sub">' + esc(d.ref) + ' - ' + esc(d.when) + '</div></div>' +
                '<div class="db-item-right ' + d.type + '">' + (receive ? '+ ' : '- ') + money(d.amount) + '</div>' +
            '</div>';
        }).join('') : empty('No dues in the next 7 days.');

        // ---------- Recent activity ----------
        $('dbActivity').innerHTML = activity.length ? activity.map(function (a, i) {
            return '<div class="db-item" style="--i:' + i + '">' +
                '<span class="db-item-icon ' + a.tone + '"><i class="fa-solid ' + a.icon + '"></i></span>' +
                '<div><div class="db-item-main">' + esc(a.text) + '</div>' +
                '<div class="db-item-sub">' + esc(a.when) + '</div></div>' +
                (a.amount ? '<div class="db-item-right">' + money(a.amount) + '</div>' : '') +
            '</div>';
        }).join('') : empty('No activity yet.');

        // ---------- Start animations: bars, progress and donut ----------
        setTimeout(function () {
            document.querySelectorAll('.db-bar').forEach(function (b) { b.style.height = b.getAttribute('data-h') + '%'; });

            $('cashInBar').style.width = Math.round((receivable / cashMax) * 100) + '%';
            $('cashOutBar').style.width = Math.round((payable / cashMax) * 100) + '%';

            document.querySelectorAll('.db-seg').forEach(function (s) {
                var share = Number(s.getAttribute('data-share'));
                s.setAttribute('stroke-dasharray', share + ' ' + (100 - share));
            });
        }, 250);
    }

    // ---------- Fetch the real data ----------
    fetch('/dashboard/data', { headers: { 'Accept': 'application/json' } })
        .then(function (res) {
            if (!res.ok) { throw new Error('request failed'); }
            return res.json();
        })
        .then(build)
        .catch(function () {
            $('dbGreet').textContent = 'Dashboard could not be loaded';
        });
})();