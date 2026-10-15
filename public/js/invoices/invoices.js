// ---------- Ye cheezein baad mein database / settings se aayengi ----------
var COMPANY = { name: 'Your Company', address: 'Company address', phone: '0300 0000000' };
var CUSTOMER_NAMES = ['Ali Traders', 'Sara Fabrics', 'Hamid & Sons', 'Noor Stores', 'Bilal Electronics'];

// ---------- Chhote helper functions ----------
function $(id) { return document.getElementById(id); }

function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}
function money(n) { return formatMoney(Math.round(n)); }

function iso(offset) {
    var d = new Date();
    d.setDate(d.getDate() + offset);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function daysUntil(dateStr) {
    var a = new Date(dateStr + 'T00:00:00');
    var b = new Date(iso(0) + 'T00:00:00');
    return Math.round((a - b) / 86400000);
}

function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2400);
}

// ---------- customers ka data (tareekhein aaj ke hisaab se khud banti hain) ----------
var invoices = [
    { no: 'INV-0001', customer: 'Ali Traders', date: iso(-50), due: iso(-35), items: [{ name: 'Cotton fabric (meter)', qty: 100, price: 600 }], discount: 0, tax: 0, paid: 20000 },
    { no: 'INV-0002', customer: 'Sara Fabrics', date: iso(-30), due: iso(-15), items: [{ name: 'Lawn suits', qty: 40, price: 500 }], discount: 0, tax: 0, paid: 20000 },
    { no: 'INV-0003', customer: 'Hamid & Sons', date: iso(-40), due: iso(-25), items: [{ name: 'Embroidered shawls', qty: 50, price: 1900 }], discount: 0, tax: 0, paid: 5000 },
    { no: 'INV-0004', customer: 'Ali Traders', date: iso(-10), due: iso(5), items: [{ name: 'Cotton fabric (meter)', qty: 70, price: 500 }], discount: 0, tax: 0, paid: 0 },
    { no: 'INV-0005', customer: 'Bilal Electronics', date: iso(-20), due: iso(-5), items: [{ name: 'LED bulbs', qty: 100, price: 250 }], discount: 0, tax: 0, paid: 25000 },
    { no: 'INV-0006', customer: 'Noor Stores', date: iso(-2), due: iso(13), items: [{ name: 'Winter caps', qty: 60, price: 200 }], discount: 0, tax: 0, paid: 0 }
];

var currentFilter = 'all';
var viewNo = null;
var payNo = null;

// ---------- Hisaab kitaab ----------
function totals(inv) {
    var sub = 0;
    inv.items.forEach(function (i) { sub += i.qty * i.price; });
    var disc = Math.min(inv.discount || 0, sub);
    var taxAmt = (sub - disc) * (inv.tax || 0) / 100;
    var total = sub - disc + taxAmt;
    return { sub: sub, disc: disc, taxAmt: taxAmt, total: total, balance: Math.max(total - inv.paid, 0) };
}

function statusOf(inv) {
    var t = totals(inv);
    if (t.total > 0 && t.balance < 1) return 'Paid';
    if (inv.paid > 0) return 'Partial';
    return 'Unpaid';
}

function isOverdue(inv) { return statusOf(inv) !== 'Paid' && daysUntil(inv.due) < 0; }

function findInv(no) { return invoices.find(function (i) { return i.no === no; }); }

function nextNo() {
    var max = 0;
    invoices.forEach(function (i) { max = Math.max(max, parseInt(i.no.replace(/\D/g, ''), 10) || 0); });
    return 'INV-' + String(max + 1).padStart(4, '0');
}

function dueTag(inv) {
    if (statusOf(inv) === 'Paid') return '';
    var n = daysUntil(inv.due);
    if (n < 0) return '<div class="due-tag t-red">' + Math.abs(n) + ' days late</div>';
    if (n === 0) return '<div class="due-tag t-amber">Due today</div>';
    return '<div class="due-tag t-green">' + n + ' days left</div>';
}

