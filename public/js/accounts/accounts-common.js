/*
 * Cash aur Bank pages ka shared code: paisa daalna/nikalna, statement table,
 * ginti wala balance, chhota graph aur print. Dono pages isi ko use karte hain.
 */
(function (global) {
    'use strict';

    function $(id) { return document.getElementById(id); }
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function money(n) { return formatMoney(n); }

    function fmt(s) {
        var p = s.split('-');
        return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function esc(t) {
        return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    var KIND = { deposit: 'Money added', withdraw: 'Money taken out', payment_in: 'Payment received', payment_out: 'Payment made', expense: 'Expense', adjustment: 'Cash count adjustment' };
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
                if (!res.ok) {
                    var err = new Error(data.message || 'Request failed');
                    err.errors = data.errors || {};
                    throw err;
                }
                return data;
            });
        });
    }

    function toast(msg, type) {
        var t = $('acToast');
        if (!t) { return; }
        t.textContent = msg;
        t.className = 'vd-toast show ' + (type || 'ok');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(function () { t.className = 'vd-toast'; }, 2600);
    }

    function setErr(id, msg) {
        var el = document.querySelector('[data-err="' + id + '"]');
        if (el) { el.textContent = msg || ''; }
        if ($(id)) { $(id).classList.toggle('vd-invalid', !!msg); }
    }

    function openModal(id) { $(id).classList.add('open'); }
    function closeModal(id) { $(id).classList.remove('open'); }

    document.addEventListener('click', function (e) {
        var closer = e.target.closest('[data-close]');
        if (closer) { closeModal(closer.getAttribute('data-close')); return; }
        if (e.target.classList.contains('vd-modal-overlay')) { e.target.classList.remove('open'); }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.vd-modal-overlay.open').forEach(function (m) { m.classList.remove('open'); });
        }
    });

    // ---------- Ginti wala balance ----------
    function countUp(el, to) {
        var from = Number(el.getAttribute('data-val') || 0);
        el.setAttribute('data-val', to);
        el._acRun = (el._acRun || 0) + 1;
        var run = el._acRun;

        if (from === to || (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
            el.textContent = money(to);
            return;
        }

        var start = null;
        function step(ts) {
            if (el._acRun !== run) { return; }
            if (start === null) { start = ts; }
            var p = Math.min((ts - start) / 900, 1);
            var e = 1 - Math.pow(1 - p, 3);
            el.textContent = money(Math.round((from + (to - from) * e) * 100) / 100);
            if (p < 1) { requestAnimationFrame(step); }
        }
        requestAnimationFrame(step);
    }

    // ---------- 30 din ka chhota graph ----------
    function spark(values) {
        var w = 120, h = 36, gap = 3;
        var min = Math.min.apply(null, values);
        var max = Math.max.apply(null, values);
        var range = (max - min) || 1;

        var pts = values.map(function (v, i) {
            var x = (i / (values.length - 1)) * w;
            var y = h - gap - ((v - min) / range) * (h - gap * 2);
            return x.toFixed(1) + ',' + y.toFixed(1);
        });

        return '<svg class="ac-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
            '<polygon class="ac-spark-area" points="0,' + h + ' ' + pts.join(' ') + ' ' + w + ',' + h + '"/>' +
            '<polyline class="ac-spark-line" points="' + pts.join(' ') + '"/></svg>';
    }

    // ---------- Statement ----------
    function statementRows(st) {
        if (!st.rows.length) {
            return '<tr class="vd-empty"><td colspan="7"><i class="fa-regular fa-folder-open"></i>No entries in this period</td></tr>';
        }

        var html = st.rows.slice().reverse().map(function (r) {
            var isIn = r.direction === 'in';
            var label = KIND[r.kind] || r.kind;
            var sub = [r.method, r.reference ? 'Ref ' + r.reference : '', r.note].filter(Boolean).join(' · ');

            return '<tr>' +
                '<td>' + fmt(r.date) + '</td>' +
                '<td><div class="vd-name">' + esc(label) + '</div>' + (sub ? '<div class="vd-company">' + esc(sub) + '</div>' : '') + '</td>' +
                '<td class="ac-num ac-in">' + (isIn ? '+' + money(r.amount) : '') + '</td>' +
                '<td class="ac-num ac-out">' + (!isIn ? '-' + money(r.amount) : '') + '</td>' +
                '<td class="ac-num ac-bal">' + money(r.balance) + '</td>' +
                '<td class="ac-by">' + esc(r.by) + '</td>' +
                '<td class="ac-num">' + (r.deletable
                    ? '<button type="button" class="vd-dots ac-del" data-act="del" data-id="' + r.id + '" data-text="' + esc(label + ' ' + money(r.amount)) + '" title="Delete"><i class="fa-regular fa-trash-can"></i></button>'
                    : '') + '</td>' +
                '</tr>';
        }).join('');

        return html +
            '<tr class="ac-open-row"><td></td><td><div class="vd-name">Opening balance</div></td><td></td><td></td>' +
            '<td class="ac-num ac-bal">' + money(st.opening) + '</td><td></td><td></td></tr>';
    }

    function renderStrip(el, st) {
        el.innerHTML =
            '<div><small>Opening balance</small><b>' + money(st.opening) + '</b></div>' +
            '<div><small>Money in</small><b class="ac-in">' + money(st['in']) + '</b></div>' +
            '<div><small>Money out</small><b class="ac-out">' + money(st.out) + '</b></div>' +
            '<div><small>Closing balance</small><b>' + money(st.closing) + '</b></div>';
    }

    function printStatement(account, st, label) {
        var w = window.open('', '_blank');
        if (!w) { toast('Allow pop-ups to print the statement', 'err'); return; }

        var brand = (global.APP_BRAND && global.APP_BRAND.title) || 'AccountPro';

        var rows = st.rows.map(function (r) {
            var isIn = r.direction === 'in';
            var sub = [r.method, r.reference ? 'Ref ' + r.reference : '', r.note].filter(Boolean).join(' | ');
            return '<tr><td>' + fmt(r.date) + '</td><td>' + esc(KIND[r.kind] || r.kind) + (sub ? '<br><small>' + esc(sub) + '</small>' : '') + '</td>' +
                '<td class="n">' + (isIn ? money(r.amount) : '') + '</td>' +
                '<td class="n">' + (!isIn ? money(r.amount) : '') + '</td>' +
                '<td class="n">' + money(r.balance) + '</td></tr>';
        }).join('');

        var css = 'body{font-family:Segoe UI,Arial,sans-serif;color:#1e293b;padding:28px}h1{margin:0;font-size:22px}p{margin:4px 0 14px;color:#64748b}' +
            'table{width:100%;border-collapse:collapse;font-size:13px}th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;vertical-align:top}' +
            'th{background:#f1f5f9}.n{text-align:right;white-space:nowrap}small{color:#64748b}' +
            '.sum{display:flex;gap:28px;margin:10px 0 18px;font-size:13px}.sum b{display:block;font-size:15px}';

        w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + esc(account.name) + ' - Statement</title><style>' + css + '</style></head><body>' +
            '<h1>' + esc(brand) + '</h1>' +
            '<p>Statement: ' + esc(account.name) + ' | ' + esc(label || 'All dates') + '</p>' +
            '<div class="sum"><div>Opening<b>' + money(st.opening) + '</b></div><div>Money in<b>' + money(st['in']) + '</b></div>' +
            '<div>Money out<b>' + money(st.out) + '</b></div><div>Closing<b>' + money(st.closing) + '</b></div></div>' +
            '<table><thead><tr><th>Date</th><th>Details</th><th class="n">In</th><th class="n">Out</th><th class="n">Balance</th></tr></thead><tbody>' +
            '<tr><td></td><td><b>Opening balance</b></td><td></td><td></td><td class="n">' + money(st.opening) + '</td></tr>' +
            rows + '</tbody></table></body></html>');
        w.document.close();
        w.focus();
        setTimeout(function () { w.print(); }, 300);
    }

    // ---------- Paisa daalo / nikalo popup ----------
    var entryCtx = null;
    var delCtx = null;

    function mountModals() {
        var wrap = document.createElement('div');
        wrap.innerHTML =
            '<div class="vd-modal-overlay" id="acEntry"><div class="vd-modal">' +
                '<div class="vd-modal-head"><h3 id="aeTitle">Add Money</h3>' +
                '<button type="button" class="vd-close" data-close="acEntry"><i class="fa-solid fa-xmark"></i></button></div>' +
                '<div class="vd-modal-body"><div class="vd-grid">' +
                    '<div class="vd-field vd-full"><div class="ac-avail" id="aeAvail"></div></div>' +
                    '<div class="vd-field"><label>Amount (<span class="cur-sym">Rs</span>) <span class="vd-req">*</span></label>' +
                        '<input type="number" class="vd-input" id="aeAmount" min="0" step="any" placeholder="0"><small class="vd-err" data-err="aeAmount"></small></div>' +
                    '<div class="vd-field"><label>Date <span class="vd-req">*</span></label>' +
                        '<input type="date" class="vd-input" id="aeDate"><small class="vd-err" data-err="aeDate"></small></div>' +
                        '<div style="display:none"><div class="vd-field" id="aeMethodBox"><label>Method</label>' +
                        '<select class="vd-input" id="aeMethod"><option>Cash</option><option>Cheque</option><option>Online</option><option>Other</option></select></div></div>' +
                    '<div class="vd-field" id="aeRefBox"><label>Reference no.</label>' +
                        '<input type="text" class="vd-input" id="aeRef" maxlength="60" placeholder="Optional"></div>' +
                    '<div class="vd-field vd-full"><label>Note</label>' +
                        '<input type="text" class="vd-input" id="aeNote" maxlength="150" placeholder="Optional"></div>' +
                '</div></div>' +
                '<div class="vd-modal-foot"><button type="button" class="vd-btn-ghost" data-close="acEntry">Cancel</button>' +
                '<button type="button" class="vd-btn-primary" id="aeSave">Save</button></div>' +
            '</div></div>' +
            '<div class="vd-modal-overlay" id="acConfirm"><div class="vd-modal vd-modal-sm">' +
                '<div class="vd-modal-body vd-confirm"><div class="vd-confirm-icon"><i class="fa-regular fa-trash-can"></i></div>' +
                '<h3>Delete this entry?</h3><p id="acConfirmText"></p></div>' +
                '<div class="vd-modal-foot"><button type="button" class="vd-btn-ghost" data-close="acConfirm">Cancel</button>' +
                '<button type="button" class="vd-btn-danger" id="acConfirmOk">Yes, delete</button></div>' +
            '</div></div>';

        while (wrap.firstChild) { document.body.appendChild(wrap.firstChild); }
        if (typeof applyCurrency === 'function') { applyCurrency(); }

        $('aeSave').addEventListener('click', saveEntry);
        $('acConfirmOk').addEventListener('click', function () {
            if (!delCtx) { return; }
            api('DELETE', '/account-entries/' + delCtx.id)
                .then(function () {
                    closeModal('acConfirm');
                    toast('Entry deleted');
                    delCtx.onDone();
                })
                .catch(function (e) { closeModal('acConfirm'); toast(e.message, 'err'); });
        });
    }

    function openEntry(opts) {
        entryCtx = opts;
        var isIn = opts.direction === 'in';

        setErr('aeAmount', '');
        setErr('aeDate', '');
        $('aeTitle').textContent = (isIn ? 'Add money to ' : 'Take money out of ') + opts.account.name;
        $('aeAvail').innerHTML = 'Available balance: <b>' + money(opts.account.balance) + '</b>';
        $('aeAmount').value = '';
        $('aeDate').value = today();
        $('aeDate').max = today();
        $('aeMethod').value = 'Cash';
        $('aeRef').value = '';
        $('aeNote').value = '';
        $('aeMethodBox').style.display = opts.withMethod ? '' : 'none';
        $('aeRefBox').style.display = opts.withMethod ? '' : 'none';
        $('aeSave').textContent = isIn ? 'Add Money' : 'Take Out';

        openModal('acEntry');
        setTimeout(function () { $('aeAmount').focus(); }, 60);
    }

    function saveEntry() {
        if (!entryCtx) { return; }

        var amount = parseFloat($('aeAmount').value);
        var date = $('aeDate').value;
        var ok = true;

        setErr('aeAmount', '');
        setErr('aeDate', '');

        if (isNaN(amount) || amount <= 0) { setErr('aeAmount', 'Enter an amount greater than 0'); ok = false; }
        else if (amount > 100000000) { setErr('aeAmount', 'Amount is too large'); ok = false; }
        else if (entryCtx.direction === 'out' && amount > entryCtx.account.balance) {
            setErr('aeAmount', 'Not enough money. Available: ' + money(entryCtx.account.balance));
            ok = false;
        }

        if (!date) { setErr('aeDate', 'Choose the date'); ok = false; }
        else if (date > today()) { setErr('aeDate', 'Date cannot be in the future'); ok = false; }

        if (!ok) { return; }

        var btn = $('aeSave');
        btn.disabled = true;

        api('POST', '/accounts/' + entryCtx.account.id + '/entry', {
            direction: entryCtx.direction,
            amount: Math.round(amount * 100) / 100,
            date: date,
            method: entryCtx.withMethod ? $('aeMethod').value : null,
            reference: $('aeRef').value.trim(),
            note: $('aeNote').value.trim()
        })
            .then(function () {
                toast(entryCtx.direction === 'in' ? 'Money added' : 'Money taken out');
                closeModal('acEntry');
                entryCtx.onSaved();
            })
            .catch(function (e) {
                if (e.errors && e.errors.amount) { setErr('aeAmount', e.errors.amount[0]); }
                else if (e.errors && e.errors.date) { setErr('aeDate', e.errors.date[0]); }
                else { toast(e.message, 'err'); }
            })
            .then(function () { btn.disabled = false; });
    }

    function confirmDelete(opts) {
        delCtx = opts;
        $('acConfirmText').textContent = opts.text + ' will be removed. This cannot be undone.';
        openModal('acConfirm');
    }

    mountModals();

    global.Acc = {
        $: $, money: money, esc: esc, fmt: fmt, today: today, api: api, toast: toast, setErr: setErr,
        openModal: openModal, closeModal: closeModal, countUp: countUp, spark: spark,
        statementRows: statementRows, renderStrip: renderStrip, printStatement: printStatement,
        openEntry: openEntry, confirmDelete: confirmDelete
    };
})(window);