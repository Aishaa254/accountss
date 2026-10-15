(function () {
    function $(id) { return document.getElementById(id); }
    function money(n) { return formatMoney(Math.round(n)); }

    function esc(t) {
        return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ---------- Sample data (backend ke baad asli data aayega) ----------
    var sales     = [420000, 515000, 480000, 610000, 560000, 690000];
    var purchases = [210000, 260000, 240000, 300000, 270000, 330000];
    var expenses  = [120000, 125000, 118000, 135000, 130000, 140000];
    var profit    = sales.map(function (s, i) { return s - purchases[i] - expenses[i]; });

    var receivable = 385000;
    var payable = 285000;

    var categories = [
        { name: 'Rent',      value: 50000, color: '#0ea5e9' },
        { name: 'Salaries',  value: 45000, color: '#8b5cf6' },
        { name: 'Utilities', value: 18500, color: '#f97316' },
        { name: 'Transport', value: 14000, color: '#ec4899' },
        { name: 'Supplies',  value: 8500,  color: '#10b981' },
        { name: 'Other',     value: 4000,  color: '#f59e0b' }
    ];

    var attention = [
        { icon: 'fa-file-invoice', tone: 'red',    pulse: true,  href: '/invoices',  title: '2 invoices are overdue',          sub: money(130000) + ' waiting from Ali Traders and Hamid & Sons' },
        { icon: 'fa-cart-shopping', tone: 'red',   pulse: true,  href: '/purchases', title: '1 purchase is overdue',           sub: 'Noor Packaging, ' + money(90000) },
        { icon: 'fa-truck',        tone: 'orange', pulse: false, href: '/vendors',   title: '3 vendor payments due this week', sub: money(60000) + ' to pay' },
        { icon: 'fa-user-clock',   tone: 'yellow', pulse: false, href: '/customers', title: 'Ali Traders is near the credit limit', sub: '92% of the limit is used' }
    ];

    var dues = [
        { type: 'out', name: 'Al-Madina Traders', ref: 'PO-0005',  when: 'Tomorrow',  amount: 20000 },
        { type: 'in',  name: 'Ali Traders',       ref: 'INV-0004', when: 'In 5 days', amount: 35000 },
        { type: 'out', name: 'Karim Steel House', ref: 'PO-0001',  when: 'In 5 days', amount: 40000 },
        { type: 'in',  name: 'Sara Fabrics',      ref: 'INV-0008', when: 'In 6 days', amount: 48000 }
    ];

    var activity = [
        { icon: 'fa-file-invoice-dollar', tone: 'green',  text: 'Invoice INV-0006 created for Noor Stores',   amount: 12000, when: '2 hours ago' },
        { icon: 'fa-money-bill-wave',     tone: 'blue',   text: 'Payment received from Sara Fabrics',         amount: 20000, when: 'Yesterday' },
        { icon: 'fa-cart-shopping',       tone: 'orange', text: 'Purchase PO-0007 added from Shan Printers',  amount: 80000, when: 'Yesterday' },
        { icon: 'fa-receipt',             tone: 'red',    text: 'Expense recorded: Staff salaries',           amount: 85000, when: '2 days ago' },
        { icon: 'fa-user-plus',           tone: 'purple', text: 'New customer added: Bilal Electronics',      amount: 0,     when: '3 days ago' },
        { icon: 'fa-truck',               tone: 'blue',   text: 'Payment sent to Karim Steel House',          amount: 60000, when: '4 days ago' }
    ];

    // ---------- Hero ----------
    var now = new Date();
    var hour = now.getHours();
    var greet = hour < 12 ? 'Good morning' : (hour < 17 ? 'Good afternoon' : 'Good evening');

    $('dbGreet').textContent = greet + ', Admin';
    $('dbDate').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('dbSummary').textContent = attention.length + ' things need your attention today.';

    // ---------- KPI cards ----------
    var kpis = [
        { label: 'Sales',      icon: 'fa-arrow-trend-up', cls: 'k-sales',  data: sales,     goodUp: true },
        { label: 'Purchases',  icon: 'fa-cart-shopping',  cls: 'k-buy',    data: purchases, goodUp: false },
        { label: 'Expenses',   icon: 'fa-receipt',        cls: 'k-exp',    data: expenses,  goodUp: false },
        { label: 'Net Profit', icon: 'fa-sack-dollar',    cls: 'k-profit', data: profit,    goodUp: true }
    ];

    function sparkPoints(data) {
        var min = Math.min.apply(null, data);
        var max = Math.max.apply(null, data);
        var range = max - min || 1;
        return data.map(function (v, i) {
            return Math.round(i * (160 / (data.length - 1))) + ',' + Math.round(36 - ((v - min) / range) * 32);
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

    // Numbers ginti ke saath badhte hain
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
    $('dbAttCount').textContent = attention.length + ' items';
    $('dbAttention').innerHTML = attention.map(function (a, i) {
        return '<a class="db-att" href="' + a.href + '" style="--i:' + i + '">' +
            '<span class="db-att-icon ' + a.tone + (a.pulse ? ' pulse' : '') + '"><i class="fa-solid ' + a.icon + '"></i></span>' +
            '<div><div class="db-att-title">' + esc(a.title) + '</div><div class="db-att-sub">' + esc(a.sub) + '</div></div>' +
            '<i class="fa-solid fa-chevron-right db-att-arrow"></i>' +
        '</a>';
    }).join('');

    // ---------- Cash position ----------
    var cashMax = Math.max(receivable, payable);
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
    $('dbLegend').innerHTML = categories.map(function (c) {
        return '<li><i style="background:' + c.color + '"></i>' + esc(c.name) + '<b>' + Math.round((c.value / total) * 100) + '%</b></li>';
    }).join('');

    // ---------- Upcoming dues ----------
    $('dbDues').innerHTML = dues.map(function (d, i) {
        var receive = d.type === 'in';
        return '<div class="db-item" style="--i:' + i + '">' +
            '<span class="db-item-icon ' + (receive ? 'green' : 'red') + '"><i class="fa-solid fa-arrow-' + (receive ? 'down' : 'up') + '"></i></span>' +
            '<div><div class="db-item-main">' + esc(d.name) + '</div>' +
            '<div class="db-item-sub">' + esc(d.ref) + ' - ' + esc(d.when) + '</div></div>' +
            '<div class="db-item-right ' + d.type + '">' + (receive ? '+ ' : '- ') + money(d.amount) + '</div>' +
        '</div>';
    }).join('');

    // ---------- Recent activity ----------
    $('dbActivity').innerHTML = activity.map(function (a, i) {
        return '<div class="db-item" style="--i:' + i + '">' +
            '<span class="db-item-icon ' + a.tone + '"><i class="fa-solid ' + a.icon + '"></i></span>' +
            '<div><div class="db-item-main">' + esc(a.text) + '</div>' +
            '<div class="db-item-sub">' + esc(a.when) + '</div></div>' +
            (a.amount ? '<div class="db-item-right">' + money(a.amount) + '</div>' : '') +
        '</div>';
    }).join('');

    // ---------- Animation shuru: bars, progress aur donut ----------
    setTimeout(function () {
        document.querySelectorAll('.db-bar').forEach(function (b) { b.style.height = b.getAttribute('data-h') + '%'; });

        $('cashInBar').style.width = Math.round((receivable / cashMax) * 100) + '%';
        $('cashOutBar').style.width = Math.round((payable / cashMax) * 100) + '%';

        document.querySelectorAll('.db-seg').forEach(function (s) {
            var share = Number(s.getAttribute('data-share'));
            s.setAttribute('stroke-dasharray', share + ' ' + (100 - share));
        });
    }, 250);
})();