// ---------- Invoice (bill) ka html ----------
function billInner(inv) {
    var t = totals(inv);
    var rows = '';
    inv.items.forEach(function (i) {
        rows += '<tr><td>' + esc(i.name || '-') + '</td><td class="r">' + i.qty + '</td><td class="r">' + money(i.price) + '</td><td class="r">' + money(i.qty * i.price) + '</td></tr>';
    });
    if (!rows) rows = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:18px;">Items yahan nazar ayenge</td></tr>';

    var sum = '<div><span>Subtotal</span><span>' + money(t.sub) + '</span></div>';
    if (t.disc > 0) sum += '<div><span>Discount</span><span>- ' + money(t.disc) + '</span></div>';
    if (inv.tax > 0) sum += '<div><span>Tax (' + inv.tax + '%)</span><span>' + money(t.taxAmt) + '</span></div>';
    sum += '<div class="grand"><span>Total</span><span>' + money(t.total) + '</span></div>';
    if (inv.paid > 0) {
        sum += '<div><span>Paid</span><span>- ' + money(inv.paid) + '</span></div>';
        sum += '<div class="due"><span>Balance Due</span><span>' + money(t.balance) + '</span></div>';
    }

    return '<div class="bill-top">' +
            '<div><div class="bill-co">' + esc(COMPANY.name) + '</div><div class="bill-small">' + esc(COMPANY.address) + '<br>' + esc(COMPANY.phone) + '</div></div>' +
            '<div class="bill-right"><div class="bill-title">INVOICE</div><div class="bill-small">No: ' + esc(inv.no) + '<br>Date: ' + esc(inv.date) + '<br>Due: ' + esc(inv.due) + '</div></div>' +
        '</div>' +
        '<div class="bill-to"><span>Bill To</span><b>' + esc(inv.customer) + '</b></div>' +
        '<table class="bill-table"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="bill-sum">' + sum + '</div>' +
        '<div class="bill-foot">Thank you for your business.</div>';
}

