var customers = [];

var nextId = 7;
var currentFilter = 'all';
var editingId = null;
var openId = null;
var menuId = null;
var avatarColors = ['#0f766e', '#6d28d9', '#c2410c', '#be123c', '#1d4ed8', '#0e7490'];

// ---------- Chhote helper functions ----------
function $(id) { return document.getElementById(id); }

function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function money(n) { return formatMoney(Math.abs(n)); }

// Balance = opening + debit - credit. Plus = receivable, minus = payable
function balanceOf(c) {
    var b = c.opening;
    c.ledger.forEach(function (e) { b += e.debit - e.credit; });
    return b;
}

function usedPercent(c) {
    var b = balanceOf(c);
    if (b <= 0 || !c.limit) return 0;
    return Math.round((b / c.limit) * 100);
}

function isOverLimit(c) { return c.limit > 0 && balanceOf(c) > c.limit; }

function findCustomer(id) {
    return customers.find(function (x) { return x.id === id; });
}

function avatarOf(c, big) {
    var color = avatarColors[c.id % avatarColors.length];
    return '<div class="avatar' + (big ? ' big' : '') + '" style="background:' + color + '">' + esc(c.name.charAt(0).toUpperCase()) + '</div>';
}

function statusBadge(c) {
    if (!c.active) return '<span class="badge b-grey">Inactive</span>';
    if (isOverLimit(c)) return '<span class="badge b-amber">Over limit</span>';
    var b = balanceOf(c);
    if (b > 0) return '<span class="badge b-red">Receivable</span>';
    if (b < 0) return '<span class="badge b-green">Payable</span>';
    return '<span class="badge b-green">Clear</span>';
}

function balanceHtml(c) {
    var b = balanceOf(c);
    if (b > 0) return '<span class="bal t-red">' + money(b) + '<small>they owe us</small></span>';
    if (b < 0) return '<span class="bal t-green">' + money(b) + '<small>we owe them</small></span>';
    return '<span class="bal">' + money(0) + '<small>all clear</small></span>';
}

function waLink(c) {
    var num = (c.whatsapp || c.phone).replace(/\D/g, '');
    if (num.charAt(0) === '0') num = '92' + num.slice(1);
    return 'https://wa.me/' + num;
}

function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2200);
}

// ---------- Summary cards ----------
function renderCards() {
    var active = customers.filter(function (c) { return c.active; });
    var recv = 0, pay = 0, over = 0;
    active.forEach(function (c) {
        var b = balanceOf(c);
        if (b > 0) recv += b;
        if (b < 0) pay += Math.abs(b);
        if (isOverLimit(c)) over++;
    });
    $('sum-total').textContent = active.length;
    $('sum-recv').textContent = money(recv);
    $('sum-pay').textContent = money(pay);
    $('sum-over').textContent = over;
}

// ---------- Table ----------
function visibleCustomers() {
    var q = $('search-box').value.trim().toLowerCase();
    return customers.filter(function (c) {
        var b = balanceOf(c);
        if (currentFilter === 'inactive' && c.active) return false;
        if (currentFilter !== 'inactive' && !c.active) return false;
        if (currentFilter === 'receivable' && b <= 0) return false;
        if (currentFilter === 'payable' && b >= 0) return false;
        if (q) {
            var hay = (c.name + ' ' + c.phone + ' ' + c.city).toLowerCase();
            if (hay.indexOf(q) === -1) return false;
        }
        return true;
    });
}

function renderTable() {
    var list = visibleCustomers();
    var html = '';

    list.forEach(function (c) {
        var pct = usedPercent(c);
        var fill = pct >= 90 ? 'f-bad' : (pct >= 60 ? 'f-warn' : 'f-ok');
        html += '<tr data-id="' + c.id + '" class="' + (c.active ? '' : 'is-inactive') + '">' +
            '<td><div class="who">' + avatarOf(c) + '<div><div class="who-name">' + esc(c.name) + '</div><div class="who-city">' + esc(c.city) + '</div></div></div></td>' +
            '<td>' + esc(c.phone) + '</td>' +
            '<td>' + balanceHtml(c) + '</td>' +
            '<td><div class="limit-bar"><div class="limit-fill ' + fill + '" style="width:' + Math.min(pct, 100) + '%"></div></div>' +
                '<div class="limit-text">' + (c.limit ? pct + '% of ' + money(c.limit) : 'No limit set') + '</div></td>' +
            '<td>' + statusBadge(c) + '</td>' +
            '<td><div class="acts">' +
                '<button class="act" data-act="menu" title="More actions"><i class="fa-solid fa-ellipsis-vertical"></i></button>' +
            '</div></td></tr>';
    });

    $('cust-body').innerHTML = html;
    $('cust-empty').style.display = list.length ? 'none' : 'block';
    document.querySelector('.table-wrap').style.display = list.length ? '' : 'none';
}

