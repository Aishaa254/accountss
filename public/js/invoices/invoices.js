// ---------- Company details (filled from Company Settings) ----------
var COMPANY = { name: 'Your Company', address: 'Company address', phone: '0300 0000000' };

// ---------- Small helper functions ----------
function $(id) { return document.getElementById(id); }

function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}
function money(n) { return formatMoney(Math.round(n)); }
function num(n) { return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }); }

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

function toast(msg, type) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.toggle('error', type === 'error');
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2600);
}

// Show or clear the red message under a field
function setErr(id, msg) {
    var el = document.querySelector('[data-err="' + id + '"]');
    if (el) { el.textContent = msg || ''; }
    var input = $(id);
    if (input) { input.classList.toggle('is-invalid', !!msg); }
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
                var err = new Error(data.message || 'Request failed');
                err.errors = data.errors || {};
                throw err;
            }
            return data;
        });
    });
}

function firstError(e) {
    var keys = Object.keys(e.errors || {});
    return keys.length ? e.errors[keys[0]][0] : e.message;
}

// ---------- Data (comes from the database) ----------
var invoices = [];
var customersList = [];
var productsList = [];

var currentFilter = 'all';
var viewNo = null;
var payNo = null;
var delNo = null;
var menuNo = null;

function loadInvoices() {
    return api('GET', '/invoices/list').then(function (data) {
        invoices = data;
        renderAll();
    });
}

function loadCustomers() {
    return api('GET', '/customers/list').then(function (data) {
        customersList = data.filter(function (c) { return c.active; });
    });
}

function loadCompany() {
    return api('GET', '/company/info').then(function (data) {
        COMPANY.name = data.name || COMPANY.name;
        COMPANY.address = data.address || COMPANY.address;
        COMPANY.phone = data.phone || COMPANY.phone;
    });
}

// ---------- Products (for the item picker) ----------
function loadProducts() {
    return api('GET', '/inventory/options').then(function (data) {
        productsList = data;
        $('inv-products').innerHTML = data.map(function (p) {
            return '<option value="' + esc(p.name) + '" label="' + esc(num(p.stock) + ' ' + p.unit + ' in stock') + '"></option>';
        }).join('');
    });
}

function productByName(name) {
    var n = name.trim().toLowerCase();
    if (!n) return null;
    return productsList.filter(function (p) { return p.name.toLowerCase() === n; })[0] || null;
}

function syncRow(row, nameChanged) {
    var priceEl = row.querySelector('.it-price');
    var hint = row.querySelector('.it-stock');
    var p = productByName(row.querySelector('.it-name').value);

    if (!p) {
        delete row.dataset.product;
        hint.textContent = '';
        hint.className = 'it-stock';
        return;
    }

    row.dataset.product = p.id;

    if (nameChanged && (priceEl.value.trim() === '' || priceEl.value === row.dataset.auto)) {
        priceEl.value = p.sale;
        row.dataset.auto = String(p.sale);
    }

    var qty = parseFloat(row.querySelector('.it-qty').value) || 0;
    var price = parseFloat(priceEl.value);
    var text = num(p.stock) + ' ' + p.unit + ' in stock';
    var warn = false;

    if (qty > p.stock) { text = 'Only ' + num(p.stock) + ' ' + p.unit + ' in stock'; warn = true; }
    if (!isNaN(price) && price < p.cost) { text += ' - price is below cost (' + money(p.cost) + ')'; warn = true; }

    hint.textContent = text;
    hint.className = 'it-stock' + (warn ? ' warn' : '');
}

// ---------- Calculations ----------
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

// ---------- Invoice (bill) html ----------
function billInner(inv) {
    var t = totals(inv);
    var rows = '';
    inv.items.forEach(function (i) {
        rows += '<tr><td>' + esc(i.name || '-') + '</td><td class="r">' + i.qty + '</td><td class="r">' + money(i.price) + '</td><td class="r">' + money(i.qty * i.price) + '</td></tr>';
    });
    if (!rows) rows = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:18px;">Items will be shown here</td></tr>';

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
    if (!inv) return;
    if (typeof html2pdf === 'undefined') { toast('Internet is required for PDF', 'error'); return; }
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
    var sales = 0, count = 0;
    var recv = 0, recvCount = 0;
    var dueSum = 0, dueCount = 0;
    var lateSum = 0, lateCount = 0;

    invoices.forEach(function (inv) {
        var t = totals(inv);
        var n = daysUntil(inv.due);

        if (inv.date.slice(0, 7) === month) { sales += t.total; count++; }

        if (statusOf(inv) !== 'Paid') {
            recv += t.balance;
            recvCount++;

            if (n < 0) { lateSum += t.balance; lateCount++; }
            else if (n <= 7) { dueSum += t.balance; dueCount++; }
        }
    });

    $('sum-month').textContent = money(sales);
    $('sum-month-note').textContent = count + ' invoice(s) this month';
    $('sum-recv').textContent = money(recv);
    $('sum-recv-note').textContent = 'from ' + recvCount + ' invoice(s)';
    $('sum-week').textContent = money(dueSum);
    $('sum-week-note').textContent = dueCount + ' invoice(s) due in 7 days';
    $('sum-late').textContent = money(lateSum);
    $('sum-late-note').textContent = lateCount + ' invoice(s) late';
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
                '<button class="act" data-act="menu" title="Quick actions"><i class="fa-solid fa-ellipsis-vertical"></i></button>' +
            '</div></td></tr>';
    });

    if (!html) html = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px;">No invoice found.</td></tr>';
    $('inv-body').innerHTML = html;
}

