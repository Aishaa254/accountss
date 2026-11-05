/*
 * Customer Statement mein date / month ka filter.
 *
 * Ye file customers.js ke BAAD load hoti hai aur sirf Statement wale hisse ko behtar banati hai.
 * customers.js ko is se koi farq nahi parta.
 */
(function () {
    if (typeof DateFilter === 'undefined' || typeof showStatement === 'undefined') { return; }

    var filter = null;
    var current = null; // jis customer ka statement khula hai
    var company = {};

    function inRange(e, range) {
        if (range.from && e.date < range.from) { return false; }
        if (range.to && e.date > range.to) { return false; }
        return true;
    }

    function row(date, desc, debit, credit, running) {
        return '<tr><td>' + esc(date) + '</td><td>' + esc(desc) + '</td>' +
            '<td class="r">' + (debit ? money(debit) : '-') + '</td>' +
            '<td class="r">' + (credit ? money(credit) : '-') + '</td>' +
            '<td class="r">' + money(running) + (running < 0 ? ' Cr' : '') + '</td></tr>';
    }

    // Statement ka HTML (range khali ho to poora statement)
    function build(c, co, range) {
        range = range || {};
        var running = c.opening;
        var rows = '';
        var shown = 0, totalDebit = 0, totalCredit = 0;

        if (range.from) {
            // Range se pehle ka hisaab "Balance brought forward" ban jata hai
            c.ledger.forEach(function (e) { if (e.date < range.from) { running += e.debit - e.credit; } });
            rows += row(range.from, 'Balance brought forward', 0, 0, running);
        } else if (c.opening !== 0) {
            rows += row('-', 'Opening balance', 0, 0, running);
        }

        c.ledger.forEach(function (e) {
            if (!inRange(e, range)) { return; }
            running += e.debit - e.credit;
            totalDebit += e.debit;
            totalCredit += e.credit;
            shown++;
            rows += row(e.date, e.desc, e.debit, e.credit, running);
        });

        if (!shown) {
            rows += '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:18px;">' +
                (range.from || range.to ? 'No entries in this period.' : 'No entries yet.') + '</td></tr>';
        }

        var closing = running > 0 ? 'Balance due from customer: <b>' + money(running) + '</b>'
            : (running < 0 ? 'We owe the customer: <b>' + money(running) + '</b>' : 'Account is clear: <b>' + money(0) + '</b>');

        var hasRange = range.mode && range.mode !== 'all';

        return '<div class="st-doc">' +
            '<div class="st-top">' +
                '<div><div class="st-co">' + esc(co.name || 'Your Company') + '</div>' +
                    '<div class="st-small">' + esc(co.address || '') + '<br>' + esc(co.phone || '') + '</div></div>' +
                '<div><div class="st-title">STATEMENT</div>' +
                    '<div class="st-small" style="text-align:right;">Date: ' + localToday() + '</div>' +
                    (hasRange ? '<div class="st-small" style="text-align:right;"><b>Period: ' + esc(range.label) + '</b></div>' : '') +
                '</div>' +
            '</div>' +
            '<div class="st-cust"><b>' + esc(c.name) + '</b><br>' +
                esc(c.phone) + (c.city ? ' - ' + esc(c.city) : '') +
                (c.address ? '<br>' + esc(c.address) : '') + '</div>' +
            '<table><thead><tr><th>Date</th><th>Details</th><th class="r">Debit</th><th class="r">Credit</th><th class="r">Balance</th></tr></thead>' +
                '<tbody>' + rows + '</tbody></table>' +
            '<div style="margin-top:12px;text-align:right;color:#64748b;font-size:12px;">Total debit: <b>' + money(totalDebit) + '</b> &nbsp;|&nbsp; Total credit: <b>' + money(totalCredit) + '</b></div>' +
            '<div class="st-close">' + closing + '</div>' +
            '<div class="st-note">Debit = invoice created. Credit = payment received. Cr = we owe the customer.</div>' +
        '</div>';
    }

    function render() {
        if (!current) { return; }

        var r = filter.getRange();
        var inside = current.ledger.filter(function (e) { return inRange(e, r); }).length;

        stCurrent = {
            html: build(current, company, r),
            title: 'Statement - ' + current.name + (r.mode !== 'all' ? ' (' + r.label + ')' : '')
        };

        $('st-body').innerHTML = stCurrent.html;
        filter.setCount(inside, current.ledger.length);
    }

    // Statement ke upar sirf From - To (alag popup nahi)
    var mount = document.createElement('div');
    mount.id = 'st-filter';
    mount.style.cssText = 'margin-bottom:12px;';
    $('st-body').parentNode.insertBefore(mount, $('st-body'));

    filter = DateFilter.create({
        mount: mount,
        noun: 'entries',
        onChange: function () {
            render();
            DateFilter.animateRows($('st-body').querySelector('tbody'));
        }
    });

    // customers.js ke purane functions ki jagah naye
    window.statementHtml = build;

    window.showStatement = function (c) {
        fetch('/company/info', { headers: { 'Accept': 'application/json' } })
            .then(function (res) { return res.json(); })
            .catch(function () { return {}; })
            .then(function (co) {
                current = c;
                company = co || {};
                filter.clear(true); // har baar naya statement poori date range se shuru hota hai
                render();
                stModal.classList.add('show');
            });
    };
})();