function renderAll() {
    renderCards();
    renderTable();
    if (openId) openPanel(openId, true);
}

// ---------- 3 dots ka menu ----------
var menu = document.createElement('div');
menu.className = 'cust-menu';
menu.style.display = 'none';
document.body.appendChild(menu);

function menuButton(action, icon, label) {
    return '<button type="button" class="cust-menu-item" data-action="' + action + '"><i class="' + icon + '"></i>' + label + '</button>';
}

function menuLink(href, icon, label, newTab) {
    return '<a class="cust-menu-item" href="' + href + '"' + (newTab ? ' target="_blank" rel="noopener"' : '') + '><i class="' + icon + '"></i>' + label + '</a>';
}

function closeMenu() {
    menu.style.display = 'none';
    menuId = null;
}

function openMenu(btn, c) {
    var html = '';
    html += menuButton('invoice', 'fa-solid fa-file-invoice', 'Create Invoice');
    html += menuButton('payment', 'fa-solid fa-money-bill-wave', 'Receive Payment');
    html += '<div class="cust-menu-sep"></div>';
    html += menuLink(waLink(c), 'fa-brands fa-whatsapp', 'WhatsApp', true);
    html += menuLink('tel:' + c.phone.replace(/\s/g, ''), 'fa-solid fa-phone', 'Call');
    html += '<div class="cust-menu-sep"></div>';
    html += menuButton('edit', 'fa-solid fa-pen', 'Edit');
    html += menuButton('toggle', c.active ? 'fa-solid fa-user-slash' : 'fa-solid fa-user-check', c.active ? 'Make inactive' : 'Make active');

    menu.innerHTML = html;
    menu.style.display = 'block';
    menuId = c.id;

    var r = btn.getBoundingClientRect();
    var mh = menu.offsetHeight;
    var mw = menu.offsetWidth;
    var top = r.bottom + 6;
    if (top + mh > window.innerHeight - 10) top = r.top - mh - 6;
    var left = r.right - mw;
    if (left < 10) left = 10;

    menu.style.top = Math.max(10, top) + 'px';
    menu.style.left = left + 'px';
}

menu.addEventListener('click', function (e) {
    var item = e.target.closest('.cust-menu-item');
    if (!item) return;

    var action = item.getAttribute('data-action');
    var c = findCustomer(menuId);
    closeMenu();

    if (!action || !c) return; // WhatsApp / Call links khud khulte hain

    if (action === 'edit') openModal(c.id);
    else if (action === 'toggle') {
        var newState = !c.active;
        fetch('/customers/' + c.id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({ active: newState })
        })
        .then(function (res) {
            if (!res.ok) throw new Error('failed');
            toast(newState ? 'Customer is activated' : 'Customer is inactivated');
            loadCustomers();
        })
        .catch(function () {
            toast('Could not change status');
        });
    }
     else placeholderAction(action);
});

document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && !e.target.closest('[data-act="menu"]')) closeMenu();
});
window.addEventListener('scroll', closeMenu, true);
window.addEventListener('resize', closeMenu);

