/*
 * Shared filter boxes: Invoices, Purchases aur Customer Statement mein use hote hain.
 *
 *   DateFilter.create({ mount, noun, onChange })   -> sirf From - To date range ka box
 *       .match('2026-10-15')  .getRange()  .clear(silent)
 *
 *   FilterSelect.create({ mount, options, value, allLabel, onChange })  -> Paid / Unpaid wala box
 *       .setCounts({ all: 40, paid: 5 })  .getValue()  .setValue(v)
 */
(function (global) {
    'use strict';

    var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function parse(s) { var p = s.split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
    function fmt(s) { if (!s) { return ''; } var d = parse(s); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
    function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }

    // ---------- Popup jo box ke neeche khulta hai ----------
    var openPop = null;

    function closeOpen() { if (openPop) { openPop.close(); } }

    function attachPopup(box, trigger, pop, beforeOpen) {
        document.body.appendChild(pop);

        // Popup hamesha poora screen ke andar rehta hai (neeche jagah na ho to upar ya screen ke andar khulta hai)
        function place() {
            var br = box.getBoundingClientRect();
            var w = pop.offsetWidth, h = pop.offsetHeight;
            var vw = window.innerWidth, vh = window.innerHeight;
            var left = Math.max(10, Math.min(br.left, vw - w - 10));
            var top = br.bottom + 8;

            if (top + h > vh - 10) {
                var above = br.top - h - 8;
                top = above >= 10 ? above : Math.max(10, vh - h - 10);
            }

            pop.style.left = left + 'px';
            pop.style.top = top + 'px';
        }

        var api = {
            open: function () {
                closeOpen();
                if (beforeOpen) { beforeOpen(); }
                pop.classList.add('show');
                box.classList.add('open');
                place();
                openPop = api;
            },
            close: function () {
                pop.classList.remove('show');
                box.classList.remove('open');
                if (openPop === api) { openPop = null; }
            },
            toggle: function () { if (pop.classList.contains('show')) { api.close(); } else { api.open(); } },
            isOpen: function () { return pop.classList.contains('show'); },
            contains: function (el) { return pop.contains(el) || box.contains(el); }
        };

        trigger.addEventListener('click', api.toggle);
        return api;
    }

    document.addEventListener('mousedown', function (e) {
        if (openPop && !openPop.contains(e.target)) { openPop.close(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeOpen(); } });
    window.addEventListener('resize', closeOpen);
    window.addEventListener('scroll', function (e) {
        if (openPop && !openPop.contains(e.target)) { openPop.close(); }
    }, true);

    // =========================================================
    //  Date box: sirf From aur To (toolbar mein seedha, koi popup nahi)
    // =========================================================
    function createDate(opts) {
        var state = { from: '', to: '' };
        var shownNow = 0;

        var slot = opts.mount;
        slot.classList.add('fb-slot');
        slot.innerHTML =
            '<div class="fb-range">' +
                '<i class="fa-regular fa-calendar"></i>' +
                '<label>From</label><input type="date" class="fb-date" data-k="from">' +
                '<label>To</label><input type="date" class="fb-date" data-k="to">' +
                '<button type="button" class="fb-x" title="Clear the dates"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            (opts.inlineCount ? '<span class="fb-inline"></span>' : '');

        var box = slot.querySelector('.fb-range');
        var inFrom = slot.querySelector('[data-k="from"]');
        var inTo = slot.querySelector('[data-k="to"]');
        var inlineEl = slot.querySelector('.fb-inline');
        var noun = opts.noun || 'records';

        function labelOf() {
            if (state.from && state.to) { return state.from === state.to ? fmt(state.from) : fmt(state.from) + ' to ' + fmt(state.to); }
            if (state.from) { return 'From ' + fmt(state.from); }
            if (state.to) { return 'Up to ' + fmt(state.to); }
            return 'All time';
        }

        function range() {
            return { from: state.from, to: state.to, mode: (state.from || state.to) ? 'range' : 'all', label: labelOf() };
        }

        // Jis box mein abhi likh rahi ho usko haath nahi lagate, warna likhi hui date mit jati hai
        function setInput(el, v, force) {
            if (el.value === v) { return; }
            if (force || document.activeElement !== el) { el.value = v; }
        }

        function paint(force) {
            setInput(inFrom, state.from, force);
            setInput(inTo, state.to, force);
            // Galat range chunna possible hi na ho
            inFrom.max = state.to || '';
            inTo.min = state.from || '';
            box.classList.toggle('active', !!(state.from || state.to));
        }

        function fire(force) {
            paint(force);
            if (opts.onChange) { opts.onChange(range()); }
        }

        // Saal 2000 se 2100 ke beech ho tabhi date maani jati hai (likhte waqt 0002, 0202 jaisa saal ignore hota hai)
        function sane(v) { return v >= '2000-01-01' && v <= '2100-12-31'; }

        function apply(key, el, onBlur) {
            var v = el.value;

            if (v && !sane(v)) {
                // Saal abhi poora nahi likha. Blur par purani date wapas
                if (onBlur) { el.value = state[key]; }
                return;
            }

            // Date adhoori hai (jaise sirf month likha), abhi likh rahi ho to wait karo
            if (!v && !onBlur && document.activeElement === el) { return; }

            if (state[key] === v) { return; }
            state[key] = v;

            if (key === 'from' && state.from && state.to && state.from > state.to) { state.to = state.from; }
            if (key === 'to' && state.from && state.to && state.to < state.from) { state.from = state.to; }

            fire();
        }

        inFrom.addEventListener('change', function () { apply('from', inFrom, false); });
        inTo.addEventListener('change', function () { apply('to', inTo, false); });
        inFrom.addEventListener('blur', function () { apply('from', inFrom, true); });
        inTo.addEventListener('blur', function () { apply('to', inTo, true); });

        slot.querySelector('.fb-x').addEventListener('click', function () {
            state.from = ''; state.to = '';
            fire(true);
        });

        paint();

        return {
            el: slot,

            match: function (dateStr) {
                if (state.from && dateStr < state.from) { return false; }
                if (state.to && dateStr > state.to) { return false; }
                return true;
            },

            getRange: range,

            clear: function (silent) {
                state.from = ''; state.to = '';
                if (silent) { paint(true); } else { fire(true); }
            },

            // Sirf tab dikhta hai jab page ne inlineCount maanga ho
            setCount: function (shown, total) {
                if (!inlineEl) { return; }
                shownNow = shown;
                inlineEl.innerHTML = '<b>' + shownNow + '</b> of ' + total + ' ' + noun;
            }
        };
    }

    // =========================================================
    //  Status box (All / Unpaid / Partial / Paid / Overdue)
    // =========================================================
    function createSelect(opts) {
        var options = opts.options;
        var value = opts.value || options[0].value;
        var counts = {};

        var slot = opts.mount;
        slot.classList.add('fb-slot');
        slot.innerHTML =
            '<div class="fb-box">' +
                '<button type="button" class="fb-trigger"><i class="fa-solid ' + (opts.icon || 'fa-list-check') + '"></i>' +
                    '<span class="fb-label"></span><i class="fa-solid fa-chevron-down fb-chev"></i></button>' +
            '</div>';

        var box = slot.querySelector('.fb-box');
        var trigger = slot.querySelector('.fb-trigger');
        var labelEl = slot.querySelector('.fb-label');

        var pop = document.createElement('div');
        pop.className = 'fb-pop fb-select-pop';
        var popup = attachPopup(box, trigger, pop);

        function labelFor(v) {
            if (v === options[0].value) { return opts.allLabel || options[0].label; }
            return options.filter(function (o) { return o.value === v; })[0].label;
        }

        function paint() {
            labelEl.textContent = labelFor(value);
            box.classList.toggle('active', value !== options[0].value);

            pop.innerHTML = options.map(function (o, i) {
                return '<button type="button" class="fb-opt' + (o.value === value ? ' on' : '') + '" data-v="' + o.value + '" style="--i:' + i + '">' +
                    '<span class="fb-opt-name"><i class="fa-solid fa-check"></i>' + o.label + '</span>' +
                    '<span class="fb-opt-count">' + (counts[o.value] === undefined ? '' : counts[o.value]) + '</span></button>';
            }).join('');
        }

        pop.addEventListener('click', function (e) {
            var opt = e.target.closest('.fb-opt');
            if (!opt) { return; }
            value = opt.getAttribute('data-v');
            paint();
            popup.close();
            if (opts.onChange) { opts.onChange(value); }
        });

        paint();

        return {
            el: slot,
            getValue: function () { return value; },
            setValue: function (v) { value = v; paint(); },
            setCounts: function (c) { counts = c; paint(); }
        };
    }

    // Table ki rows filter badalne par ek ek karke andar aati hain
    function animateRows(tbody) {
        if (!tbody) { return; }
        var rows = tbody.children;
        for (var i = 0; i < rows.length && i < 24; i++) { rows[i].style.setProperty('--n', i); }
        tbody.classList.remove('fb-rows');
        void tbody.offsetWidth;
        tbody.classList.add('fb-rows');
        setTimeout(function () { tbody.classList.remove('fb-rows'); }, 1200);
    }

    global.DateFilter = { create: createDate, animateRows: animateRows, format: fmt };
    global.FilterSelect = { create: createSelect };
})(window);