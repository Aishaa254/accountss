/*
 * "Received in" / "Paid from" dropdown: Cash in Hand aur saare active banks.
 * Invoices, Customers aur Vendors teeno pages isay use karte hain.
 */
(function (global) {
    'use strict';

    function load() {
        return fetch('/accounts/options', { headers: { 'Accept': 'application/json' } })
            .then(function (res) { return res.ok ? res.json() : []; })
            .catch(function () { return []; });
    }

    function esc(t) {
        return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function labelOf(a) {
        return a.type === 'cash' ? a.name : a.name + (a.last4 ? ' (••••' + a.last4 + ')' : '');
    }

    function fill(select, list) {
        // Purana select andar se bharta rehta hai (taake .value aur isCash kaam karte rahein)
        select.innerHTML = list.map(function (a) {
            return '<option value="' + a.id + '" data-type="' + a.type + '">' + esc(labelOf(a)) + '</option>';
        }).join('');

        var options = list.map(function (a) {
            return {
                value: String(a.id),
                label: labelOf(a),
                icon: a.type === 'cash' ? 'fa-solid fa-money-bill-wave' : 'fa-solid fa-building-columns'
            };
        });
        var first = options.length ? options[0].value : null;

        if (select._sp) {
            select._sp.setOptions(options, first);
        } else {
            select._sp = SelectPicker.create({
                options: options,
                value: first,
                onChange: function (v) {
                    select.value = v;
                    select.dispatchEvent(new Event('change'));
                }
            });
            select.style.display = 'none';
            select.parentNode.insertBefore(select._sp.el, select.nextSibling);
        }
    }

    function isCash(select) {
        var opt = select.options[select.selectedIndex];
        return !!opt && opt.getAttribute('data-type') === 'cash';
    }

    global.AccountPicker = { load: load, fill: fill, isCash: isCash };
})(window);