// ---------- Detail panel ----------
function openPanel(id, keepTab) {
    var c = findCustomer(id);
    if (!c) return;
    openId = id;

    var activeTab = 'profile';
    if (keepTab) {
        var cur = document.querySelector('.p-tab.active');
        if (cur) activeTab = cur.dataset.pane;
    }

    var b = balanceOf(c);
    var pct = usedPercent(c);

    // Ledger rows
    var running = c.opening;
    var ledgerRows = '';
    if (c.opening !== 0) {
        ledgerRows += '<tr><td>-</td><td>Opening balance</td><td class="r">-</td><td class="r">-</td><td class="r">' + money(running) + (running < 0 ? ' Cr' : '') + '</td></tr>';
    }
    c.ledger.forEach(function (e) {
        running += e.debit - e.credit;
        ledgerRows += '<tr><td>' + esc(e.date) + '</td><td>' + esc(e.desc) + '</td>' +
            '<td class="r">' + (e.debit ? money(e.debit) : '-') + '</td>' +
            '<td class="r">' + (e.credit ? money(e.credit) : '-') + '</td>' +
            '<td class="r">' + money(running) + (running < 0 ? ' Cr' : '') + '</td></tr>';
    });
    if (!ledgerRows) ledgerRows = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;">Abhi koi entry nahi.</td></tr>';

    // Invoice rows
    var invRows = '';
    c.invoices.forEach(function (i) {
        var cls = i.status === 'Paid' ? 'b-green' : (i.status === 'Partial' ? 'b-amber' : 'b-red');
        invRows += '<tr><td>' + esc(i.no) + '</td><td>' + esc(i.date) + '</td><td class="r">' + money(i.amount) + '</td><td class="r"><span class="badge ' + cls + '">' + i.status + '</span></td></tr>';
    });
    if (!invRows) invRows = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px;">Abhi koi invoice nahi.</td></tr>';

    $('panel-body').innerHTML =
        '<div class="p-head">' + avatarOf(c, true) +
            '<div><div class="p-name">' + esc(c.name) + '</div>' + statusBadge(c) + '</div>' +
            '<button class="icon-x p-close" id="panel-close"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="p-cards">' +
            '<div class="p-card"><span>Receivable</span><b class="t-red">' + (b > 0 ? money(b) : money(0)) + '</b></div>' +
            '<div class="p-card"><span>Payable</span><b class="t-green">' + (b < 0 ? money(b) : money(0)) + '</b></div>' +
            '<div class="p-card"><span>Limit used</span><b>' + (c.limit ? pct + '%' : '-') + '</b></div>' +
        '</div>' +
        '<div class="p-tabs">' +
            '<button class="p-tab" data-pane="profile">Profile</button>' +
            '<button class="p-tab" data-pane="ledger">Ledger</button>' +
            '<button class="p-tab" data-pane="invoices">Invoices</button>' +
        '</div>' +
        '<div class="p-body">' +
            '<div class="p-pane" id="pane-profile">' +
                '<div class="info-row"><span>Phone</span><b>' + esc(c.phone) + '</b></div>' +
                '<div class="info-row"><span>WhatsApp</span><b>' + esc(c.whatsapp || c.phone) + '</b></div>' +
                '<div class="info-row"><span>Email</span><b>' + esc(c.email || '-') + '</b></div>' +
                '<div class="info-row"><span>City</span><b>' + esc(c.city || '-') + '</b></div>' +
                '<div class="info-row"><span>Address</span><b>' + esc(c.address || '-') + '</b></div>' +
                '<div class="info-row"><span>Credit limit</span><b>' + (c.limit ? money(c.limit) : 'Not set') + '</b></div>' +
                '<div class="info-row"><span>Notes</span><b>' + esc(c.notes || '-') + '</b></div>' +
            '</div>' +
            '<div class="p-pane" id="pane-ledger">' +
                '<table class="mini-table"><thead><tr><th>Date</th><th>Details</th><th class="r">Debit</th><th class="r">Credit</th><th class="r">Balance</th></tr></thead><tbody>' + ledgerRows + '</tbody></table>' +
                '<p style="font-size:11px;color:var(--muted);margin-top:10px;">Debit = bill banaya, Credit = paisa mila ya wapsi. Cr = humne dena hai.</p>' +
            '</div>' +
            '<div class="p-pane" id="pane-invoices">' +
                '<table class="mini-table"><thead><tr><th>No</th><th>Date</th><th class="r">Amount</th><th class="r">Status</th></tr></thead><tbody>' + invRows + '</tbody></table>' +
            '</div>' +
        '</div>' +
        '<div class="p-foot">' +
            '<button class="btn-main" data-pact="invoice"><i class="fa-solid fa-file-invoice"></i> Create Invoice</button>' +
            '<button class="btn-ghost" data-pact="payment"><i class="fa-solid fa-money-bill-wave"></i> Receive Payment</button>' +
            '<a class="btn-ghost" href="' + waLink(c) + '" target="_blank"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>' +
            '<button class="btn-ghost" data-pact="statement"><i class="fa-solid fa-print"></i> Statement</button>' +
        '</div>';

    showTab(activeTab);
    $('panel').classList.add('show');
    $('overlay').classList.add('show');
}