function renderAll() {
    renderCards();
    renderTabs();
    renderTable();
}

// ---------- Three dots menu ----------
var menu = document.createElement('div');
menu.className = 'inv-menu';
menu.style.display = 'none';
document.body.appendChild(menu);

function menuItem(action, icon, label, extra) {
    return '<button type="button" class="inv-menu-item' + (extra ? ' ' + extra : '') + '" data-action="' + action + '">' +
        '<i class="' + icon + '"></i>' + label + '</button>';
}

function closeMenu() {
    menu.style.display = 'none';
    menuNo = null;
}

function openMenu(btn, inv) {
    var s = statusOf(inv);
    var html = menuItem('view', 'fa-regular fa-eye', 'View');
    html += menuItem('dl', 'fa-solid fa-download', 'Download PDF');
    if (s !== 'Paid') { html += menuItem('pay', 'fa-solid fa-money-bill-wave', 'Record Payment'); }
    if (s === 'Unpaid') {
        html += '<div class="inv-menu-sep"></div>' + menuItem('del', 'fa-regular fa-trash-can', 'Delete', 'danger');
    }

    menu.innerHTML = html;
    menu.style.display = 'block';
    menuNo = inv.no;

    var r = btn.getBoundingClientRect();
    var top = r.bottom + 6;
    if (top + menu.offsetHeight > window.innerHeight - 10) { top = r.top - menu.offsetHeight - 6; }
    var left = Math.max(10, r.right - menu.offsetWidth);

    menu.style.top = Math.max(10, top) + 'px';
    menu.style.left = left + 'px';
}

menu.addEventListener('click', function (e) {
    var el = e.target.closest('.inv-menu-item');
    if (!el) return;

    var action = el.dataset.action;
    var no = menuNo;
    closeMenu();
    if (!no) return;

    if (action === 'view') openView(no);
    else if (action === 'dl') downloadBill(findInv(no));
    else if (action === 'pay') openPay(no);
    else if (action === 'del') askDelete(no);
});

document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && !e.target.closest('button.act')) closeMenu();
});
window.addEventListener('scroll', closeMenu, true);
window.addEventListener('resize', closeMenu);

// ---------- View invoice ----------
function openView(no) {
    var inv = findInv(no);
    if (!inv) return;
    viewNo = no;
    $('view-bill').innerHTML = billInner(inv);
    $('view-pay').style.display = statusOf(inv) === 'Paid' ? 'none' : '';
    $('view-modal').classList.add('show');
}

// ---------- Record payment ----------
function openPay(no) {
    var inv = findInv(no);
    var t = totals(inv);
    payNo = no;
    $('pay-info').textContent = inv.no + ' - ' + inv.customer + ' | Balance: ' + money(t.balance);
    $('pay-amount').value = Math.round(t.balance);
    $('pay-date').value = iso(0);
    $('pay-error').textContent = '';
    $('pay-modal').classList.add('show');
    $('pay-amount').focus();
}

function savePay() {
    var inv = findInv(payNo);
    var t = totals(inv);
    var amount = parseFloat($('pay-amount').value) || 0;
    var date = $('pay-date').value;

    if (amount <= 0) { $('pay-error').textContent = 'Enter Amount.'; return; }
    if (amount > Math.round(t.balance)) { $('pay-error').textContent = 'Can not be more than balance.'; return; }
    if (!date) { $('pay-error').textContent = 'Choose the payment date.'; return; }
    if (date > iso(0)) { $('pay-error').textContent = 'Date cannot be in the future.'; return; }
    if (date < inv.date) { $('pay-error').textContent = 'Date cannot be before the invoice date (' + inv.date + ').'; return; }

    api('POST', '/invoices/' + encodeURIComponent(payNo) + '/pay', { amount: amount, date: date })
        .then(function () {
            $('pay-modal').classList.remove('show');
            toast('Payment is saved');
            return loadInvoices();
        })
        .then(function () {
            if ($('view-modal').classList.contains('show')) openView(payNo);
        })
        .catch(function (e) {
            $('pay-error').textContent = firstError(e) || 'Could not save the payment.';
        });
}