// ---------- PDF download ----------
function downloadBill(inv) {
    if (typeof html2pdf === 'undefined') { toast('Internet is required for PDF'); return; }
    var box = document.createElement('div');
    box.className = 'bill';
    box.style.width = '720px';
    box.innerHTML = billInner(inv);
    html2pdf().set({
        margin: 8,
        filename: inv.no + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(box).save().then(function () {
        toast(inv.no + ' PDF is downloaded');
    });
}
// ---------- Cards, tabs, table ----------
function renderCards() {
    var month = iso(0).slice(0, 7);
    var sales = 0, count = 0, dueSum = 0, dueCount = 0;
    invoices.forEach(function (inv) {
        var t = totals(inv);
        if (inv.date.slice(0, 7) === month) { sales += t.total; count++; }
        var n = daysUntil(inv.due);
        if (t.balance > 0 && n >= 0 && n <= 7) { dueSum += t.balance; dueCount++; }
    });
    $('sum-month').textContent = money(sales);
    $('sum-month-note').textContent = count + ' invoice(s) this month';
    $('sum-week').textContent = money(dueSum);
    $('sum-week-note').textContent = dueCount + ' invoice(s) due in 7 days';
}

function matchesFilter(inv) {
    var s = statusOf(inv);
    if (currentFilter === 'unpaid') return s === 'Unpaid';
    if (currentFilter === 'partial') return s === 'Partial';
    if (currentFilter === 'paid') return s === 'Paid';
    if (currentFilter === 'overdue') return isOverdue(inv);
    return true;
}

function renderTabs() {
    $('cnt-all').textContent = invoices.length;
    $('cnt-unpaid').textContent = invoices.filter(function (i) { return statusOf(i) === 'Unpaid'; }).length;
    $('cnt-partial').textContent = invoices.filter(function (i) { return statusOf(i) === 'Partial'; }).length;
    $('cnt-paid').textContent = invoices.filter(function (i) { return statusOf(i) === 'Paid'; }).length;
    $('cnt-overdue').textContent = invoices.filter(isOverdue).length;
}

function renderTable() {
    var q = $('search-box').value.trim().toLowerCase();
    var html = '';

    invoices.filter(function (inv) {
        if (!matchesFilter(inv)) return false;
        if (q && (inv.no + ' ' + inv.customer).toLowerCase().indexOf(q) === -1) return false;
        return true;
    }).forEach(function (inv) {
        var t = totals(inv);
        var s = statusOf(inv);
        var pct = t.total ? Math.min(Math.round(inv.paid / t.total * 100), 100) : 0;
        var badge = s === 'Paid' ? 'b-green' : (s === 'Partial' ? 'b-amber' : 'b-red');

        html += '<tr data-no="' + inv.no + '">' +
            '<td><b>' + esc(inv.no) + '</b></td>' +
            '<td>' + esc(inv.customer) + '</td>' +
            '<td>' + esc(inv.date) + '</td>' +
            '<td>' + esc(inv.due) + dueTag(inv) + '</td>' +
            '<td><b>' + money(t.total) + '</b></td>' +
            '<td><div class="limit-bar"><div class="limit-fill f-ok" style="width:' + pct + '%"></div></div>' +
                '<div class="paid-text">' + money(inv.paid) + ' paid</div></td>' +
            '<td><span class="badge ' + badge + '">' + s + '</span></td>' +
            '<td><div class="acts">' +
                '<button class="act" data-act="dl" title="Download PDF"><i class="fa-solid fa-download"></i></button>' +
                (s !== 'Paid' ? '<button class="act" data-act="pay" title="Record payment"><i class="fa-solid fa-money-bill-wave"></i></button>' : '') +
            '</div></td></tr>';
    });

    if (!html) html = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px;">Koi invoice nahi mila.</td></tr>';
    $('inv-body').innerHTML = html;
}

function renderAll() {
    renderCards();
    renderTabs();
    renderTable();
}

// ---------- Invoice dekhna ----------
function openView(no) {
    var inv = findInv(no);
    if (!inv) return;
    viewNo = no;
    $('view-bill').innerHTML = billInner(inv);
    $('view-pay').style.display = statusOf(inv) === 'Paid' ? 'none' : '';
    $('view-modal').classList.add('show');
}

// ---------- Payment record karna ----------
function openPay(no) {
    var inv = findInv(no);
    var t = totals(inv);
    payNo = no;
    $('pay-info').textContent = inv.no + ' - ' + inv.customer + ' | Balance: ' + money(t.balance);
    $('pay-amount').value = Math.round(t.balance);
    $('pay-error').textContent = '';
    $('pay-modal').classList.add('show');
    $('pay-amount').focus();
}

function savePay() {
    var inv = findInv(payNo);
    var t = totals(inv);
    var amount = parseFloat($('pay-amount').value) || 0;
    if (amount <= 0) { $('pay-error').textContent = 'Raqam likho.'; return; }
    if (amount > Math.round(t.balance)) { $('pay-error').textContent = 'Balance se zyada nahi ho sakta.'; return; }
    inv.paid += amount;
    $('pay-modal').classList.remove('show');
    renderAll();
    if ($('view-modal').classList.contains('show')) openView(payNo);
    toast('Payment save ho gayi');
}

// ---------- Naya invoice ----------
function addItemRow() {
    var row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = '<input class="it-name" type="text" placeholder="Item name">' +
        '<input class="it-qty" type="number" value="1" min="1">' +
        '<input class="it-price" type="number" placeholder="Price">' +
        '<button type="button" class="it-del"><i class="fa-solid fa-xmark"></i></button>';
    $('items').appendChild(row);
}

function readItems() {
    var list = [];
    document.querySelectorAll('#items .item-row').forEach(function (row) {
        list.push({
            name: row.querySelector('.it-name').value.trim(),
            qty: parseFloat(row.querySelector('.it-qty').value) || 0,
            price: parseFloat(row.querySelector('.it-price').value) || 0
        });
    });
    return list;
}

function validItems() {
    return readItems().filter(function (i) { return i.name && i.qty > 0 && i.price > 0; });
}

function draft() {
    return {
        no: nextNo(),
        customer: $('n-customer').value || '-',
        date: iso(0),
        due: $('n-due').value || iso(15),
        items: readItems().filter(function (i) { return i.name || i.price; }),
        discount: parseFloat($('n-discount').value) || 0,
        tax: parseFloat($('n-tax').value) || 0,
        paid: 0
    };
}

function updatePreview() { $('new-bill').innerHTML = billInner(draft()); }

function openNew() {
    var opts = '<option value="">Select customer</option>';
    CUSTOMER_NAMES.forEach(function (n) { opts += '<option>' + esc(n) + '</option>'; });
    $('n-customer').innerHTML = opts;
    $('n-due').value = iso(15);
    $('n-discount').value = 0;
    $('n-tax').value = 0;
    $('items').innerHTML = '';
    addItemRow();
    $('new-error').textContent = '';
    updatePreview();
    $('new-modal').classList.add('show');
}

function saveNew() {
    var d = draft();
    var items = validItems();
    if (!$('n-customer').value) { $('new-error').textContent = 'Select Customer.'; return; }
    if (!items.length) { $('new-error').textContent = 'Choose Atlleast One Item (name, quantity,price).'; return; }
    d.items = items;
    invoices.unshift(d);
    $('new-modal').classList.remove('show');
    renderAll();
    toast(d.no + ' done');
}

// ---------- Buttons aur clicks ----------
$('open-new').addEventListener('click', openNew);
$('add-item').addEventListener('click', function () { addItemRow(); updatePreview(); });
$('new-form').addEventListener('input', updatePreview);
$('new-form').addEventListener('change', updatePreview);
$('new-form').addEventListener('click', function (e) {
    if (e.target.closest('.it-del')) {
        var rows = document.querySelectorAll('#items .item-row');
        if (rows.length > 1) { e.target.closest('.item-row').remove(); updatePreview(); }
    }
});

$('new-save').addEventListener('click', saveNew);
$('new-dl').addEventListener('click', function () {
    if (!validItems().length) { $('new-error').textContent = 'PDF ke liye pehle ek item likho.'; return; }
    var d = draft();
    d.items = validItems();
    downloadBill(d);
});
$('new-close').addEventListener('click', function () { $('new-modal').classList.remove('show'); });
$('new-cancel').addEventListener('click', function () { $('new-modal').classList.remove('show'); });

$('view-close').addEventListener('click', function () { $('view-modal').classList.remove('show'); });
$('view-dl').addEventListener('click', function () { downloadBill(findInv(viewNo)); });
$('view-pay').addEventListener('click', function () { openPay(viewNo); });

$('pay-save').addEventListener('click', savePay);
$('pay-close').addEventListener('click', function () { $('pay-modal').classList.remove('show'); });
$('pay-cancel').addEventListener('click', function () { $('pay-modal').classList.remove('show'); });

['new-modal', 'view-modal', 'pay-modal'].forEach(function (id) {
    $(id).addEventListener('click', function (e) { if (e.target === $(id)) $(id).classList.remove('show'); });
});

$('inv-body').addEventListener('click', function (e) {
    var row = e.target.closest('tr');
    if (!row || !row.dataset.no) return;
    var btn = e.target.closest('button.act');
    if (btn) {
        if (btn.dataset.act === 'dl') downloadBill(findInv(row.dataset.no));
        if (btn.dataset.act === 'pay') openPay(row.dataset.no);
        return;
    }
    openView(row.dataset.no);
});

$('search-box').addEventListener('input', renderTable);

document.querySelectorAll('.filter-btn').forEach(function (b) {
    b.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        currentFilter = b.dataset.filter;
        renderTable();
    });
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        ['new-modal', 'view-modal', 'pay-modal'].forEach(function (id) { $(id).classList.remove('show'); });
    }
});

renderAll();