function showTab(name) {
    document.querySelectorAll('.p-tab').forEach(function (t) { t.classList.toggle('active', t.dataset.pane === name); });
    document.querySelectorAll('.p-pane').forEach(function (p) { p.classList.toggle('active', p.id === 'pane-' + name); });
}

function closePanel() {
    openId = null;
    $('panel').classList.remove('show');
    $('overlay').classList.remove('show');
}

// ---------- Add / Edit popup ----------
function openModal(id) {
    editingId = id || null;
    $('form-error').textContent = '';
    var c = id ? findCustomer(id) : null;

    $('modal-title').textContent = c ? 'Edit Customer' : 'Add Customer';
    $('f-name').value = c ? c.name : '';
    $('f-phone').value = c ? c.phone : '';
    $('f-whatsapp').value = c ? c.whatsapp : '';
    $('f-email').value = c ? c.email : '';
    $('f-city').value = c ? c.city : '';
    $('f-address').value = c ? c.address : '';
    $('f-limit').value = c ? c.limit : '';
    $('f-opening').value = c ? Math.abs(c.opening) : '';
    $('f-type').value = c && c.opening < 0 ? 'payable' : 'receivable';
    $('f-notes').value = c ? c.notes : '';

    $('modal').classList.add('show');
    $('f-name').focus();
}
function closeModal() { $('modal').classList.remove('show'); }

function saveCustomer() {
    var name = $('f-name').value.trim();
    var phone = $('f-phone').value.trim();
    if (!name || !phone) {
        $('form-error').textContent = 'Name and phone number is compulsory.';
        return;
    }

    var amount = Math.abs(parseFloat($('f-opening').value) || 0);
    var opening = $('f-type').value === 'payable' ? -amount : amount;

    var data = {
        name: name, phone: phone,
        whatsapp: $('f-whatsapp').value.trim(),
        email: $('f-email').value.trim(),
        city: $('f-city').value.trim(),
        address: $('f-address').value.trim(),
        limit: parseFloat($('f-limit').value) || 0,
        opening: opening,
        notes: $('f-notes').value.trim()
    };

    if (editingId) {
        fetch('/customers/' + editingId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify(data)
        })
        .then(function (res) {
            if (!res.ok) throw new Error('update failed');
            return res.json();
        })
        .then(function () {
            toast('Customer is updated');
            closeModal();
            loadCustomers();
        })
        .catch(function () {
            $('form-error').textContent = 'Could not update. Please check the details.';
        });
    } else {
        fetch('/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify(data)
        })
        .then(function (res) {
            if (!res.ok) throw new Error('save failed');
            return res.json();
        })
        .then(function () {
            toast('New customer added');
            closeModal();
            loadCustomers();
        })
        .catch(function () {
            $('form-error').textContent = 'Could not save. Please check the details.';
        });
    }
}

// ---------- Buttons aur clicks ----------
function placeholderAction(kind) {
    if (kind === 'invoice') toast('Invoice Invoices page se banega (abhi jura nahi)');
    if (kind === 'payment') toast('Payment ka form baad mein jurega');
    if (kind === 'statement') toast('Statement print baad mein jurega');
}

$('cust-body').addEventListener('click', function (e) {
    var row = e.target.closest('tr');
    if (!row) return;
    var id = parseInt(row.dataset.id, 10);

    var btn = e.target.closest('button.act');
    if (btn) {
        if (menuId === id && menu.style.display === 'block') closeMenu();
        else openMenu(btn, findCustomer(id));
        return;
    }
    openPanel(id);
});

$('panel').addEventListener('click', function (e) {
    if (e.target.closest('#panel-close')) closePanel();
    var tab = e.target.closest('.p-tab');
    if (tab) showTab(tab.dataset.pane);
    var pa = e.target.closest('[data-pact]');
    if (pa) placeholderAction(pa.dataset.pact);
});

$('overlay').addEventListener('click', closePanel);
$('open-add').addEventListener('click', function () { openModal(); });
$('empty-add').addEventListener('click', function () { openModal(); });
$('modal-close').addEventListener('click', closeModal);
$('modal-cancel').addEventListener('click', closeModal);
$('modal-save').addEventListener('click', saveCustomer);
$('modal').addEventListener('click', function (e) { if (e.target === $('modal')) closeModal(); });
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
    if (e.key === 'Escape') { closeMenu(); closeModal(); closePanel(); }
});

function loadCustomers() {
    fetch('/customers/list')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            customers = data;
            renderAll();
        });
}

loadCustomers();