(function () {
    function $(id) { return document.getElementById(id); }
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function toStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function today() { return toStr(new Date()); }
    function money(n) { return formatMoney(n); }

    function fmt(s) {
        var p = s.split('-');
        return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function esc(t) {
        return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

    var categories = ['Rent', 'Utilities', 'Salaries', 'Transport', 'Supplies', 'Other'];

    // ---------- Data (ab database se aata hai) ----------
    var expenses = [];

    function loadExpenses() {
        return api('GET', '/expenses/list').then(function (data) {
            expenses = data;
            render();
        });
    }

    var state = { search: '', cat: 'all' };
    var editingId = null;
    var deleteId = null;

    function find(id) { return expenses.filter(function (e) { return e.id === id; })[0]; }
    function sum(list) { return list.reduce(function (s, e) { return s + e.amount; }, 0); }

    function toast(msg, type) {
        var t = $('exToast');
        t.textContent = msg;
        t.className = 'vd-toast show ' + (type || 'ok');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(function () { t.className = 'vd-toast'; }, 2400);
    }

    function setErr(id, msg) {
        var el = document.querySelector('[data-err="' + id + '"]');
        if (el) { el.textContent = msg || ''; }
        $(id).classList.toggle('vd-invalid', !!msg);
    }

    // Cards
    function cards() {
        var key = today().slice(0, 7);
        var d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - 1);
        var lastKey = d.getFullYear() + '-' + pad(d.getMonth() + 1);

        var month = expenses.filter(function (e) { return e.date.slice(0, 7) === key; });
        var last = expenses.filter(function (e) { return e.date.slice(0, 7) === lastKey; });
        var total = sum(month);
        var lastTotal = sum(last);

        $('cdMonth').textContent = money(total);
        $('cdMonthNote').textContent = month.length + ' expense(s)';
        $('cdLast').textContent = money(lastTotal);

        if (lastTotal > 0) {
            var pct = Math.round(((total - lastTotal) / lastTotal) * 100);
            $('cdLastNote').textContent = 'This month is ' + (pct >= 0 ? '+' : '') + pct + '%';
        } else {
            $('cdLastNote').textContent = 'No data last month';
        }

        var big = month.slice().sort(function (a, b) { return b.amount - a.amount; })[0];
        $('cdBig').textContent = big ? money(big.amount) : '-';
        $('cdBigNote').textContent = big ? big.title : 'No expenses yet';

        var totals = {};
        month.forEach(function (e) { totals[e.category] = (totals[e.category] || 0) + e.amount; });
        var top = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; })[0];
        $('cdTop').textContent = top || '-';
        $('cdTopNote').textContent = top ? money(totals[top]) : 'No expenses yet';
    }

    // List
    function render() {
        var q = state.search.trim().toLowerCase();

        var list = expenses.filter(function (e) {
            if (state.cat !== 'all' && e.category !== state.cat) { return false; }
            return !q || (e.title + ' ' + e.note + ' ' + e.category).toLowerCase().indexOf(q) !== -1;
        }).sort(function (a, b) {
            return a.date < b.date ? 1 : (a.date > b.date ? -1 : b.id - a.id);
        });

        $('exRows').innerHTML = list.length ? list.map(function (e) {
            return '<tr>' +
                '<td>' + fmt(e.date) + '</td>' +
                '<td><div class="vd-name">' + esc(e.title) + '</div>' +
                    (e.note ? '<div class="vd-company">' + esc(e.note) + '</div>' : '') + '</td>' +
                '<td><span class="vd-tag">' + esc(e.category) + '</span></td>' +
                '<td>' + esc(e.method) + '</td>' +
                '<td><div class="vd-amount">' + money(e.amount) + '</div></td>' +
                '<td class="ex-actions">' +
                    '<button type="button" class="vd-dots" data-act="edit" data-id="' + e.id + '" title="Edit"><i class="fa-regular fa-pen-to-square"></i></button>' +
                    '<button type="button" class="vd-dots ex-del" data-act="delete" data-id="' + e.id + '" title="Delete"><i class="fa-regular fa-trash-can"></i></button>' +
                '</td></tr>';
        }).join('') : '<tr class="vd-empty"><td colspan="6"><i class="fa-regular fa-folder-open"></i>No expenses found</td></tr>';

        $('exInfo').textContent = list.length + ' expense(s), total ' + money(sum(list));
        cards();
    }

    // Popups
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

    // Add / Edit
    var options = categories.map(function (c) { return '<option>' + c + '</option>'; }).join('');
    $('efCategory').innerHTML = options;
    $('exCat').innerHTML = '<option value="all">All categories</option>' + options;

    function openForm(e) {
        editingId = e ? e.id : null;
        ['efTitle', 'efAmount', 'efDate'].forEach(function (id) { setErr(id, ''); });

        $('exTitle').textContent = e ? 'Edit Expense' : 'Add Expense';
        $('efTitle').value = e ? e.title : '';
        $('efAmount').value = e ? e.amount : '';
        $('efDate').value = e ? e.date : today();
        $('efCategory').value = e ? e.category : 'Other';
        $('efMethod').value = e ? e.method : 'Cash';
        $('efNote').value = e ? e.note : '';

        openModal('exModal');
        setTimeout(function () { $('efTitle').focus(); }, 60);
    }

    $('exNew').addEventListener('click', function () { openForm(null); });

    $('efSave').addEventListener('click', function () {
        var title = $('efTitle').value.trim();
        var amount = parseFloat($('efAmount').value);
        var date = $('efDate').value;
        var ok = true;

        ['efTitle', 'efAmount', 'efDate'].forEach(function (id) { setErr(id, ''); });

        if (title.length < 2) { setErr('efTitle', 'Enter a title (at least 2 letters)'); ok = false; }
        if (isNaN(amount) || amount <= 0) { setErr('efAmount', 'Enter an amount greater than 0'); ok = false; }
        else if (amount > 100000000) { setErr('efAmount', 'Amount is too large'); ok = false; }

        if (!date) { setErr('efDate', 'Choose the date'); ok = false; }
        else if (date > today()) { setErr('efDate', 'Date cannot be in the future'); ok = false; }

        if (!ok) { return; }

        var data = {
            title: title,
            amount: Math.round(amount * 100) / 100,
            date: date,
            category: $('efCategory').value,
            method: $('efMethod').value,
            note: $('efNote').value.trim()
        };

        var request = editingId
            ? api('PUT', '/expenses/' + editingId, data)
            : api('POST', '/expenses', data);

        request
            .then(function () {
                toast(editingId ? 'Expense updated' : 'Expense added');
                closeModal('exModal');
                loadExpenses();
            })
            .catch(function (e) { toast(e.message || 'Could not save expense', 'err'); });
    });

    // Edit / Delete buttons
    $('exRows').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act]');
        if (!btn) { return; }

        var item = find(Number(btn.getAttribute('data-id')));
        if (!item) { return; }

        if (btn.getAttribute('data-act') === 'edit') {
            openForm(item);
        } else {
            deleteId = item.id;
            $('ecText').textContent = item.title + ' (' + money(item.amount) + ') will be removed. This cannot be undone.';
            openModal('exConfirm');
        }
    });

    $('ecOk').addEventListener('click', function () {
        var item = find(deleteId);
        if (!item) { return; }

        api('DELETE', '/expenses/' + item.id)
            .then(function () {
                closeModal('exConfirm');
                toast('Expense deleted');
                loadExpenses();
            })
            .catch(function (e) { toast(e.message || 'Could not delete expense', 'err'); });
    });

    // Search aur filter
    $('exSearch').addEventListener('input', function () { state.search = this.value; render(); });
    $('exCat').addEventListener('change', function () { state.cat = this.value; render(); });

    // Page khulte hi data mangwana
    loadExpenses();
})();