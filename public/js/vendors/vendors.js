(function () {
    // ---------- Sample data (backend ke baad asli data aayega) ----------
    var vendors = [];

    var state = { filter: 'all', search: '', sort: 'name', page: 1, perPage: 5 };
    var openId = null;      // dropdown menu
    var current = null;     // detail panel
    var editingId = null;   // add/edit form
    var payingId = null;    // payment popup
    var deleteId = null;    // delete popup

    // ---------- Chhote helpers ----------
    function $(id) { return document.getElementById(id); }
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
            if (!res.ok) { throw new Error('request failed'); }
            return res.json();
        });
    }
    
    function loadVendors() {
        api('GET', '/vendors/list').then(function (data) {
            vendors = data;
            render();
        });
    }

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

    function fmtDate(d) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function dateAgo(n) {
        var d = new Date();
        d.setDate(d.getDate() - n);
        return fmtDate(d);
    }

    function todayStr() {
        var d = new Date();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return d.getFullYear() + '-' + m + '-' + day;
    }

    function findVendor(id) {
        return vendors.filter(function (v) { return v.id === id; })[0];
    }

    function isOverdue(v) { return v.balance > 0 && v.dueIn !== null && v.dueIn < 0; }
    function isDueSoon(v) { return v.balance > 0 && v.dueIn !== null && v.dueIn >= 0 && v.dueIn <= 7; }

    function whatsappNumber(phone) {
        var d = String(phone).replace(/\D/g, '');
        if (d.charAt(0) === '0') { d = '92' + d.slice(1); }
        return d;
    }

    function toast(message, type) {
        var t = $('vdToast');
        t.textContent = message;
        t.className = 'vd-toast show ' + (type || 'ok');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(function () { t.className = 'vd-toast'; }, 2600);
    }

    // ---------- Popups ----------
    function openModal(id) { $(id).classList.add('open'); }
    function closeModal(id) { $(id).classList.remove('open'); }

    function closeAllModals() {
        document.querySelectorAll('.vd-modal-overlay.open').forEach(function (m) {
            m.classList.remove('open');
        });
    }

    function setErr(id, msg) {
        var el = document.querySelector('[data-err="' + id + '"]');
        if (el) { el.textContent = msg || ''; }
        var input = $(id);
        if (input) { input.classList.toggle('vd-invalid', !!msg); }
    }

    function clearErrs(ids) {
        ids.forEach(function (id) { setErr(id, ''); });
    }

    // ---------- Cards aur chips ----------
    function updateCards() {
        var total = vendors.length;
        var now = new Date();

        var newThisMonth = vendors.filter(function (v) {
            var d = new Date();
            d.setDate(d.getDate() - v.createdAgo);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        var withBalance = vendors.filter(function (v) { return v.balance > 0; });
        var payable = withBalance.reduce(function (s, v) { return s + v.balance; }, 0);

        var dueSoon = vendors.filter(isDueSoon);
        var dueAmount = dueSoon.reduce(function (s, v) { return s + v.balance; }, 0);

        var overdue = vendors.filter(isOverdue);
        var overdueAmount = overdue.reduce(function (s, v) { return s + v.balance; }, 0);

        $('cardTotal').textContent = total;
        $('cardTotalNote').textContent = newThisMonth + ' new this month';
        $('cardPayable').textContent = money(payable);
        $('cardPayableNote').textContent = 'across ' + withBalance.length + ' vendors';
        $('cardDue').textContent = money(dueAmount);
        $('cardDueNote').textContent = dueSoon.length + ' vendor(s) due';
        $('cardOverdue').textContent = money(overdueAmount);
        $('cardOverdueNote').textContent = overdue.length + ' vendor(s) late';

        $('cntAll').textContent = total;
        $('cntActive').textContent = vendors.filter(function (v) { return v.status === 'active'; }).length;
        $('cntDue').textContent = withBalance.length;
        $('cntOverdue').textContent = overdue.length;
    }

    // ---------- List: filter, search, sort ----------
    function getVisible() {
        var q = state.search.trim().toLowerCase();

        var list = vendors.filter(function (v) {
            if (state.filter === 'active' && v.status !== 'active') { return false; }
            if (state.filter === 'due' && v.balance <= 0) { return false; }
            if (state.filter === 'overdue' && !isOverdue(v)) { return false; }

            if (q) {
                var text = (v.name + ' ' + v.company + ' ' + v.phone + ' ' + v.category).toLowerCase();
                if (text.indexOf(q) === -1) { return false; }
            }
            return true;
        });

        list.sort(function (a, b) {
            if (a.pinned !== b.pinned) { return a.pinned ? -1 : 1; }
            if (state.sort === 'balance') { return b.balance - a.balance; }
            if (state.sort === 'new') { return a.createdAgo - b.createdAgo; }
            return a.name.localeCompare(b.name);
        });

        return list;
    }

    function noteFor(v) {
        if (v.balance <= 0) { return { text: 'All paid', red: false }; }
        if (v.dueIn === null) { return { text: money(v.paid) + ' paid', red: false }; }
        if (isOverdue(v)) { return { text: 'Overdue by ' + Math.abs(v.dueIn) + ' days', red: true }; }
        return { text: money(v.paid) + ' paid, due in ' + v.dueIn + ' days', red: false };
    }

    function rowHtml(v) {
        var total = v.balance + v.paid;
        var percent = total > 0 ? Math.round((v.paid / total) * 100) : 100;
        var note = noteFor(v);
        var late = isOverdue(v);
        var avatar = 'vd-av-' + (((v.id - 1) % 5) + 1);
        var pin = v.pinned ? '<i class="fa-solid fa-star vd-pin" title="Pinned"></i>' : '';
        var badge = v.status === 'active'
            ? '<span class="vd-badge vd-badge-active">Active</span>'
            : '<span class="vd-badge vd-badge-inactive">Inactive</span>';

        return '<tr>' +
            '<td><div class="vd-vendor">' +
                '<span class="vd-avatar ' + avatar + '">' + esc(v.name.charAt(0).toUpperCase()) + '</span>' +
                '<div><div class="vd-name">' + esc(v.name) + pin + '</div>' +
                '<div class="vd-company">' + esc(v.company || '-') + '</div></div>' +
            '</div></td>' +
            '<td><span class="vd-tag">' + esc(v.category) + '</span></td>' +
            '<td>' + esc(v.phone) + '</td>' +
            '<td>' +
                '<div class="vd-amount' + (late ? ' vd-red' : '') + '">' + money(v.balance) + '</div>' +
                '<div class="vd-bar' + (late ? ' vd-bar-red' : '') + '"><span style="width:' + percent + '%"></span></div>' +
                '<div class="vd-bar-note' + (note.red ? ' vd-red' : '') + '">' + esc(note.text) + '</div>' +
            '</td>' +
            '<td>' + badge + '</td>' +
            '<td class="vd-actions"><button type="button" class="vd-dots" data-id="' + v.id + '"><i class="fa-solid fa-ellipsis-vertical"></i></button></td>' +
        '</tr>';
    }

    function pagerHtml(pages) {
        var h = '<button type="button" class="vd-page" data-page="' + (state.page - 1) + '"' +
            (state.page === 1 ? ' disabled' : '') + '><i class="fa-solid fa-chevron-left"></i></button>';

        for (var i = 1; i <= pages; i++) {
            h += '<button type="button" class="vd-page' + (i === state.page ? ' active' : '') +
                '" data-page="' + i + '">' + i + '</button>';
        }

        h += '<button type="button" class="vd-page" data-page="' + (state.page + 1) + '"' +
            (state.page === pages ? ' disabled' : '') + '><i class="fa-solid fa-chevron-right"></i></button>';
        return h;
    }

    function render() {
        var list = getVisible();
        var pages = Math.max(1, Math.ceil(list.length / state.perPage));
        if (state.page > pages) { state.page = pages; }

        var start = (state.page - 1) * state.perPage;
        var slice = list.slice(start, start + state.perPage);
        var body = $('vendorRows');

        if (!list.length) {
            body.innerHTML = '<tr class="vd-empty"><td colspan="6">' +
                '<i class="fa-regular fa-folder-open"></i>No vendors found' +
                '</td></tr>';
            $('vdInfo').textContent = 'No results';
        } else {
            body.innerHTML = slice.map(rowHtml).join('');
            $('vdInfo').textContent = 'Showing ' + (start + 1) + '-' + (start + slice.length) + ' of ' + list.length;
        }

        $('vdPager').innerHTML = pages > 1 ? pagerHtml(pages) : '';
        updateCards();
    }

    // ---------- Teen nuqton ka dropdown ----------
    var menu = document.createElement('div');
    menu.className = 'vd-menu';
    menu.style.display = 'none';
    document.body.appendChild(menu);

    function buttonItem(action, icon, label, extra) {
        return '<button type="button" class="vd-menu-item' + (extra ? ' ' + extra : '') + '" data-action="' + action + '">' +
            '<i class="' + icon + '"></i>' + label + '</button>';
    }

    function linkItem(href, icon, label, newTab) {
        return '<a class="vd-menu-item" href="' + href + '"' + (newTab ? ' target="_blank" rel="noopener"' : '') + '>' +
            '<i class="' + icon + '"></i>' + label + '</a>';
    }

    function closeMenu() {
        menu.style.display = 'none';
        openId = null;
    }

    function openMenu(btn, v) {
        var html = '';
        html += buttonItem('view', 'fa-regular fa-eye', 'View Details');
        if (v.balance > 0) {
            html += buttonItem('pay', 'fa-solid fa-money-bill-wave', 'Record Payment');
            html += buttonItem('remind', 'fa-brands fa-whatsapp', 'Send Payment Update');
        }
        html += '<div class="vd-menu-sep"></div>';
        html += linkItem('tel:' + v.phone.replace(/[^\d+]/g, ''), 'fa-solid fa-phone', 'Call');
        html += linkItem('https://wa.me/' + whatsappNumber(v.phone), 'fa-brands fa-whatsapp', 'WhatsApp', true);
        if (v.email) { html += linkItem('mailto:' + v.email, 'fa-regular fa-envelope', 'Email'); }
        html += '<div class="vd-menu-sep"></div>';
        html += buttonItem('pin', v.pinned ? 'fa-regular fa-star' : 'fa-solid fa-star', v.pinned ? 'Unpin' : 'Pin to top');
        html += buttonItem('edit', 'fa-regular fa-pen-to-square', 'Edit');
        html += '<div class="vd-menu-sep"></div>';
        html += buttonItem('delete', 'fa-regular fa-trash-can', 'Delete', 'vd-danger');

        menu.innerHTML = html;
        menu.style.display = 'block';
        openId = v.id;

        var r = btn.getBoundingClientRect();
        var mh = menu.offsetHeight;
        var mw = menu.offsetWidth;
        var top = r.bottom + 6;
        if (top + mh > window.innerHeight - 10) { top = r.top - mh - 6; }
        var left = r.right - mw;
        if (left < 10) { left = 10; }

        menu.style.top = Math.max(10, top) + 'px';
        menu.style.left = left + 'px';
    }

    $('vendorRows').addEventListener('click', function (e) {
        var btn = e.target.closest('.vd-dots');

        if (btn) {
            var id = Number(btn.getAttribute('data-id'));
            if (openId === id && menu.style.display === 'block') {
                closeMenu();
            } else {
                openMenu(btn, findVendor(id));
            }
            return;
        }

        // Row par click: detail panel
        var row = e.target.closest('tr');
        if (!row) { return; }
        var dots = row.querySelector('.vd-dots');
        if (!dots) { return; }
        var v = findVendor(Number(dots.getAttribute('data-id')));
        if (v) { openDetail(v); }
    });

    menu.addEventListener('click', function (e) {
        var item = e.target.closest('.vd-menu-item');
        if (!item) { return; }

        var action = item.getAttribute('data-action');
        var v = findVendor(openId);
        closeMenu();

        if (!action || !v) { return; }   // Call / WhatsApp / Email links khud khulte hain

        if (action === 'view') { openDetail(v); }
        else if (action === 'pay') { openPay(v); }
        else if (action === 'remind') { sendUpdate(v); }
        else if (action === 'edit') { openForm(v); }
        else if (action === 'delete') { askDelete(v); }
        else if (action === 'pin') {
            var newPin = !v.pinned;
            api('PUT', '/vendors/' + v.id, { pinned: newPin })
                .then(function () {
                    toast(newPin ? 'Vendor pinned to top' : 'Vendor unpinned');
                    loadVendors();
                })
                .catch(function () { toast('Could not change pin'); });
        }
    });

    document.addEventListener('click', function (e) {
        if (!menu.contains(e.target) && !e.target.closest('.vd-dots')) { closeMenu(); }
    });
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);

    // ---------- Detail panel ----------
    var side = $('vdSide');
    var overlay = $('vdOverlay');

    function dueText(v) {
        if (v.balance <= 0) { return 'No payment due'; }
        if (v.dueIn === null) { return 'No due date'; }
        if (v.dueIn < 0) { return 'Overdue by ' + Math.abs(v.dueIn) + ' days (was due ' + dateAgo(Math.abs(v.dueIn)) + ')'; }
        return 'Due in ' + v.dueIn + ' days (' + dateAgo(-v.dueIn) + ')';
    }

    function purchasesFor(v) {
        return (v.purchases || []).map(function (p) {
            return { no: p.no, label: fmtDate(new Date(p.date + 'T00:00:00')), amount: p.amount, status: p.status };
        });
    }
    function paymentsFor(v) {
        return v.history.map(function (h) {
            var d = new Date(h.date + 'T00:00:00');
            return { label: fmtDate(d), amount: h.amount, method: h.method, note: h.note };
        });
    }
     

    function panelHtml(v) {
        var total = v.balance + v.paid;
        var percent = total > 0 ? Math.round((v.paid / total) * 100) : 100;
        var late = isOverdue(v);
        var avatar = 'vd-av-' + (((v.id - 1) % 5) + 1);
        var badge = v.status === 'active'
            ? '<span class="vd-badge vd-badge-active">Active</span>'
            : '<span class="vd-badge vd-badge-inactive">Inactive</span>';
        var pin = v.pinned ? '<i class="fa-solid fa-star vd-pin" title="Pinned"></i>' : '';

        var purchases = purchasesFor(v);
        var payments = paymentsFor(v);

        var purchaseHtml = purchases.length
            ? purchases.map(function (p) {
                return '<div class="vd-item">' +
                    '<div><div class="vd-item-main">' + esc(p.no) + '</div>' +
                    '<div class="vd-item-sub">' + esc(p.label) + '</div></div>' +
                    '<div class="vd-item-right"><div class="vd-item-main">' + money(p.amount) + '</div>' +
                    '<span class="vd-st vd-st-' + p.status.toLowerCase() + '">' + p.status + '</span></div>' +
                '</div>';
            }).join('')
            : '<div class="vd-none">No purchases yet</div>';

        var paymentHtml = payments.length
            ? payments.map(function (p) {
                return '<div class="vd-item">' +
                    '<div><div class="vd-item-main">' + esc(p.method) + '</div>' +
                    '<div class="vd-item-sub">' + esc(p.label) + (p.note ? ' - ' + esc(p.note) : '') + '</div></div>' +
                    '<div class="vd-item-right"><div class="vd-item-main vd-green">' + money(p.amount) + '</div></div>' +
                '</div>';
            }).join('')
            : '<div class="vd-none">No payments yet</div>';

        var notes = '';
        if (v.address || v.notes) {
            notes = '<h4 class="vd-sec">Address and Notes</h4><div class="vd-info">' +
                (v.address ? '<div class="vd-info-row"><span>Address</span><b>' + esc(v.address) + '</b></div>' : '') +
                (v.notes ? '<div class="vd-info-row"><span>Notes</span><b>' + esc(v.notes) + '</b></div>' : '') +
                '</div>';
        }

        return '' +
            '<div class="vd-profile">' +
                '<span class="vd-avatar vd-avatar-lg ' + avatar + '">' + esc(v.name.charAt(0).toUpperCase()) + '</span>' +
                '<div>' +
                    '<div class="vd-profile-name">' + esc(v.name) + pin + '</div>' +
                    '<div class="vd-company">' + esc(v.company || '-') + '</div>' +
                    '<div class="vd-profile-tags"><span class="vd-tag">' + esc(v.category) + '</span>' + badge + '</div>' +
                '</div>' +
            '</div>' +

            '<div class="vd-balance' + (late ? ' vd-balance-late' : '') + '">' +
                '<div class="vd-balance-label">Payable balance</div>' +
                '<div class="vd-balance-amount' + (late ? ' vd-red' : '') + '">' + money(v.balance) + '</div>' +
                '<div class="vd-bar vd-bar-wide' + (late ? ' vd-bar-red' : '') + '"><span style="width:' + percent + '%"></span></div>' +
                '<div class="vd-balance-row"><span>' + money(v.paid) + ' paid</span><span>of ' + money(total) + '</span></div>' +
                '<div class="vd-balance-due' + (late ? ' vd-red' : '') + '">' + esc(dueText(v)) + '</div>' +
            '</div>' +

            '<div class="vd-quick">' +
                '<a class="vd-quick-btn" href="tel:' + esc(v.phone.replace(/[^\d+]/g, '')) + '"><i class="fa-solid fa-phone"></i>Call</a>' +
                '<a class="vd-quick-btn" href="https://wa.me/' + whatsappNumber(v.phone) + '" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i>WhatsApp</a>' +
                (v.email
                    ? '<a class="vd-quick-btn" href="mailto:' + esc(v.email) + '"><i class="fa-regular fa-envelope"></i>Email</a>'
                    : '<span class="vd-quick-btn vd-quick-off"><i class="fa-regular fa-envelope"></i>Email</span>') +
            '</div>' +

            '<h4 class="vd-sec">Contact</h4>' +
            '<div class="vd-info">' +
                '<div class="vd-info-row"><span>Phone</span><b>' + esc(v.phone) + '</b></div>' +
                '<div class="vd-info-row"><span>Email</span><b>' + esc(v.email || '-') + '</b></div>' +
                '<div class="vd-info-row"><span>City</span><b>' + esc(v.city || '-') + '</b></div>' +
                '<div class="vd-info-row"><span>Payment terms</span><b>' + esc(v.terms) + ' days</b></div>' +
            '</div>' +

            notes +

            '<h4 class="vd-sec">Recent Purchases</h4>' +
            '<div class="vd-list">' + purchaseHtml + '</div>' +

            '<h4 class="vd-sec">Payment History</h4>' +
            '<div class="vd-list">' + paymentHtml + '</div>';
    }

    function openDetail(v) {
        current = v;
        $('vdSideBody').innerHTML = panelHtml(v);
        $('vdSideBody').scrollTop = 0;
        $('vdPayBtn').style.display = v.balance > 0 ? '' : 'none';

        side.classList.add('open');
        overlay.classList.add('open');
        side.setAttribute('aria-hidden', 'false');
    }

    function closeDetail() {
        side.classList.remove('open');
        overlay.classList.remove('open');
        side.setAttribute('aria-hidden', 'true');
    }

    $('vdClose').addEventListener('click', closeDetail);
    overlay.addEventListener('click', closeDetail);

    $('vdEditBtn').addEventListener('click', function () {
        if (!current) { return; }
        closeDetail();
        openForm(current);
    });

    $('vdPayBtn').addEventListener('click', function () {
        if (!current) { return; }
        closeDetail();
        openPay(current);
    });

    // ---------- Add / Edit form ----------
    var formIds = ['fName', 'fCompany', 'fCategory', 'fPhone', 'fEmail', 'fCity', 'fAddress', 'fBalance', 'fTerms', 'fStatus', 'fNotes'];

    function openForm(v) {
        editingId = v ? v.id : null;
        $('vdFormTitle').textContent = v ? 'Edit Vendor' : 'Add Vendor';
        $('vdFormSave').textContent = v ? 'Save Changes' : 'Add Vendor';
        clearErrs(formIds);

        $('fName').value = v ? v.name : '';
        $('fCompany').value = v ? v.company : '';
        $('fCategory').value = v ? v.category : 'Raw Material';
        $('fPhone').value = v ? v.phone : '';
        $('fEmail').value = v ? v.email : '';
        $('fCity').value = v ? v.city : '';
        $('fAddress').value = v ? v.address : '';
        $('fNotes').value = v ? v.notes : '';
        $('fStatus').value = v ? v.status : 'active';
        $('fTerms').value = v ? v.terms : 30;
        $('fBalance').value = v ? v.balance : '';
        $('fBalance').disabled = !!v;
        $('fBalanceHint').textContent = v
            ? 'Balance changes through Record Payment'
            : 'Amount you already owe this vendor';

        openModal('vdFormModal');
        setTimeout(function () { $('fName').focus(); }, 60);
    }

    function normalizePhone(p) {
        var d = String(p).replace(/\D/g, '');
        if (d.indexOf('92') === 0 && d.length === 12) { d = '0' + d.slice(2); }
        return d;
    }

    function saveForm() {
        clearErrs(formIds);
        var ok = true;

        var name = $('fName').value.trim();
        var company = $('fCompany').value.trim();
        var phoneDigits = normalizePhone($('fPhone').value);
        var email = $('fEmail').value.trim();
        var terms = $('fTerms').value.trim();
        var balanceRaw = $('fBalance').value.trim();

        // Name
        if (name.length < 2) {
            setErr('fName', 'Enter the vendor name (at least 2 letters)');
            ok = false;
        } else {
            var sameName = vendors.some(function (v) {
                return v.id !== editingId && v.name.toLowerCase() === name.toLowerCase();
            });
            if (sameName) { setErr('fName', 'A vendor with this name already exists'); ok = false; }
        }

        // Phone
        if (!/^03\d{9}$/.test(phoneDigits)) {
            setErr('fPhone', 'Enter a valid mobile number like 0300-1234567');
            ok = false;
        } else {
            var samePhone = vendors.some(function (v) {
                return v.id !== editingId && normalizePhone(v.phone) === phoneDigits;
            });
            if (samePhone) { setErr('fPhone', 'This phone number is already used by another vendor'); ok = false; }
        }

        // Email (optional)
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErr('fEmail', 'Enter a valid email like name@example.com');
            ok = false;
        }

        // Payment terms
        var termsNum = Number(terms);
        if (terms === '' || !Number.isInteger(termsNum) || termsNum < 0 || termsNum > 365) {
            setErr('fTerms', 'Enter days between 0 and 365');
            ok = false;
        }

        // Opening balance (sirf naye vendor mein)
        var balance = 0;
        if (!editingId) {
            balance = balanceRaw === '' ? 0 : Number(balanceRaw);
            if (isNaN(balance) || balance < 0 || balance > 100000000) {
                setErr('fBalance', 'Enter an amount of 0 or more');
                ok = false;
            }
        }

        if (!ok) { return; }
        var phone = phoneDigits.slice(0, 4) + '-' + phoneDigits.slice(4);

        var data = {
            name: name,
            company: company,
            category: $('fCategory').value,
            phone: phone,
            email: email,
            city: $('fCity').value.trim(),
            address: $('fAddress').value.trim(),
            notes: $('fNotes').value.trim(),
            status: $('fStatus').value,
            terms: termsNum
        };

        if (editingId) {
            api('PUT', '/vendors/' + editingId, data)
                .then(function () {
                    toast('Vendor updated');
                    closeModal('vdFormModal');
                    loadVendors();
                })
                .catch(function () { toast('Could not update vendor'); });
        } else {
            data.balance = balance;
            api('POST', '/vendors', data)
                .then(function () {
                    state.page = 1;
                    toast('Vendor added');
                    closeModal('vdFormModal');
                    loadVendors();
                })
                .catch(function () { toast('Could not add vendor'); });
        }
    }

    $('addVendorBtn').addEventListener('click', function () { openForm(null); });
    $('vdFormSave').addEventListener('click', saveForm);

    // ---------- Record Payment ----------
    var payIds = ['pAmount', 'pDate'];

    function openPay(v) {
        payingId = v.id;
        clearErrs(payIds);

        $('pSummary').innerHTML = '<div class="vd-pay-name">' + esc(v.name) + '</div>' +
            '<div class="vd-pay-bal">Payable balance: <b>' + money(v.balance) + '</b></div>';
        $('pAmount').value = '';
        $('pDate').value = todayStr();
        $('pMethod').value = 'Cash';
        $('pNote').value = '';

        openModal('vdPayModal');
        setTimeout(function () { $('pAmount').focus(); }, 60);
    }

    $('pFull').addEventListener('click', function () {
        var v = findVendor(payingId);
        if (v) { $('pAmount').value = v.balance; }
    });

    $('vdPaySave').addEventListener('click', function () {
        var v = findVendor(payingId);
        if (!v) { return; }

        clearErrs(payIds);
        var ok = true;

        var amount = parseFloat($('pAmount').value);
        var date = $('pDate').value;

        if (isNaN(amount) || amount <= 0) {
            setErr('pAmount', 'Enter an amount greater than 0');
            ok = false;
        } else if (amount > v.balance) {
            setErr('pAmount', 'Amount cannot be more than the balance (' + money(v.balance) + ')');
            ok = false;
        }

        if (!date) {
            setErr('pDate', 'Choose the payment date');
            ok = false;
        } else if (date > todayStr()) {
            setErr('pDate', 'Date cannot be in the future');
            ok = false;
        }

        if (!ok) { return; }

        amount = Math.round(amount * 100) / 100;

        api('POST', '/vendors/' + v.id + '/pay', {
            amount: amount,
            date: date,
            method: $('pMethod').value,
            note: $('pNote').value.trim()
        })
            .then(function () {
                closeModal('vdPayModal');
                toast('Payment of ' + money(amount) + ' recorded');
                loadVendors();
            })
            .catch(function () { toast('Could not record payment'); });
    });

    // ---------- WhatsApp payment update ----------
    function sendUpdate(v) {
        var when;
        if (v.dueIn === null) { when = 'in our records'; }
        else if (v.dueIn < 0) { when = 'which was due ' + Math.abs(v.dueIn) + ' days ago'; }
        else { when = 'due in ' + v.dueIn + ' days'; }

        var text = 'Assalam o Alaikum ' + v.name + ',\n\n' +
            'Your pending payment of ' + money(v.balance) + ' (' + when + ') is noted in our records. ' +
            'We will clear it as soon as possible. Please tell us if your account details have changed.\n\n' +
            'Regards,\nAccountPro';

        window.open('https://wa.me/' + whatsappNumber(v.phone) + '?text=' + encodeURIComponent(text), '_blank');
    }

    // ---------- Delete ----------
    function askDelete(v) {
        deleteId = v.id;
        $('cText').textContent = v.balance > 0
            ? v.name + ' still has ' + money(v.balance) + ' payable. This cannot be undone.'
            : v.name + ' will be removed. This cannot be undone.';
        openModal('vdConfirmModal');
    }

    $('cOk').addEventListener('click', function () {
        var v = findVendor(deleteId);
        if (!v) { return; }

        api('DELETE', '/vendors/' + v.id)
        .then(function () {
            closeModal('vdConfirmModal');
            toast('Vendor deleted');
            loadVendors();
        })
        .catch(function () { toast('Could not delete vendor'); });
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
        closeAllModals();
        closeDetail();
    });

    // ---------- Search, filter, sort, pagination ----------
    $('vendorSearch').addEventListener('input', function () {
        state.search = this.value;
        state.page = 1;
        render();
    });

    $('vendorChips').addEventListener('click', function (e) {
        var chip = e.target.closest('.vd-chip');
        if (!chip) { return; }

        document.querySelectorAll('#vendorChips .vd-chip').forEach(function (c) {
            c.classList.remove('active');
        });
        chip.classList.add('active');
        state.filter = chip.getAttribute('data-filter');
        state.page = 1;
        render();
    });

    $('vendorSort').addEventListener('change', function () {
        state.sort = this.value;
        state.page = 1;
        render();
    });

    $('vdPerPage').addEventListener('change', function () {
        state.perPage = Number(this.value);
        state.page = 1;
        render();
    });

    $('vdPager').addEventListener('click', function (e) {
        var btn = e.target.closest('.vd-page');
        if (!btn || btn.disabled) { return; }
        state.page = Number(btn.getAttribute('data-page'));
        render();
    });

    loadVendors();
})();