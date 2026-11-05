(function () {
    var A = window.Acc;
    var $ = A.$;

    var banks = [];
    var selectedId = null;
    var detail = null;
    var editingId = null;
    var dateFilter = null;

    function find(id) { return banks.filter(function (b) { return b.id === id; })[0]; }

    function query() {
        var r = dateFilter ? dateFilter.getRange() : {};
        var q = [];
        if (r.from) { q.push('from=' + r.from); }
        if (r.to) { q.push('to=' + r.to); }
        return q.length ? '?' + q.join('&') : '';
    }

    // ---------- Bank cards ----------
    function cardHtml(b) {
        var sub = A.esc(b.bank_name || '') + (b.last4 ? ' · ••••' + A.esc(b.last4) : '');
        var off = b.active ? '' : ' disabled';

        return '<div class="ac-bank' + (b.id === selectedId ? ' selected' : '') + (b.active ? '' : ' inactive') + '" data-id="' + b.id + '">' +
            '<div class="ac-bank-top">' +
                '<div class="ac-bank-ic"><i class="fa-solid fa-building-columns"></i></div>' +
                '<div class="ac-bank-name"><b>' + A.esc(b.name) + (b.active ? '' : '<span class="ac-tag-off">Inactive</span>') + '</b><span>' + sub + '</span></div>' +
                '<button type="button" class="vd-dots" data-act="edit" data-id="' + b.id + '" title="Edit"><i class="fa-regular fa-pen-to-square"></i></button>' +
            '</div>' +
            '<div class="ac-bank-bal" data-bal="' + b.balance + '">' + A.money(0) + '</div>' +
            A.spark(b.spark) +
            '<div class="ac-bank-foot"><span class="ac-in">In today ' + A.money(b.today_in) + '</span><span class="ac-out">Out today ' + A.money(b.today_out) + '</span></div>' +
            '<div class="ac-bank-actions">' +
                '<button type="button" class="vd-btn-ghost" data-act="in" data-id="' + b.id + '"' + off + '><i class="fa-solid fa-plus"></i> Add</button>' +
                '<button type="button" class="vd-btn-ghost" data-act="out" data-id="' + b.id + '"' + off + '><i class="fa-solid fa-arrow-up"></i> Take out</button>' +
            '</div>' +
        '</div>';
    }

    function renderCards(total) {
        A.countUp($('bkTotal'), total);

        var activeCount = banks.filter(function (b) { return b.active; }).length;
        $('bkCount').textContent = banks.length ? activeCount + ' active account' + (activeCount === 1 ? '' : 's') : '';

        if (!banks.length) {
            $('bkGrid').innerHTML = '<div class="ac-empty"><i class="fa-solid fa-building-columns"></i>' +
                '<h3>No bank accounts yet</h3><p>Add your first bank account to start tracking its balance.</p>' +
                '<button type="button" class="vd-btn-primary" data-act="add"><i class="fa-solid fa-plus"></i> Add Bank Account</button></div>';
            return;
        }

        $('bkGrid').innerHTML = banks.map(cardHtml).join('');

        $('bkGrid').querySelectorAll('[data-bal]').forEach(function (el) {
            A.countUp(el, Number(el.getAttribute('data-bal')));
        });
    }

    function markSelected() {
        $('bkGrid').querySelectorAll('.ac-bank').forEach(function (el) {
            el.classList.toggle('selected', Number(el.getAttribute('data-id')) === selectedId);
        });
    }

    // ---------- Statement ----------
    function loadDetail() {
        if (!selectedId) { $('bkDetail').style.display = 'none'; return Promise.resolve(); }

        return A.api('GET', '/banks/' + selectedId + '/data' + query())
            .then(function (d) { detail = d; renderDetail(); })
            .catch(function (e) { A.toast(e.message, 'err'); });
    }

    function renderDetail() {
        var a = detail.account;
        var st = detail.statement;

        $('bkDetail').style.display = '';
        $('bkDName').textContent = a.name + ' statement';
        $('bkDSub').textContent = (a.bank_name || '') + (a.last4 ? ' · ••••' + a.last4 : '') + ' · ' + st.rows.length + ' entr' + (st.rows.length === 1 ? 'y' : 'ies');

        A.renderStrip($('bkStrip'), st);
        $('bkRows').innerHTML = A.statementRows(st);
    }

    function select(id) {
        selectedId = id;
        markSelected();
        return loadDetail();
    }

    function loadBanks() {
        return A.api('GET', '/banks/list')
            .then(function (d) {
                banks = d.banks;

                if (!find(selectedId)) {
                    var first = banks.filter(function (b) { return b.active; })[0] || banks[0];
                    selectedId = first ? first.id : null;
                }

                renderCards(d.total);
                return loadDetail();
            })
            .catch(function (e) { A.toast(e.message, 'err'); });
    }

    // ---------- Card par click ----------
    $('bkGrid').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act]');

        if (btn) {
            var act = btn.getAttribute('data-act');
            if (act === 'add') { openForm(null); return; }

            var b = find(Number(btn.getAttribute('data-id')));
            if (!b || btn.disabled) { return; }

            if (act === 'edit') { openForm(b); }
            else { A.openEntry({ account: b, direction: act, withMethod: true, onSaved: loadBanks }); }
            return;
        }

        var card = e.target.closest('.ac-bank');
        if (card) { select(Number(card.getAttribute('data-id'))); }
    });

    // Entry delete
    $('bkRows').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act="del"]');
        if (!btn) { return; }
        A.confirmDelete({ id: btn.getAttribute('data-id'), text: btn.getAttribute('data-text'), onDone: loadBanks });
    });

    // ---------- Add / Edit bank ----------
    var fields = { name: 'bfName', bank_name: 'bfBank', last4: 'bfLast4', opening: 'bfOpening', active: 'bfActive' };

    function clearErrors() {
        ['bfName', 'bfBank', 'bfLast4', 'bfOpening', 'bfActive'].forEach(function (id) { A.setErr(id, ''); });
    }

    function openForm(b) {
        editingId = b ? b.id : null;
        clearErrors();

        $('bkTitle').textContent = b ? 'Edit Bank Account' : 'Add Bank Account';
        $('bfName').value = b ? b.name : '';
        $('bfBank').value = b ? (b.bank_name || '') : '';
        $('bfTitle').value = b ? (b.account_title || '') : '';
        $('bfLast4').value = b ? (b.last4 || '') : '';
        $('bfOpening').value = b ? b.opening : '0';
        $('bfNote').value = b ? b.note : '';
        $('bfActive').value = b && !b.active ? '0' : '1';
        $('bfStatusBox').style.display = b ? '' : 'none';

        A.openModal('bkModal');
        setTimeout(function () { $('bfName').focus(); }, 60);
    }

    $('bkNew').addEventListener('click', function () { openForm(null); });

    $('bfSave').addEventListener('click', function () {
        var name = $('bfName').value.trim();
        var bank = $('bfBank').value.trim();
        var last4 = $('bfLast4').value.trim();
        var opening = parseFloat($('bfOpening').value);
        var ok = true;

        clearErrors();

        if (name.length < 2) { A.setErr('bfName', 'Enter a name (at least 2 letters)'); ok = false; }
        if (bank.length < 2) { A.setErr('bfBank', 'Enter the bank name'); ok = false; }
        if (last4 !== '' && !/^\d{4}$/.test(last4)) { A.setErr('bfLast4', 'Enter exactly 4 digits'); ok = false; }
        if (isNaN(opening) || opening < 0) { A.setErr('bfOpening', 'Enter 0 or more'); ok = false; }
        else if (opening > 100000000000) { A.setErr('bfOpening', 'Amount is too large'); ok = false; }

        if (!ok) { return; }

        var payload = {
            name: name,
            bank_name: bank,
            account_title: $('bfTitle').value.trim(),
            last4: last4,
            opening: Math.round(opening * 100) / 100,
            note: $('bfNote').value.trim()
        };

        if (editingId) { payload.active = $('bfActive').value === '1'; }

        var btn = $('bfSave');
        btn.disabled = true;

        (editingId ? A.api('PUT', '/banks/' + editingId, payload) : A.api('POST', '/banks', payload))
            .then(function (res) {
                A.toast(editingId ? 'Bank account updated' : 'Bank account added');
                A.closeModal('bkModal');
                if (!editingId && res && res.id) { selectedId = res.id; }
                loadBanks();
            })
            .catch(function (e) {
                var shown = false;
                Object.keys(fields).forEach(function (key) {
                    if (e.errors && e.errors[key]) { A.setErr(fields[key], e.errors[key][0]); shown = true; }
                });
                if (!shown) { A.toast(e.message, 'err'); }
            })
            .then(function () { btn.disabled = false; });
    });

    // ---------- Print ----------
    $('bkPrint').addEventListener('click', function () {
        if (!detail) { return; }
        A.printStatement(detail.account, detail.statement, dateFilter ? dateFilter.getRange().label : '');
    });

    dateFilter = DateFilter.create({
        mount: $('bkDate'),
        noun: 'entries',
        onChange: function () { loadDetail(); }
    });

    loadBanks();
})();