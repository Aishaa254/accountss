(function () {
    var A = window.Acc;
    var $ = A.$;
    var data = null;
    var dateFilter = null;

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

    function render() {
        var a = data.account;
        var st = data.statement;

        A.countUp($('chBalance'), a.balance);
        $('chIn').textContent = A.money(a.today_in);
        $('chOut').textContent = A.money(a.today_out);
        $('chOpening').textContent = A.money(a.opening);
        $('chSpark').innerHTML = A.spark(a.spark);

        A.renderStrip($('chStrip'), st);
        $('chRows').innerHTML = A.statementRows(st);
        $('chInfo').textContent = st.rows.length + ' entr' + (st.rows.length === 1 ? 'y' : 'ies');
    }

    // Paisa daalo / nikalo
    $('chAddBtn').addEventListener('click', function () {
        A.openEntry({ account: data.account, direction: 'in', withMethod: false, onSaved: load });
    });
    $('chOutBtn').addEventListener('click', function () {
        A.openEntry({ account: data.account, direction: 'out', withMethod: false, onSaved: load });
    });

    // Entry delete
    $('chRows').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act="del"]');
        if (!btn) { return; }
        A.confirmDelete({ id: btn.getAttribute('data-id'), text: btn.getAttribute('data-text'), onDone: load });
    });

    // Opening cash
      // Asal cash (gin kar likhein, farq ki entry khud ban jati hai)
      $('chSetOpen').addEventListener('click', function () {
        A.setErr('coAmount', '');
        $('coAmount').value = data ? data.account.balance : '';
        A.openModal('coModal');
        setTimeout(function () { $('coAmount').focus(); }, 60);
    });

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