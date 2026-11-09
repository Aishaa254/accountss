(function () {
    var A = window.Acc;
    var $ = A.$;
    var data = null;
    var dateFilter = null;

    // Table ki state: tab, search, page
    var ui = { tab: 'all', q: '', page: 1, size: 10 };

    // Har entry ka icon, title aur chhoti detail (paisa kahan se aaya / kahan gaya / kyun)
    function info(r) {
        var isIn = r.direction === 'in';
        var sub = [r.note, r.reference ? 'Ref ' + r.reference : ''].filter(Boolean).join(' · ');
        var base = { icon: isIn ? 'fa-circle-plus' : 'fa-circle-minus', title: isIn ? 'Money added by hand' : 'Money taken out by hand', sub: sub, chip: '' };

        if (r.kind === 'payment_in') {
            base.icon = 'fa-file-invoice-dollar'; base.title = 'Payment received';
        } else if (r.kind === 'payment_out') {
            base.icon = 'fa-truck';
            base.title = r.source === 'vendor_payment' ? 'Paid to vendor (opening balance)' : 'Paid to vendor (purchase)';
        } else if (r.kind === 'expense') {
            base.icon = 'fa-receipt'; base.title = 'Expense'; base.chip = r.category || 'Other';
        } else if (r.kind === 'transfer') {
            base.icon = 'fa-right-left'; base.title = isIn ? 'Transfer from bank' : 'Transfer to bank';
        } else if (r.kind === 'adjustment') {
            base.icon = 'fa-scale-balanced'; base.title = 'Cash count adjustment';
        }

        return base;
    }

    // "Kahan se aaya / kahan gaya" ke groups
    function groupOf(r) {
        var isIn = r.direction === 'in';
        if (r.kind === 'payment_in') { return 'Customer payments'; }
        if (r.kind === 'payment_out') { return r.source === 'vendor_payment' ? 'Vendor opening payments' : 'Vendor purchase payments'; }
        if (r.kind === 'expense') { return 'Expense: ' + (r.category || 'Other'); }
        if (r.kind === 'transfer') { return isIn ? 'From bank' : 'To bank'; }
        if (r.kind === 'adjustment') { return 'Cash count adjustment'; }
        return isIn ? 'Added by hand' : 'Taken out by hand';
    }

    function query() {
        var r = dateFilter ? dateFilter.getRange() : {};
        var q = [];
        if (r.from) { q.push('from=' + r.from); }
        if (r.to) { q.push('to=' + r.to); }
        return q.length ? '?' + q.join('&') : '';
    }

    function load() {
        return A.api('GET', '/cash/data' + query())
            .then(function (d) { data = d; render(); })
            .catch(function (e) { A.toast(e.message, 'err'); });
    }

    // ---------- Buttons ----------
    // Rule ON (default): Add Money sirf tab jab cash 0 ho. Rule OFF: Add Money hamesha menu mein.
    function renderActions(balance) {
        var box = $('chActions');
        var strict = data.rules && data.rules.add_only_when_empty;

        if (balance <= 0) {
            box.innerHTML =
                '<button type="button" class="vd-btn-ghost" data-act="transfer"><i class="fa-solid fa-building-columns"></i> From Bank</button>' +
                '<button type="button" class="vd-btn-primary ac-btn-wide" data-act="add"><i class="fa-solid fa-plus"></i> Add Money</button>';
            return;
        }

        box.innerHTML =
            '<div class="ac-menu" id="chMenuWrap">' +
                '<button type="button" class="vd-btn-primary" data-act="menu"><i class="fa-solid fa-ellipsis"></i> Cash Actions <i class="fa-solid fa-chevron-down"></i></button>' +
                '<div class="ac-menu-list">' +
                    (strict ? '' : '<button type="button" class="ac-menu-item" data-act="add"><i class="fa-solid fa-plus"></i> Add Money</button>') +
                    '<button type="button" class="ac-menu-item" data-act="out"><i class="fa-solid fa-arrow-up"></i> Take Out</button>' +
                    '<button type="button" class="ac-menu-item" data-act="transfer"><i class="fa-solid fa-right-left"></i> Bank Transfer</button>' +
                    '<button type="button" class="ac-menu-item" data-act="actual"><i class="fa-solid fa-calculator"></i> Set Actual Cash</button>' +
                '</div>' +
            '</div>';
    }

    $('chActions').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act]');
        if (!btn || !data) { return; }

        var act = btn.getAttribute('data-act');
        var wrap = $('chMenuWrap');

        if (act === 'menu') { wrap.classList.toggle('open'); return; }
        if (wrap) { wrap.classList.remove('open'); }

        if (act === 'add') { A.openEntry({ account: data.account, direction: 'in', withMethod: false, onSaved: load }); }
        else if (act === 'out') { A.openEntry({ account: data.account, direction: 'out', withMethod: false, onSaved: load }); }
        else if (act === 'transfer') { openTransfer(); }
        else if (act === 'actual') { openActual(); }
    });

    // Menu ke bahar click karne par band
    document.addEventListener('click', function (e) {
        var wrap = $('chMenuWrap');
        if (wrap && !wrap.contains(e.target)) { wrap.classList.remove('open'); }
    });

    // ---------- History table ----------
    function filtered() {
        var q = ui.q.toLowerCase();

        return data.statement.rows.slice().reverse().filter(function (r) {
            if (ui.tab !== 'all' && r.direction !== ui.tab) { return false; }
            if (!q) { return true; }

            var i = info(r);
            var hay = [i.title, i.chip, r.note, r.reference, r.method, r.category, r.date].join(' ').toLowerCase();
            return hay.indexOf(q) !== -1;
        });
    }

    function rowHtml(r) {
        var isIn = r.direction === 'in';
        var i = info(r);

        return '<tr>' +
            '<td>' + A.fmt(r.date) + '</td>' +
            '<td><div class="ac-kind-cell"><span class="ac-kind ' + (isIn ? 'ac-kind-in' : 'ac-kind-out') + '"><i class="fa-solid ' + i.icon + '"></i></span>' +
                '<div><div class="vd-name">' + A.esc(i.title) + (i.chip ? '<span class="ac-cat">' + A.esc(i.chip) + '</span>' : '') + '</div>' +
                (i.sub ? '<div class="vd-company">' + A.esc(i.sub) + '</div>' : '') + '</div></div></td>' +
            '<td><span class="ac-badge ' + (isIn ? 'ac-badge-in' : 'ac-badge-out') + '">' + (isIn ? 'Money Added' : 'Money Removed') + '</span></td>' +
            '<td class="ac-num ac-in">' + (isIn ? '+' + A.money(r.amount) : '') + '</td>' +
            '<td class="ac-num ac-out">' + (!isIn ? '-' + A.money(r.amount) : '') + '</td>' +
            '<td class="ac-num ac-bal">' + A.money(r.balance) + '</td>' +
            '<td class="ac-num">' + (r.deletable
                ? '<button type="button" class="vd-dots ac-del" data-act="del" data-id="' + r.id + '" data-text="' + A.esc(i.title + ' ' + A.money(r.amount)) + '" title="Delete"><i class="fa-regular fa-trash-can"></i></button>'
                : '') + '</td>' +
        '</tr>';
    }

    function renderTable() {
        var st = data.statement;
        var list = filtered();
        var pages = Math.max(1, Math.ceil(list.length / ui.size));
        if (ui.page > pages) { ui.page = pages; }

        var from = (ui.page - 1) * ui.size;
        var slice = list.slice(from, from + ui.size);
        var html;

        if (!slice.length) {
            html = '<tr class="vd-empty"><td colspan="7"><i class="fa-regular fa-folder-open"></i>' +
                (st.rows.length ? 'No entries match this filter' : 'No entries in this period') + '</td></tr>';
        } else {
            html = slice.map(rowHtml).join('');
        }

        // Opening balance sirf aakhri page par, jab sab entries dikh rahi hon
        if (ui.page === pages && ui.tab === 'all' && !ui.q) {
            html += '<tr class="ac-open-row"><td></td><td><div class="vd-name">Opening balance</div></td><td></td><td></td><td></td>' +
                '<td class="ac-num ac-bal">' + A.money(st.opening) + '</td><td></td></tr>';
        }

        $('chRows').innerHTML = html;
        $('chPageInfo').textContent = list.length
            ? 'Showing ' + (from + 1) + '-' + (from + slice.length) + ' of ' + list.length + ' entr' + (list.length === 1 ? 'y' : 'ies')
            : '0 entries';
        $('chPrev').disabled = ui.page <= 1;
        $('chNext').disabled = ui.page >= pages;
    }

    // ---------- Paisa kahan se aaya / kahan gaya ----------
    function breakdown(dir, title) {
        var map = {};
        var total = 0;

        data.statement.rows.forEach(function (r) {
            if (r.direction !== dir) { return; }
            var g = groupOf(r);
            map[g] = (map[g] || 0) + r.amount;
            total += r.amount;
        });

        var items = Object.keys(map).map(function (k) { return { name: k, amount: map[k] }; })
            .sort(function (a, b) { return b.amount - a.amount; });

        if (items.length > 5) {
            var rest = items.slice(5).reduce(function (s, x) { return s + x.amount; }, 0);
            items = items.slice(0, 5);
            items.push({ name: 'Others', amount: rest });
        }

        var body = items.length ? items.map(function (x) {
            var pct = total ? Math.round(x.amount / total * 100) : 0;
            return '<div class="ac-bd-row"><div class="ac-bd-line"><span>' + A.esc(x.name) + '</span><span>' + A.money(x.amount) + ' · ' + pct + '%</span></div>' +
                '<div class="ac-bd-bar"><i style="width:' + pct + '%"></i></div></div>';
        }).join('') : '<div class="ac-bd-empty">Nothing in this period</div>';

        return '<div class="ac-bd ac-bd-' + dir + '"><div class="ac-bd-head"><h4>' + title + '</h4><b class="' + (dir === 'in' ? 'ac-in' : 'ac-out') + '">' + A.money(total) + '</b></div>' + body + '</div>';
    }

    function render() {
        var a = data.account;
        var st = data.statement;

        A.countUp($('chBalance'), a.balance);
        $('chIn').textContent = A.money(a.today_in);
        $('chOut').textContent = A.money(a.today_out);
        $('chOpening').textContent = A.money(a.opening);
        $('chSpark').innerHTML = A.spark(a.spark);
        $('chEmpty').style.display = a.balance <= 0 ? '' : 'none';
        $('chRule').checked = !!(data.rules && data.rules.add_only_when_empty);
        $('chRuleState').textContent = $('chRule').checked ? 'ON' : 'OFF';

        renderActions(a.balance);

        A.renderStrip($('chStrip'), st);
        $('chSplit').innerHTML = breakdown('in', 'Where the money came from') + breakdown('out', 'Where the money went');
        $('chInfo').textContent = st.rows.length + ' entr' + (st.rows.length === 1 ? 'y' : 'ies') + ' in this period';
        renderTable();
    }

    // Tabs, search, rows per page, Prev/Next
    $('chTabs').addEventListener('click', function (e) {
        var b = e.target.closest('[data-tab]');
        if (!b) { return; }
        ui.tab = b.getAttribute('data-tab');
        ui.page = 1;
        $('chTabs').querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x === b); });
        if (data) { renderTable(); }
    });

    var searchTimer;
    $('chSearch').addEventListener('input', function () {
        var v = this.value.trim();
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () { ui.q = v; ui.page = 1; if (data) { renderTable(); } }, 180);
    });

    $('chPageSize').addEventListener('change', function () { ui.size = Number(this.value); ui.page = 1; if (data) { renderTable(); } });
    $('chPrev').addEventListener('click', function () { if (ui.page > 1) { ui.page--; renderTable(); } });
    $('chNext').addEventListener('click', function () { ui.page++; renderTable(); });

    // Rule switch: Add Money sirf cash 0 par (on) ya hamesha (off)
    $('chRule').addEventListener('change', function () {
        var box = this;
        var want = box.checked;

        A.api('PUT', '/cash/rule', { add_only_when_empty: want })
            .then(function (res) {
                data.rules = { add_only_when_empty: res.add_only_when_empty };
                $('chRuleState').textContent = res.add_only_when_empty ? 'ON' : 'OFF';
                renderActions(data.account.balance);
                A.toast(res.add_only_when_empty ? 'Add Money now works only when cash is 0' : 'Add Money is available all the time');
            })
            .catch(function (e) {
                box.checked = !want;
                $('chRuleState').textContent = box.checked ? 'ON' : 'OFF';
                A.toast(e.message, 'err');
            });
    });

    // Entry delete (haath se daali hui ya transfer)
    $('chRows').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act="del"]');
        if (!btn) { return; }
        A.confirmDelete({ id: btn.getAttribute('data-id'), text: btn.getAttribute('data-text'), onDone: load });
    });

    // ---------- Set Actual Cash ----------
    function openActual() {
        A.setErr('coAmount', '');
        $('coAmount').value = data ? data.account.balance : '';
        A.openModal('coModal');
        setTimeout(function () { $('coAmount').focus(); }, 60);
    }

    $('coSave').addEventListener('click', function () {
        var v = parseFloat($('coAmount').value);
        A.setErr('coAmount', '');

        if (isNaN(v) || v < 0) { A.setErr('coAmount', 'Enter 0 or more'); return; }
        if (v > 100000000000) { A.setErr('coAmount', 'Amount is too large'); return; }

        A.api('POST', '/cash/adjust', { actual: Math.round(v * 100) / 100 })
            .then(function (res) {
                A.toast(res.diff ? 'Cash balance now matches your count' : 'Cash already matches your count');
                A.closeModal('coModal');
                load();
            })
            .catch(function (e) {
                if (e.errors && e.errors.actual) { A.setErr('coAmount', e.errors.actual[0]); }
                else { A.toast(e.message, 'err'); }
            });
    });

    // ---------- Bank Transfer ----------
    var banks = [];
    var dirPicker = null;
    var bankPicker = null;

    function bankLabel(b) { return b.name + (b.last4 ? ' (••••' + b.last4 + ')' : ''); }

    function findBank(id) {
        return banks.filter(function (b) { return String(b.id) === String(id); })[0];
    }

    function available() {
        if (dirPicker.get() === 'to_cash') {
            var b = bankPicker ? findBank(bankPicker.get()) : null;
            return { text: 'Available in bank', amount: b ? b.balance : 0 };
        }
        return { text: 'Available in cash', amount: data.account.balance };
    }

    function updateAvail() {
        var v = available();
        $('trAvail').textContent = v.text + ': ' + A.money(v.amount);
    }

    function openTransfer() {
        A.api('GET', '/banks/list')
            .then(function (d) {
                banks = d.banks.filter(function (b) { return b.active; });

                if (!dirPicker) {
                    dirPicker = SelectPicker.create({
                        options: [
                            { value: 'to_cash', label: 'Bank to Cash (money comes in)', icon: 'fa-solid fa-building-columns' },
                            { value: 'to_bank', label: 'Cash to Bank (money goes out)', icon: 'fa-solid fa-money-bill-wave' }
                        ],
                        value: 'to_cash',
                        onChange: updateAvail
                    });
                    $('trDirBox').appendChild(dirPicker.el);
                } else {
                    dirPicker.set('to_cash');
                }

                var hasBanks = banks.length > 0;
                $('trBankField').style.display = hasBanks ? '' : 'none';
                $('trSave').disabled = !hasBanks;

                if (hasBanks) {
                    var options = banks.map(function (b) {
                        return { value: String(b.id), label: bankLabel(b), icon: 'fa-solid fa-building-columns' };
                    });

                    if (!bankPicker) {
                        bankPicker = SelectPicker.create({ options: options, value: options[0].value, onChange: updateAvail });
                        $('trBankBox').appendChild(bankPicker.el);
                    } else {
                        bankPicker.setOptions(options, options[0].value);
                    }
                }

                A.setErr('trBank', '');
                A.setErr('trAmount', '');
                A.setErr('trDate', '');
                $('trAmount').value = '';
                $('trNote').value = '';
                $('trDate').value = A.today();
                $('trDate').max = A.today();

                if (!hasBanks) {
                    $('trAvail').textContent = 'No active bank account. Add one from the Bank page first.';
                } else {
                    updateAvail();
                }

                A.openModal('trModal');
            })
            .catch(function (e) { A.toast(e.message, 'err'); });
    }

    $('trSave').addEventListener('click', function () {
        var amount = parseFloat($('trAmount').value);
        var date = $('trDate').value;
        var ok = true;

        A.setErr('trBank', '');
        A.setErr('trAmount', '');
        A.setErr('trDate', '');

        if (!bankPicker || !bankPicker.get()) { A.setErr('trBank', 'Choose a bank account'); ok = false; }
        if (isNaN(amount) || amount <= 0) { A.setErr('trAmount', 'Enter an amount more than 0'); ok = false; }
        else if (amount > available().amount) { A.setErr('trAmount', 'Not enough money. ' + available().text + ': ' + A.money(available().amount)); ok = false; }
        if (!date) { A.setErr('trDate', 'Choose a date'); ok = false; }
        else if (date > A.today()) { A.setErr('trDate', 'Date cannot be in the future'); ok = false; }

        if (!ok) { return; }

        var btn = $('trSave');
        btn.disabled = true;

        A.api('POST', '/cash/transfer', {
            direction: dirPicker.get(),
            bank_id: Number(bankPicker.get()),
            amount: Math.round(amount * 100) / 100,
            date: date,
            note: $('trNote').value.trim()
        })
            .then(function () {
                A.toast('Transfer done');
                A.closeModal('trModal');
                load();
            })
            .catch(function (e) {
                if (e.errors && e.errors.amount) { A.setErr('trAmount', e.errors.amount[0]); }
                else if (e.errors && e.errors.bank_id) { A.setErr('trBank', e.errors.bank_id[0]); }
                else if (e.errors && e.errors.date) { A.setErr('trDate', e.errors.date[0]); }
                else { A.toast(e.message, 'err'); }
            })
            .then(function () { btn.disabled = false; });
    });

    // Print
    $('chPrint').addEventListener('click', function () {
        if (!data) { return; }
        A.printStatement(data.account, data.statement, dateFilter ? dateFilter.getRange().label : '');
    });

    dateFilter = DateFilter.create({
        mount: $('chDate'),
        noun: 'entries',
        onChange: function () { load(); }
    });

    load();
})();