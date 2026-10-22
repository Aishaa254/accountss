(function () {
    // ---------- Chhote helpers ----------
    function $(id) { return document.getElementById(id); }

    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function toStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function parse(s) { var p = s.split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
    function todayStr() { return toStr(new Date()); }
    function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return toStr(d); }
    function diffDays(a, b) { return Math.round((parse(a) - parse(b)) / 86400000); }
    function fmt(s) { return parse(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    function round2(n) { return Math.round(n * 100) / 100; }

    function money(n) {
        return formatMoney(n);
    }

    function esc(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ---------- Laravel se baat karne wala helper ----------
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

    // ---------- Data (ab database se aata hai) ----------
    var purchases = [];
    var vendorsData = [];

    function vendorNames() {
        return vendorsData.map(function (v) { return v.name; });
    }

    function loadPurchases() {
        return api('GET', '/purchases/list').then(function (data) {
            purchases = data;
            render();
        });
    }

    function loadVendors() {
        return api('GET', '/vendors/list').then(function (data) {
            vendorsData = data.filter(function (v) { return v.status === 'active'; });
            fillVendorSelect();
            render();
        });
    }

    var state = { filter: 'all', search: '', sort: 'new' };
    var openId = null;
    var current = null;
    var editingId = null;
    var payingId = null;
    var deleteId = null;
    var dueTouched = false;

    function find(id) {
        return purchases.filter(function (p) { return p.id === id; })[0];
    }

    // ---------- Hisaab ----------
    function calc(p) {
        var total = round2(p.items.reduce(function (s, i) { return s + i.qty * i.price; }, 0));
        var paid = round2(p.payments.reduce(function (s, x) { return s + x.amount; }, 0));
        var balance = round2(Math.max(0, total - paid));
        var daysLeft = diffDays(p.due, todayStr());

        return {
            total: total,
            paid: paid,
            balance: balance,
            status: balance <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid'),
            daysLeft: daysLeft,
            overdue: balance > 0 && daysLeft < 0
        };
    }

    function avatarClass(vendor) {
        return 'vd-av-' + ((Math.max(0, vendorNames().indexOf(vendor)) % 5) + 1);
    }

    function dueNote(c) {
        if (c.balance <= 0) { return { text: 'Fully paid', red: false }; }
        if (c.daysLeft < 0) { return { text: 'Overdue by ' + Math.abs(c.daysLeft) + ' days', red: true }; }
        if (c.daysLeft === 0) { return { text: 'Due today', red: false }; }
        return { text: 'Due in ' + c.daysLeft + ' days', red: false };
    }

    function toast(message, type) {
        var t = $('puToast');
        t.textContent = message;
        t.className = 'vd-toast show ' + (type || 'ok');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(function () { t.className = 'vd-toast'; }, 2600);
    }

    // ---------- Popups ----------
    function openModal(id) { $(id).classList.add('open'); }
    function closeModal(id) { $(id).classList.remove('open'); }

    function setErr(id, msg) {
        var el = document.querySelector('[data-err="' + id + '"]');
        if (el) { el.textContent = msg || ''; }
        var input = $(id);
        if (input) { input.classList.toggle('vd-invalid', !!msg); }
    }

    function clearErrs(ids) {
        ids.forEach(function (id) { setErr(id, ''); });
    }

    // ---------- Cards ----------
    function updateCards() {
        var thisMonth = todayStr().slice(0, 7);
        var month = purchases.filter(function (p) { return p.date.slice(0, 7) === thisMonth; });
        var monthAmount = month.reduce(function (s, p) { return s + calc(p).total; }, 0);

        var withBalance = purchases.filter(function (p) { return calc(p).balance > 0; });
        var payable = withBalance.reduce(function (s, p) { return s + calc(p).balance; }, 0);

        var dueSoon = purchases.filter(function (p) {
            var c = calc(p);
            return c.balance > 0 && c.daysLeft >= 0 && c.daysLeft <= 7;
        });
        var dueAmount = dueSoon.reduce(function (s, p) { return s + calc(p).balance; }, 0);

        var late = purchases.filter(function (p) { return calc(p).overdue; });
        var lateAmount = late.reduce(function (s, p) { return s + calc(p).balance; }, 0);

        $('cdMonth').textContent = money(monthAmount);
        $('cdMonthNote').textContent = month.length + ' purchase(s)';
        $('cdPayable').textContent = money(payable);
        $('cdPayableNote').textContent = 'across ' + withBalance.length + ' purchase(s)';
        $('cdDue').textContent = money(dueAmount);
        $('cdDueNote').textContent = dueSoon.length + ' purchase(s) due';
        $('cdOverdue').textContent = money(lateAmount);
        $('cdOverdueNote').textContent = late.length + ' purchase(s) late';

        $('cAll').textContent = purchases.length;
        $('cUnpaid').textContent = purchases.filter(function (p) { return calc(p).status === 'Unpaid'; }).length;
        $('cPartial').textContent = purchases.filter(function (p) { return calc(p).status === 'Partial'; }).length;
        $('cPaid').textContent = purchases.filter(function (p) { return calc(p).status === 'Paid'; }).length;
        $('cOverdue').textContent = late.length;
    }

    // ---------- List ----------
    function getFiltered() {
        var q = state.search.trim().toLowerCase();

        var list = purchases.filter(function (p) {
            var c = calc(p);
            if (state.filter === 'overdue') {
                if (!c.overdue) { return false; }
            } else if (state.filter !== 'all' && c.status !== state.filter) {
                return false;
            }
            if (q && (p.no + ' ' + p.vendor).toLowerCase().indexOf(q) === -1) { return false; }
            return true;
        });

        list.sort(function (a, b) {
            if (state.sort === 'amount') { return calc(b).total - calc(a).total; }
            if (a.date !== b.date) { return a.date < b.date ? 1 : -1; }
            return b.id - a.id;
        });

        return list;
    }

    function rowHtml(p) {
        var c = calc(p);
        var pct = c.total > 0 ? Math.round((c.paid / c.total) * 100) : 0;
        var note = dueNote(c);

        return '<tr>' +
            '<td><div class="pu-po">' + esc(p.no) + '</div>' +
                '<div class="pu-sub">' + p.items.length + ' item(s)</div></td>' +
            '<td><div class="vd-vendor">' +
                '<span class="vd-avatar ' + avatarClass(p.vendor) + '">' + esc(p.vendor.charAt(0).toUpperCase()) + '</span>' +
                '<div class="vd-name">' + esc(p.vendor) + '</div>' +
            '</div></td>' +
            '<td>' + fmt(p.date) + '</td>' +
            '<td><div>' + fmt(p.due) + '</div>' +
                '<div class="pu-sub' + (note.red ? ' vd-red' : '') + '">' + esc(note.text) + '</div></td>' +
            '<td><div class="vd-amount">' + money(c.total) + '</div></td>' +
            '<td>' +
                '<div class="vd-bar' + (c.overdue ? ' vd-bar-red' : '') + '"><span style="width:' + pct + '%"></span></div>' +
                '<div class="vd-bar-note">' + money(c.paid) + ' paid</div>' +
            '</td>' +
            '<td><span class="vd-badge pu-badge-' + c.status.toLowerCase() + '">' + c.status + '</span></td>' +
            '<td class="vd-actions"><button type="button" class="vd-dots" data-id="' + p.id + '"><i class="fa-solid fa-ellipsis-vertical"></i></button></td>' +
        '</tr>';
    }

    function render() {
        var list = getFiltered();

        $('puRows').innerHTML = list.length
            ? list.map(rowHtml).join('')
            : '<tr class="vd-empty"><td colspan="8"><i class="fa-regular fa-folder-open"></i>No purchases found</td></tr>';

        updateCards();
    }

    // ---------- Teen nuqton ka dropdown ----------
    var menu = document.createElement('div');
    menu.className = 'vd-menu';
    menu.style.display = 'none';
    document.body.appendChild(menu);

    function item(action, icon, label, extra) {
        return '<button type="button" class="vd-menu-item' + (extra ? ' ' + extra : '') + '" data-action="' + action + '">' +
            '<i class="' + icon + '"></i>' + label + '</button>';
    }

    function closeMenu() {
        menu.style.display = 'none';
        openId = null;
    }

    function openMenu(btn, p) {
        var html = item('view', 'fa-regular fa-eye', 'View Details');
        if (calc(p).balance > 0) { html += item('pay', 'fa-solid fa-money-bill-wave', 'Record Payment'); }
        html += item('edit', 'fa-regular fa-pen-to-square', 'Edit');
        html += '<div class="vd-menu-sep"></div>';
        html += item('delete', 'fa-regular fa-trash-can', 'Delete', 'vd-danger');

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

    $('puRows').addEventListener('click', function (e) {
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
        else if (action === 'pay') { openPay(p); }
        else if (action === 'edit') { openForm(p); }
        else if (action === 'delete') { askDelete(p); }
    });

    document.addEventListener('click', function (e) {
        if (!menu.contains(e.target) && !e.target.closest('.vd-dots')) { closeMenu(); }
    });
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);

    // ---------- Detail panel ----------
    var side = $('puSide');
    var overlay = $('puOverlay');

    function panelHtml(p) {
        var c = calc(p);
        var pct = c.total > 0 ? Math.round((c.paid / c.total) * 100) : 0;
        var note = dueNote(c);

        var itemRows = p.items.map(function (i) {
            return '<tr><td>' + esc(i.desc) + '</td><td class="r">' + i.qty + '</td>' +
                '<td class="r">' + money(i.price) + '</td><td class="r">' + money(i.qty * i.price) + '</td></tr>';
        }).join('');

        var payRows = p.payments.length
            ? p.payments.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (x) {
                return '<div class="vd-item">' +
                    '<div><div class="vd-item-main">' + esc(x.method) + '</div>' +
                    '<div class="vd-item-sub">' + fmt(x.date) + '</div></div>' +
                    '<div class="vd-item-right"><div class="vd-item-main vd-green">' + money(x.amount) + '</div></div>' +
                '</div>';
            }).join('')
            : '<div class="vd-none">No payments yet</div>';

        return '' +
            '<div class="pu-head-row">' +
                '<div><div class="pu-head-no">' + esc(p.no) + '</div>' +
                '<div class="vd-company">' + esc(p.vendor) + '</div></div>' +
                '<div><span class="vd-badge pu-badge-' + c.status.toLowerCase() + '">' + c.status + '</span>' +
                (c.overdue ? '<div class="pu-late-tag">Overdue</div>' : '') + '</div>' +
            '</div>' +

            '<div class="vd-balance' + (c.overdue ? ' vd-balance-late' : '') + '">' +
                '<div class="vd-balance-label">Balance to pay</div>' +
                '<div class="vd-balance-amount' + (c.overdue ? ' vd-red' : '') + '">' + money(c.balance) + '</div>' +
                '<div class="vd-bar vd-bar-wide' + (c.overdue ? ' vd-bar-red' : '') + '"><span style="width:' + pct + '%"></span></div>' +
                '<div class="vd-balance-row"><span>' + money(c.paid) + ' paid</span><span>of ' + money(c.total) + '</span></div>' +
                '<div class="vd-balance-due' + (note.red ? ' vd-red' : '') + '">' + esc(note.text) + '</div>' +
            '</div>' +

            '<div class="pu-meta">' +
                '<div class="pu-meta-box"><span>Purchase date</span><b>' + fmt(p.date) + '</b></div>' +
                '<div class="pu-meta-box"><span>Due date</span><b>' + fmt(p.due) + '</b></div>' +
            '</div>' +

            '<h4 class="vd-sec">Items</h4>' +
            '<table class="pu-dtable"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead>' +
            '<tbody>' + itemRows + '</tbody></table>' +
            '<div class="pu-sum"><span>Total</span><span>' + money(c.total) + '</span></div>' +

            '<h4 class="vd-sec">Payment History</h4>' +
            '<div class="vd-list">' + payRows + '</div>' +

            (p.notes ? '<h4 class="vd-sec">Notes</h4><div class="pu-note-box">' + esc(p.notes) + '</div>' : '');
    }

    function openDetail(p) {
        current = p;
        $('puSideBody').innerHTML = panelHtml(p);
        $('puSideBody').scrollTop = 0;
        $('puPayBtn').style.display = calc(p).balance > 0 ? '' : 'none';

        side.classList.add('open');
        overlay.classList.add('open');
        side.setAttribute('aria-hidden', 'false');
    }

    function closeDetail() {
        side.classList.remove('open');
        overlay.classList.remove('open');
        side.setAttribute('aria-hidden', 'true');
    }

    $('puClose').addEventListener('click', closeDetail);
    overlay.addEventListener('click', closeDetail);

    $('puEditBtn').addEventListener('click', function () {
        if (!current) { return; }
        closeDetail();
        openForm(current);
    });

    $('puPayBtn').addEventListener('click', function () {
        if (!current) { return; }
        closeDetail();
        openPay(current);
    });

    // ---------- New / Edit form ----------
    var formIds = ['pfVendor', 'pfDate', 'pfDue', 'pfItems'];

    function fillVendorSelect() {
        $('pfVendor').innerHTML = '<option value="">Select vendor</option>' + vendorsData.map(function (v) {
            return '<option value="' + v.id + '">' + esc(v.name) + '</option>';
        }).join('');
    }

    function addItemRow(it) {
        var row = document.createElement('div');
        row.className = 'pu-item-row';
        row.innerHTML =
            '<input type="text" class="vd-input pu-desc" placeholder="Item description" maxlength="80">' +
            '<input type="number" class="vd-input pu-qty" min="0" step="any" placeholder="Qty">' +
            '<input type="number" class="vd-input pu-price" min="0" step="any" placeholder="Price">' +
            '<div class="pu-line-total">' + money(0) + '</div>' +
            '<button type="button" class="pu-rm" title="Remove"><i class="fa-regular fa-trash-can"></i></button>';

        if (it) {
            row.querySelector('.pu-desc').value = it.desc;
            row.querySelector('.pu-qty').value = it.qty;
            row.querySelector('.pu-price').value = it.price;
        }
        $('pfItemRows').appendChild(row);
    }

    function readRows() {
        return Array.prototype.map.call(document.querySelectorAll('#pfItemRows .pu-item-row'), function (row) {
            return {
                row: row,
                desc: row.querySelector('.pu-desc').value.trim(),
                qtyRaw: row.querySelector('.pu-qty').value.trim(),
                priceRaw: row.querySelector('.pu-price').value.trim()
            };
        });
    }

    function recalcForm() {
        var total = 0;

        readRows().forEach(function (r) {
            var qty = parseFloat(r.qtyRaw);
            var price = parseFloat(r.priceRaw);
            var line = (isNaN(qty) || isNaN(price)) ? 0 : qty * price;
            total += line;
            r.row.querySelector('.pu-line-total').textContent = money(line);
        });

        $('pfTotal').textContent = money(round2(total));
    }

    function openForm(p) {
        editingId = p ? p.id : null;
        dueTouched = !!p;
        clearErrs(formIds);

        $('pfTitle').textContent = p ? 'Edit ' + p.no : 'New Purchase';
        $('pfSave').textContent = p ? 'Save Changes' : 'Save Purchase';

        $('pfVendor').value = p ? String(p.vendor_id) : '';
        $('pfDate').value = p ? p.date : todayStr();
        $('pfDue').value = p ? p.due : addDays(todayStr(), 30);
        $('pfNotes').value = p ? p.notes : '';

        $('pfItemRows').innerHTML = '';
        if (p) { p.items.forEach(addItemRow); } else { addItemRow(); }

        recalcForm();
        openModal('puFormModal');
    }

    $('pfItemRows').addEventListener('input', recalcForm);

    $('pfItemRows').addEventListener('click', function (e) {
        var rm = e.target.closest('.pu-rm');
        if (!rm) { return; }

        var row = rm.closest('.pu-item-row');
        if (document.querySelectorAll('#pfItemRows .pu-item-row').length > 1) {
            row.remove();
        } else {
            row.querySelector('.pu-desc').value = '';
            row.querySelector('.pu-qty').value = '';
            row.querySelector('.pu-price').value = '';
        }
        recalcForm();
    });

    $('pfAddItem').addEventListener('click', function () {
        addItemRow();
        var rows = document.querySelectorAll('#pfItemRows .pu-item-row');
        rows[rows.length - 1].querySelector('.pu-desc').focus();
    });

    // Purchase date badle to due date khud 30 din baad (agar tum ne due date khud na badli ho)
    $('pfDate').addEventListener('change', function () {
        if (!dueTouched && this.value) { $('pfDue').value = addDays(this.value, 30); }
    });
    $('pfDue').addEventListener('change', function () { dueTouched = true; });

    function savePurchase() {
        clearErrs(formIds);
        var ok = true;

        var vendor = $('pfVendor').value;
        var date = $('pfDate').value;
        var due = $('pfDue').value;

        if (!vendor) { setErr('pfVendor', 'Choose a vendor'); ok = false; }
        if (!date) { setErr('pfDate', 'Choose the purchase date'); ok = false; }

        if (!due) {
            setErr('pfDue', 'Choose the due date');
            ok = false;
        } else if (date && due < date) {
            setErr('pfDue', 'Due date cannot be before the purchase date');
            ok = false;
        }

        // Items: bilkul khali rows ignore, baqi check
        var items = [];
        var itemError = '';
        readRows().forEach(function (r) {
            if (!r.desc && r.qtyRaw === '' && r.priceRaw === '') { return; }

            var qty = parseFloat(r.qtyRaw);
            var price = parseFloat(r.priceRaw);

            if (!r.desc) { itemError = 'Every item needs a description'; }
            else if (isNaN(qty) || qty <= 0) { itemError = 'Quantity must be more than 0 for "' + r.desc + '"'; }
            else if (isNaN(price) || price < 0) { itemError = 'Enter a valid price for "' + r.desc + '"'; }
            else { items.push({ desc: r.desc, qty: qty, price: price }); }
        });

        if (!itemError && !items.length) { itemError = 'Add at least one item'; }

        // Edit mein total, ada ki hui raqam se kam na ho
        if (!itemError && editingId) {
            var paid = calc(find(editingId)).paid;
            var newTotal = round2(items.reduce(function (s, i) { return s + i.qty * i.price; }, 0));
            if (newTotal < paid) { itemError = 'Total cannot be less than ' + money(paid) + ' which is already paid'; }
        }

        if (itemError) { setErr('pfItems', itemError); ok = false; }
        if (!ok) { return; }

        var data = {
            vendor_id: vendor,
            date: date,
            due: due,
            notes: $('pfNotes').value.trim(),
            items: items
        };

        if (editingId) {
            api('PUT', '/purchases/' + editingId, data)
                .then(function () {
                    toast('Purchase updated');
                    closeModal('puFormModal');
                    loadPurchases();
                })
                .catch(function (e) { toast(e.message || 'Could not update purchase', 'err'); });
        } else {
            api('POST', '/purchases', data)
                .then(function (res) {
                    toast(res.no + ' created');
                    closeModal('puFormModal');
                    loadPurchases();
                })
                .catch(function (e) { toast(e.message || 'Could not save purchase', 'err'); });
        }
    }

    $('puNew').addEventListener('click', function () { openForm(null); });
    $('pfSave').addEventListener('click', savePurchase);

    // ---------- Record Payment ----------
    var payIds = ['ppAmount', 'ppDate'];

    function openPay(p) {
        payingId = p.id;
        clearErrs(payIds);

        $('ppSummary').innerHTML = '<div class="vd-pay-name">' + esc(p.no) + ' - ' + esc(p.vendor) + '</div>' +
            '<div class="vd-pay-bal">Balance to pay: <b>' + money(calc(p).balance) + '</b></div>';

        $('ppAmount').value = '';
        $('ppDate').value = todayStr();
        $('ppMethod').value = 'Cash';

        openModal('puPayModal');
        setTimeout(function () { $('ppAmount').focus(); }, 60);
    }

    $('ppFull').addEventListener('click', function () {
        var p = find(payingId);
        if (p) { $('ppAmount').value = calc(p).balance; }
    });

    $('ppSave').addEventListener('click', function () {
        var p = find(payingId);
        if (!p) { return; }

        clearErrs(payIds);
        var ok = true;
        var balance = calc(p).balance;
        var amount = parseFloat($('ppAmount').value);
        var date = $('ppDate').value;

        if (isNaN(amount) || amount <= 0) {
            setErr('ppAmount', 'Enter an amount greater than 0');
            ok = false;
        } else if (amount > balance) {
            setErr('ppAmount', 'Amount cannot be more than the balance (' + money(balance) + ')');
            ok = false;
        }

        if (!date) {
            setErr('ppDate', 'Choose the payment date');
            ok = false;
        } else if (date > todayStr()) {
            setErr('ppDate', 'Date cannot be in the future');
            ok = false;
        }

        if (!ok) { return; }

        amount = round2(amount);

        api('POST', '/purchases/' + p.id + '/pay', {
            amount: amount,
            date: date,
            method: $('ppMethod').value
        })
            .then(function () {
                closeModal('puPayModal');
                toast('Payment of ' + money(amount) + ' recorded for ' + p.no);
                loadPurchases();
            })
            .catch(function (e) { toast(e.message || 'Could not record payment', 'err'); });
    });

    // ---------- Delete ----------
    function askDelete(p) {
        deleteId = p.id;
        var paid = calc(p).paid;
        $('pcText').textContent = paid > 0
            ? p.no + ' has ' + money(paid) + ' of payments recorded. This cannot be undone.'
            : p.no + ' will be removed. This cannot be undone.';
        openModal('puConfirmModal');
    }

    $('pcOk').addEventListener('click', function () {
        var p = find(deleteId);
        if (!p) { return; }

        api('DELETE', '/purchases/' + p.id)
            .then(function () {
                closeModal('puConfirmModal');
                toast(p.no + ' deleted');
                loadPurchases();
            })
            .catch(function (e) { toast(e.message || 'Could not delete purchase', 'err'); });
    });

    // ---------- Popup band karna ----------
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

    // ---------- Search, filter, sort ----------
    $('puSearch').addEventListener('input', function () {
        state.search = this.value;
        render();
    });

    $('puChips').addEventListener('click', function (e) {
        var chip = e.target.closest('.vd-chip');
        if (!chip) { return; }

        document.querySelectorAll('#puChips .vd-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        state.filter = chip.getAttribute('data-filter');
        render();
    });

    $('puSort').addEventListener('change', function () {
        state.sort = this.value;
        render();
    });

    // ---------- Page khulte hi data mangwana ----------
    loadVendors();
    loadPurchases();
})();