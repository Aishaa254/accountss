(function () {
    // ---------- Chhote helpers ----------
    function $(id) { return document.getElementById(id); }

    function money(n) {
        return (n < 0 ? '- ' : '') + formatMoney(Math.round(Math.abs(n)));
    }

    function esc(t) {
        return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Number ko purani value se nayi value tak ghumana
    function animate(el, to, fmt, ms) {
        var from = el._v || 0;
        var start = null;
        el._v = to;
        fmt = fmt || money;

        function step(ts) {
            if (start === null) { start = ts; }
            var p = Math.min(1, (ts - start) / (ms || 700));
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = fmt(from + (to - from) * eased);
            if (p < 1) { requestAnimationFrame(step); }
        }
        requestAnimationFrame(step);
    }

    function pct(n) { return Math.round(n) + '%'; }

    var data = null;

    // ---------- 1. Profit Pulse ----------
    var periods = [
        { key: 'today', label: 'Today', icon: 'fa-sun', vs: 'yesterday' },
        { key: 'week', label: 'This week', icon: 'fa-calendar-week', vs: 'the same days last week' },
        { key: 'month', label: 'This month', icon: 'fa-calendar-days', vs: 'the same days last month' }
    ];

    function renderPulse() {
        $('adPulse').innerHTML = periods.map(function (p, i) {
            var n = data.pulse[p.key].now;
            var b = data.pulse[p.key].before;
            var diff = n.profit - b.profit;
            var better = diff >= 0;
            var arrow = '<span class="ad-arrow ' + (better ? 'green' : 'red') + '"><i class="fa-solid fa-arrow-' + (better ? 'up' : 'down') + '"></i> ' +
                (b.profit !== 0 ? Math.abs(Math.round((diff / Math.abs(b.profit)) * 100)) + '% ' : '') +
                (better ? 'better' : 'worse') + ' than ' + p.vs + '</span>';

            return '<div class="ad-card ad-pulse-card" style="--i:' + i + '">' +
                '<div class="ad-card-top"><span class="ad-ico"><i class="fa-solid ' + p.icon + '"></i></span><span>' + p.label + '</span></div>' +
                '<div class="ad-big ' + (n.profit < 0 ? 'neg' : '') + '" data-pulse="' + n.profit + '">0</div>' +
                arrow +
                '<div class="ad-mini">Sales ' + money(n.revenue) + ' &middot; Cost of goods ' + money(n.cost) + ' &middot; Expenses ' + money(n.expenses) + '</div>' +
                '</div>';
        }).join('');

        document.querySelectorAll('[data-pulse]').forEach(function (el) {
            animate(el, Number(el.getAttribute('data-pulse')), money, 1100);
        });
    }

    // ---------- 2. Smart tips ----------
    function waLink(phone, text) {
        if (!phone) { return '<span class="ad-wa off" title="No phone or WhatsApp number saved"><i class="fa-brands fa-whatsapp"></i> No number</span>'; }
        return '<a class="ad-wa" target="_blank" rel="noopener" href="https://wa.me/' + phone + '?text=' + encodeURIComponent(text) + '"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>';
    }

    function row(main, sub, right, extra) {
        return '<div class="ad-li"><div class="ad-li-main"><div>' + esc(main) + '</div><small>' + sub + '</small></div>' +
            '<div class="ad-li-right"><b>' + right + '</b>' + (extra || '') + '</div></div>';
    }

    var tipBuilders = {
        top: function (t) {
            return {
                title: 'Your best earners',
                text: 'These products made you the most profit in the last 30 days. Keep enough stock of them and promote them more.',
                list: t.items.map(function (x) {
                    var stock = x.stock !== null ? (x.low ? ' &middot; <span class="ad-bad">stock is low (' + x.stock + ' ' + esc(x.unit) + ' left)</span>' : ' &middot; ' + x.stock + ' ' + esc(x.unit) + ' in stock') : '';
                    return row(x.name, 'Margin ' + x.margin + '%' + stock, money(x.profit));
                })
            };
        },
        margin: function (t) {
            var why = {
                below_cost: 'Sold below its cost',
                low_margin: 'Very low margin',
                price_below_cost: 'Price is set below the cost',
                price_close: 'Price is very close to the cost'
            };
            return {
                title: 'Check these prices',
                text: 'These products give you very little profit, or lose money. Check if the price is right.',
                list: t.items.map(function (x) { return row(x.name, why[x.why], x.margin + '%'); })
            };
        },
        stuck: function (t) {
            return {
                title: 'Money stuck in stock',
                text: money(t.total) + ' is tied up in goods that have not sold for 60 days or more. A discount can bring the money back.',
                list: t.items.map(function (x) {
                    return row(x.name, x.qty + ' ' + esc(x.unit) + ' &middot; ' + (x.days === null ? 'never sold' : 'no sale for ' + x.days + ' days'), money(x.value));
                })
            };
        },
        quiet: function (t) {
            return {
                title: 'Customers who went quiet',
                text: 'These customers used to buy but have not ordered for over 45 days. A friendly message can bring them back.',
                list: t.items.map(function (x) {
                    var msg = 'Assalam o Alaikum ' + x.name + ', it has been a while since your last order. We have fresh stock and would be happy to serve you again. Please let us know if you need anything.';
                    return row(x.name, 'Last order ' + x.days + ' days ago', money(x.spent), waLink(x.phone, msg));
                })
            };
        },
        late: function (t) {
            return {
                title: 'Payments that are late',
                text: money(t.total) + ' is overdue. Send a polite reminder on WhatsApp.',
                list: t.items.map(function (x) {
                    var msg = 'Assalam o Alaikum ' + x.name + ', this is a friendly reminder that ' + money(x.amount) + ' is pending (' + x.invoices.join(', ') + '). Please send the payment when you can. Thank you.';
                    return row(x.name, x.days + ' days late &middot; ' + esc(x.invoices.join(', ')), money(x.amount), waLink(x.phone, msg));
                })
            };
        },
        cash: function (t) {
            var c = t.cash;
            var short = c.gap > 0;
            return {
                title: short ? 'Cash may run short in the next 30 days' : 'The next 30 days look comfortable',
                text: short
                    ? 'You need to pay ' + money(c.out) + ' but only ' + money(c.in) + ' is due to come in, a gap of ' + money(c.gap) + '. Collect late payments early, or talk to vendors about more time.'
                    : 'Money due to come in is more than money you have to pay. This is based only on invoices and purchases that have a due date.',
                list: [
                    row('Due to come in', 'Customer invoices due in the next 30 days', money(c.in)),
                    row('Already late', 'May still come, but not sure', money(c.late)),
                    row('You have to pay', 'Vendor bills due in 30 days, or already late', money(c.out))
                ]
            };
        },
        spike: function (t) {
            return {
                title: 'Expenses that jumped',
                text: 'These expenses are much higher this month than usual.',
                list: t.items.map(function (x) {
                    return row(x.category, x.new ? 'A new expense this month' : 'Usually about ' + money(x.usual) + ' a month', money(x.now));
                })
            };
        }
    };

    function renderTips() {
        if (!data.tips.length) {
            $('adTips').innerHTML = '<div class="ad-empty">There is not enough data for tips yet. Add some sales, stock and expenses and they will show up here.</div>';
            return;
        }

        $('adTips').innerHTML = data.tips.map(function (t, i) {
            var b = tipBuilders[t.key](t);
            return '<div class="ad-tip ' + t.tone + '" style="--i:' + i + '">' +
                '<div class="ad-tip-head"><span class="ad-tip-ico"><i class="fa-solid ' + t.icon + '"></i></span><h3>' + b.title + '</h3></div>' +
                '<p>' + b.text + '</p>' +
                '<div class="ad-list">' + b.list.join('') + '</div></div>';
        }).join('');
    }

    // ---------- 3. What if ----------
    function renderWhat() {
        var base = data.base;
        var profitNow = base.profit;

        $('adWhatBase').textContent = base.revenue
            ? 'Based on your sales and expenses of the last 30 days.'
            : 'You have no sales in the last 30 days, so there is nothing to work with yet.';

        function recalc() {
            var p = Number($('wPrice').value);
            var d = Number($('wDisc').value);
            var q = Number($('wQty').value);

            $('wPriceVal').textContent = '+' + p + '%';
            $('wDiscVal').textContent = d + '%';
            $('wQtyVal').textContent = (q > 0 ? '+' : '') + q + '%';

            var revenue = base.revenue * (1 + p / 100) * (1 - d / 100) * (1 + q / 100);
            var cost = base.cost * (1 + q / 100);
            var profitNew = revenue - cost - base.expenses;
            var diff = profitNew - profitNow;
            var max = Math.max(Math.abs(profitNow), Math.abs(profitNew), 1);

            animate($('wNow'), profitNow);
            animate($('wNew'), profitNew);

            [['wNowBar', profitNow], ['wNewBar', profitNew]].forEach(function (x) {
                var bar = $(x[0]);
                bar.style.width = Math.round((Math.abs(x[1]) / max) * 100) + '%';
                bar.className = 'ad-bar-fill' + (x[1] < 0 ? ' neg' : '');
            });

            var up = diff >= 0;
            $('wDiff').className = 'ad-diff ' + (up ? 'green' : 'red');
            $('wDiff').innerHTML = '<i class="fa-solid fa-arrow-' + (up ? 'up' : 'down') + '"></i> ' +
                'Your profit would ' + (up ? 'go up' : 'go down') + ' by <b id="wDiffAmt">0</b> in 30 days';
            animate($('wDiffAmt'), Math.abs(diff));
        }

        ['wPrice', 'wDisc', 'wQty'].forEach(function (id) { $(id).addEventListener('input', recalc); });
        recalc();
    }

    // ---------- 4. Savings plan ----------
    function renderPlan() {
        var plan = data.plan;
        var profit = plan.profit;

        $('adPlanBase').textContent = profit > 0
            ? 'Based on your net profit of ' + money(profit) + ' in the last 30 days.'
            : 'You have no net profit in the last 30 days, so there is nothing to split yet.';

        function recalc(changed) {
            var biz = Number($('sBiz').value);
            var em = Number($('sEm').value);

            // Dono milkar 100% se zyada na hon
            if (biz + em > 100) {
                if (changed === 'biz') { em = 100 - biz; $('sEm').value = em; }
                else { biz = 100 - em; $('sBiz').value = biz; }
            }

            var me = 100 - biz - em;
            var base = Math.max(profit, 0);

            $('sBizVal').textContent = biz + '%';
            $('sEmVal').textContent = em + '%';

            animate($('sBizAmt'), base * biz / 100);
            animate($('sEmAmt'), base * em / 100);
            animate($('sMeAmt'), base * me / 100);

            $('sSegBiz').style.width = biz + '%';
            $('sSegEm').style.width = em + '%';
            $('sSegMe').style.width = me + '%';

            var emAmt = base * em / 100;
            var t = '';

            if (!plan.target) {
                t = 'Add some expenses to see how much an emergency fund of 3 months would need.';
            } else if (base <= 0) {
                t = 'An emergency fund of 3 months of expenses would be ' + money(plan.target) + '.';
            } else if (emAmt <= 0) {
                t = 'An emergency fund of 3 months of expenses would be ' + money(plan.target) + '. Move the emergency slider to see how long it would take.';
            } else {
                var months = Math.ceil(plan.target / emAmt);
                t = 'An emergency fund of 3 months of expenses is ' + money(plan.target) + '. Saving ' + money(emAmt) + ' a month, you would reach it in about ' + months + (months === 1 ? ' month.' : ' months.');
            }

            $('sTarget').className = 'ad-diff';
            $('sTarget').textContent = t;
        }

        $('sBiz').addEventListener('input', function () { recalc('biz'); });
        $('sEm').addEventListener('input', function () { recalc('em'); });
        recalc('biz');
    }

    // ---------- 5. Ideas ----------
    var grow = [
        { icon: 'fa-boxes-packing', title: 'Bulk supply', text: 'Sell larger quantities at a slightly lower price to shops, offices or institutions.', pros: ['Bigger orders and steady income', 'Fewer trips and less handling per rupee sold'], cons: ['Lower margin on each item', 'Needs more stock and money upfront', 'A big customer paying late hurts more'] },
        { icon: 'fa-truck-fast', title: 'Delivery', text: 'Deliver to customers who cannot come to you.', pros: ['Reaches customers you do not get today', 'Can bring repeat orders'], cons: ['Fuel, rider and time costs', 'Complaints about late or damaged goods'] },
        { icon: 'fa-store', title: 'A separate counter for small customers', text: 'Keep a quick counter for small, cash purchases so they do not slow down big customers.', pros: ['Faster service for everyone', 'Cash sales mean no waiting for payment'], cons: ['Needs space and a person to run it', 'Small sales may have a thin margin'] },
        { icon: 'fa-gift', title: 'Combo packs', text: 'Put slow-moving items together with your best sellers at one price.', pros: ['Can clear stock that is not selling', 'Customers feel they are getting a deal'], cons: ['The combo price must still cover the cost of every item', 'Can teach customers to wait for deals'] }
    ];

    var save = [
        { icon: 'fa-rotate', title: 'Put it back into stock', text: 'Use the money to buy more of what already sells well.', pros: ['Can grow your profit', 'You stay in control'], cons: ['The money is not easy to take out quickly', 'All your eggs stay in one basket'] },
        { icon: 'fa-building-columns', title: 'Bank savings account', text: 'Keep money in a savings account.', pros: ['Easy to take out when needed', 'Simple and familiar'], cons: ['The return is usually low', 'Prices rise, so money can lose value over time'] },
        { icon: 'fa-file-contract', title: 'Fixed deposit or national savings schemes', text: 'Lock money for a fixed period for a set return.', pros: ['Return is known in advance', 'Disciplined saving'], cons: ['Money is locked, early withdrawal can cost you', 'Rates and tax rules change'] },
        { icon: 'fa-ring', title: 'Gold', text: 'Buy gold as a way to keep value over many years.', pros: ['Has kept value over the long term', 'Easy to understand'], cons: ['The price goes up and down', 'Making charges and selling costs', 'Needs safe storage'] },
        { icon: 'fa-people-group', title: 'Committee', text: 'Join a savings circle where members pay in monthly and take turns receiving the pot.', pros: ['Forces a saving habit', 'No bank needed'], cons: ['Depends on everyone paying on time', 'No return on your money'] },
        { icon: 'fa-chart-line', title: 'Mutual funds', text: 'Put money in a fund that invests in many things together.', pros: ['Can grow more than a bank account', 'Spread across many investments'], cons: ['The value can go down as well as up', 'You need to understand what you are buying first'] }
    ];

    function ideaCards(list) {
        return list.map(function (x, i) {
            return '<div class="ad-idea" style="--i:' + i + '"><div class="ad-idea-head"><span class="ad-ico"><i class="fa-solid ' + x.icon + '"></i></span><h4>' + x.title + '</h4></div>' +
                '<p>' + x.text + '</p>' +
                '<ul class="pro">' + x.pros.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' +
                '<ul class="con">' + x.cons.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul></div>';
        }).join('');
    }

    function renderIdeas() {
        $('adGrow').innerHTML = ideaCards(grow);
        $('adSave').innerHTML = ideaCards(save);
    }

    // ---------- Start ----------
    renderIdeas();

    fetch('/advisor/data', { headers: { 'Accept': 'application/json' } })
        .then(function (res) {
            if (!res.ok) { throw new Error('request failed'); }
            return res.json();
        })
        .then(function (d) {
            data = d;
            renderPulse();
            renderTips();
            renderWhat();
            renderPlan();
        })
        .catch(function () {
            $('adPulse').innerHTML = '<div class="ad-empty">The advisor could not be loaded. Please refresh the page.</div>';
        });
})();