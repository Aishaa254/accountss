(function () {
    var A = window.Acc;
    var $ = A.$;

    var BANKS = [
        'HBL', 'UBL', 'MCB', 'Allied Bank', 'Meezan Bank', 'Bank Alfalah', 'Askari Bank',
        'Faysal Bank', 'Standard Chartered', 'Bank of Punjab', 'NBP', 'JS Bank',
        'Soneri Bank', 'Habib Metro', 'Bank Al Habib', 'Other'
    ];

    var banks = [];
    var editingId = null;

    function find(id) { return banks.filter(function (b) { return b.id === id; })[0]; }

    function holderOf(b) { return b.account_title || b.name; }

    // Poora number agar hai, warna purane banks ke liye sirf akhri 4 digits
    function numberOf(b) {
        if (b.account_number) { return b.account_number; }
        return b.last4 ? '••••' + b.last4 : '—';
    }

    // ---------- Bank cards ----------
    function cardHtml(b) {
        var sub = A.esc(holderOf(b)) + (b.last4 ? ' · ••••' + A.esc(b.last4) : '');
        var off = b.active ? '' : ' disabled';

        return '<div class="ac-bank' + (b.active ? '' : ' inactive') + '" data-id="' + b.id + '">' +
            '<div class="ac-bank-top">' +
                '<div class="ac-bank-ic"><i class="fa-solid fa-building-columns"></i></div>' +
                '<div class="ac-bank-name"><b>' + A.esc(b.bank_name || b.name) + (b.active ? '' : '<span class="ac-tag-off">Inactive</span>') + '</b><span>' + sub + '</span></div>' +
                '<button type="button" class="vd-dots" data-act="edit" data-id="' + b.id + '" title="Edit"><i class="fa-regular fa-pen-to-square"></i></button>' +
            '</div>' +
            '<div class="ac-bank-bal" data-bal="' + b.balance + '">' + A.money(0) + '</div>' +
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

    // ---------- Neeche ki details table ----------
    function renderTable() {
        if (!banks.length) {
            $('bkRows').innerHTML = '<tr class="vd-empty"><td colspan="4"><i class="fa-regular fa-folder-open"></i>No bank accounts yet</td></tr>';
            return;
        }

        $('bkRows').innerHTML = banks.map(function (b) {
            return '<tr>' +
                '<td>' + (b.created ? A.fmt(b.created) : '—') + '</td>' +
                '<td><div class="vd-name">' + A.esc(holderOf(b)) + '</div></td>' +
                '<td>' + A.esc(numberOf(b)) + '</td>' +
                '<td class="ac-num ac-bal">' + A.money(b.balance) + '</td>' +
            '</tr>';
        }).join('');
    }

    function loadBanks() {
        return A.api('GET', '/banks/list')
            .then(function (d) {
                banks = d.banks;
                renderCards(d.total);
                renderTable();
            })
            .catch(function (e) { A.toast(e.message, 'err'); });
    }

    // ---------- Card par click ----------
    $('bkGrid').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act]');
        if (!btn) { return; }

        var act = btn.getAttribute('data-act');
        if (act === 'add') { openForm(null); return; }

        var b = find(Number(btn.getAttribute('data-id')));
        if (!b || btn.disabled) { return; }

        if (act === 'edit') { openForm(b); }
        else { A.openEntry({ account: b, direction: act, withMethod: true, onSaved: loadBanks }); }
    });

    // ---------- Bank name selector ----------
    var bankPicker = SelectPicker.create({
        options: BANKS.map(function (n) { return { value: n, label: n, icon: 'fa-solid fa-building-columns' }; }),
        value: BANKS[0],
        onChange: toggleOther
    });
    $('bfBankBox').appendChild(bankPicker.el);

    function toggleOther() {
        var other = bankPicker.get() === 'Other';
        $('bfBankOther').style.display = other ? '' : 'none';
        if (other) { $('bfBankOther').focus(); }
    }

    function bankValue() {
        return bankPicker.get() === 'Other' ? $('bfBankOther').value.trim() : bankPicker.get();
    }

    // Account number mein sirf digits
    $('bfNumber').addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '');
    });

    // ---------- Add / Edit bank ----------
    var fields = { account_title: 'bfHolder', bank_name: 'bfBank', account_number: 'bfNumber', opening: 'bfOpening' };

    function clearErrors() {
        ['bfHolder', 'bfBank', 'bfNumber', 'bfOpening'].forEach(function (id) { A.setErr(id, ''); });
        $('bfBankOther').classList.remove('vd-invalid');
    }

    function openForm(b) {
        editingId = b ? b.id : null;
        clearErrors();

        $('bkTitle').textContent = b ? 'Edit Bank Account' : 'Add Bank Account';
        $('bfHolder').value = b ? (b.account_title || '') : '';

        if (b && BANKS.indexOf(b.bank_name) === -1) {
            bankPicker.set('Other');
            $('bfBankOther').value = b.bank_name || '';
        } else {
            bankPicker.set(b ? b.bank_name : BANKS[0]);
            $('bfBankOther').value = '';
        }
        $('bfBankOther').style.display = bankPicker.get() === 'Other' ? '' : 'none';

        $('bfNumber').value = b ? (b.account_number || '') : '';
        $('bfOpening').value = b ? b.opening : '0';
        $('bfNote').value = b ? b.note : '';

        A.openModal('bkModal');
        setTimeout(function () { $('bfHolder').focus(); }, 60);
    }

    $('bkNew').addEventListener('click', function () { openForm(null); });

    $('bfSave').addEventListener('click', function () {
        var holder = $('bfHolder').value.trim();
        var bank = bankValue();
        var number = $('bfNumber').value.trim();
        var opening = parseFloat($('bfOpening').value);
        var ok = true;

        clearErrors();

        if (holder.length < 2) { A.setErr('bfHolder', 'Enter the account holder name'); ok = false; }
        if (bank.length < 2) { A.setErr('bfBank', 'Choose or type the bank name'); $('bfBankOther').classList.add('vd-invalid'); ok = false; }
        if (!/^\d{6,24}$/.test(number)) { A.setErr('bfNumber', 'Enter 6 to 24 digits (numbers only)'); ok = false; }
        if (isNaN(opening) || opening < 0) { A.setErr('bfOpening', 'Enter 0 or more'); ok = false; }
        else if (opening > 100000000000) { A.setErr('bfOpening', 'Amount is too large'); ok = false; }

        if (!ok) { return; }

        var payload = {
            account_title: holder,
            bank_name: bank,
            account_number: number,
            opening: Math.round(opening * 100) / 100,
            note: $('bfNote').value.trim()
        };

        var btn = $('bfSave');
        btn.disabled = true;

        (editingId ? A.api('PUT', '/banks/' + editingId, payload) : A.api('POST', '/banks', payload))
            .then(function () {
                A.toast(editingId ? 'Bank account updated' : 'Bank account added');
                A.closeModal('bkModal');
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

    loadBanks();
})();