// ---------- Delete ----------
function askDelete(no) {
    delNo = no;
    $('del-text').textContent = no + ' will be removed. This cannot be undone.';
    $('del-modal').classList.add('show');
}

function confirmDelete() {
    var no = delNo;
    if (!no) return;

    api('DELETE', '/invoices/' + encodeURIComponent(no))
        .then(function () {
            $('del-modal').classList.remove('show');
            toast(no + ' deleted');
            loadInvoices();
        })
        .catch(function (e) {
            $('del-modal').classList.remove('show');
            toast(e.message || 'Could not delete the invoice', 'error');
        });
}

// ---------- New invoice ----------
function addItemRow() {
    var row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = '<input class="it-name" type="text" list="inv-products" placeholder="Item name" autocomplete="off">' +
        '<input class="it-qty" type="number" value="1" min="1">' +
        '<input class="it-price" type="number" placeholder="Price">' +
        '<button type="button" class="it-del"><i class="fa-solid fa-xmark"></i></button>' +
        '<small class="it-stock"></small>';
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

function selectedCustomerName() {
    var sel = $('n-customer');
    return sel.value ? sel.options[sel.selectedIndex].text : '-';
}

function draft() {
    return {
        no: nextNo(),
        customer: selectedCustomerName(),
        date: iso(0),
        due: $('n-due').value || iso(15),
        items: readItems().filter(function (i) { return i.name || i.price; }),
        discount: parseFloat($('n-discount').value) || 0,
        tax: parseFloat($('n-tax').value) || 0,
        paid: 0
    };
}

function updatePreview() { $('new-bill').innerHTML = billInner(draft()); }

var newErrIds = ['n-customer', 'n-due', 'items', 'n-discount', 'n-tax'];

function openNew() {
    var opts = '<option value="">Select customer</option>';
    customersList.forEach(function (c) { opts += '<option value="' + c.id + '">' + esc(c.name) + '</option>'; });
    $('n-customer').innerHTML = opts;
    $('n-due').value = iso(15);
    $('n-discount').value = 0;
    $('n-tax').value = 0;
    $('items').innerHTML = '';
    addItemRow();
    $('new-error').textContent = '';
    newErrIds.forEach(function (id) { setErr(id, ''); });
    updatePreview();
    $('new-modal').classList.add('show');
}

// Check everything. Returns the data if all is fine, otherwise null
function validateNew() {
    newErrIds.forEach(function (id) { setErr(id, ''); });
    document.querySelectorAll('#items .is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
    $('new-error').textContent = '';

    var ok = true;

    // Customer
    if (!$('n-customer').value) { setErr('n-customer', 'Select a customer'); ok = false; }

    // Due date
    var due = $('n-due').value;
    if (!due) { setErr('n-due', 'Choose the due date'); ok = false; }
    else if (due < iso(0)) { setErr('n-due', 'Due date cannot be before today'); ok = false; }

    // Items (completely empty rows are ignored, the rest are checked)
    var items = [];
    var itemMsg = '';
    document.querySelectorAll('#items .item-row').forEach(function (row) {
        var nameEl = row.querySelector('.it-name');
        var qtyEl = row.querySelector('.it-qty');
        var priceEl = row.querySelector('.it-price');
        var name = nameEl.value.trim();
        var priceRaw = priceEl.value.trim();

        if (!name && priceRaw === '') return;

        var qty = parseFloat(qtyEl.value);
        var price = parseFloat(priceRaw);

        if (!name) { nameEl.classList.add('is-invalid'); itemMsg = 'Every item needs a name'; }
        else if (isNaN(qty) || qty <= 0) { qtyEl.classList.add('is-invalid'); itemMsg = 'Quantity must be more than 0'; }
        else if (isNaN(price) || price <= 0) { priceEl.classList.add('is-invalid'); itemMsg = 'Enter a price more than 0 for "' + name + '"'; }
        else { items.push({ name: name, qty: qty, price: price, product_id: row.dataset.product ? Number(row.dataset.product) : null }); }
    });
    if (!itemMsg && !items.length) { itemMsg = 'Add at least one item'; }
    if (itemMsg) { setErr('items', itemMsg); ok = false; }

    // Discount
    var subtotal = items.reduce(function (s, i) { return s + i.qty * i.price; }, 0);
    var discRaw = $('n-discount').value.trim();
    var discount = discRaw === '' ? 0 : Number(discRaw);
    if (isNaN(discount) || discount < 0) { setErr('n-discount', 'Enter 0 or more'); ok = false; }
    else if (items.length && discount > subtotal) { setErr('n-discount', 'Discount cannot be more than the subtotal'); ok = false; }

    // Tax
    var taxRaw = $('n-tax').value.trim();
    var tax = taxRaw === '' ? 0 : Number(taxRaw);
    if (isNaN(tax) || tax < 0 || tax > 100) { setErr('n-tax', 'Enter a percentage between 0 and 100'); ok = false; }

    return ok ? { items: items, discount: discount, tax: tax, due: due } : null;
}

// Show the errors sent by the server under the right field
function showServerErrors(e) {
    var map = { customer_id: 'n-customer', due: 'n-due', discount: 'n-discount', tax: 'n-tax' };
    var shown = false;

    Object.keys(e.errors || {}).forEach(function (key) {
        var id = map[key] || (key.indexOf('items') === 0 ? 'items' : null);
        if (id) { setErr(id, e.errors[key][0]); shown = true; }
    });

    if (!shown) { $('new-error').textContent = e.message || 'Could not save the invoice.'; }
}

function saveNew() {
    var v = validateNew();
    if (!v) return;

    $('new-save').disabled = true;

    api('POST', '/invoices', {
        customer_id: $('n-customer').value,
        due: v.due,
        discount: v.discount,
        tax: v.tax,
        items: v.items
    })
        .then(function (res) {
            $('new-modal').classList.remove('show');
            toast(res.no + ' created');
            loadProducts();
            loadInvoices().then(function () { openView(res.no); });
        })
        .catch(showServerErrors)
        .then(function () { $('new-save').disabled = false; });
}

// ---------- Buttons and clicks ----------
$('open-new').addEventListener('click', openNew);
$('add-item').addEventListener('click', function () { addItemRow(); updatePreview(); });

function onFormEdit(e) {
    e.target.classList.remove('is-invalid');
    if (e.target.id) { setErr(e.target.id, ''); }
    if (e.target.closest('#items')) { setErr('items', ''); }

    var itemRow = e.target.closest('.item-row');
    if (itemRow && (e.target.classList.contains('it-name') || e.target.classList.contains('it-qty') || e.target.classList.contains('it-price'))) {
        syncRow(itemRow, e.target.classList.contains('it-name'));
    }

    updatePreview();
}
$('new-form').addEventListener('input', onFormEdit);
$('new-form').addEventListener('change', onFormEdit);
$('new-form').addEventListener('click', function (e) {
    if (e.target.closest('.it-del')) {
        var rows = document.querySelectorAll('#items .item-row');
        if (rows.length > 1) { e.target.closest('.item-row').remove(); updatePreview(); }
    }
});

$('new-save').addEventListener('click', saveNew);
$('new-close').addEventListener('click', function () { $('new-modal').classList.remove('show'); });
$('new-cancel').addEventListener('click', function () { $('new-modal').classList.remove('show'); });

$('view-close').addEventListener('click', function () { $('view-modal').classList.remove('show'); });
$('view-dl').addEventListener('click', function () { downloadBill(findInv(viewNo)); });
$('view-pay').addEventListener('click', function () { openPay(viewNo); });

$('pay-save').addEventListener('click', savePay);
$('pay-close').addEventListener('click', function () { $('pay-modal').classList.remove('show'); });
$('pay-cancel').addEventListener('click', function () { $('pay-modal').classList.remove('show'); });

$('del-ok').addEventListener('click', confirmDelete);
$('del-close').addEventListener('click', function () { $('del-modal').classList.remove('show'); });
$('del-cancel').addEventListener('click', function () { $('del-modal').classList.remove('show'); });

['new-modal', 'view-modal', 'pay-modal', 'del-modal'].forEach(function (id) {
    $(id).addEventListener('click', function (e) { if (e.target === $(id)) $(id).classList.remove('show'); });
});

$('inv-body').addEventListener('click', function (e) {
    var row = e.target.closest('tr');
    if (!row || !row.dataset.no) return;

    var btn = e.target.closest('button.act');
    if (btn) {
        if (menuNo === row.dataset.no && menu.style.display === 'block') { closeMenu(); }
        else { openMenu(btn, findInv(row.dataset.no)); }
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
        closeMenu();
        ['new-modal', 'view-modal', 'pay-modal', 'del-modal'].forEach(function (id) { $(id).classList.remove('show'); });
    }
});

// ---------- Load the data when the page opens ----------
loadCustomers();
loadInvoices();
loadCompany();
loadProducts();

// ---------- Customer chosen on the Customers page ----------
(function () {
    var wanted = new URLSearchParams(window.location.search).get('customer');
    if (!wanted) { return; }

    loadCustomers().then(function () {
        openNew();
        $('n-customer').value = wanted;
        updatePreview();
        window.history.replaceState(null, '', '/invoices');
    });
})();