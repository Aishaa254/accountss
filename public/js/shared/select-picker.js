// SelectPicker.create({ options: [{ value, label, note, icon }], value: 'x', onChange: function (v) {} })
// returns { el, get(), set(value) }
(function () {
    function esc(t) {
        return String(t == null ? '' : t)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    window.SelectPicker = {
        create: function (opts) {
            var options = opts.options || [];
            var value = opts.value !== undefined ? opts.value : (options[0] ? options[0].value : null);
            var hi = 0;
            var isOpen = false;

            var el = document.createElement('div');
            el.className = 'pp';
            el.tabIndex = 0;

            var panel = document.createElement('div');
            panel.className = 'pp-panel';
            panel.innerHTML = '<div class="pp-list"></div>';
            document.body.appendChild(panel);
            var listEl = panel.querySelector('.pp-list');

            function find(v) {
                return options.filter(function (o) { return o.value === v; })[0] || null;
            }

            function iconHtml(o) {
                return '<span class="pp-av"><i class="' + esc(o && o.icon ? o.icon : 'fa-solid fa-list') + '"></i></span>';
            }

            function paint() {
                var o = find(value);
                el.innerHTML = iconHtml(o) +
                    '<span class="pp-text"><b>' + esc(o ? o.label : '') + '</b></span>' +
                    '<i class="fa-solid fa-chevron-down pp-chev"></i>';
            }

            function renderList() {
                listEl.innerHTML = options.map(function (o, i) {
                    return '<div class="pp-item' + (i === hi ? ' hi' : '') + (o.value === value ? ' sel' : '') +
                        '" data-i="' + i + '">' + iconHtml(o) +
                        '<span class="pp-info"><b>' + esc(o.label) + '</b>' +
                        (o.note ? '<small>' + esc(o.note) + '</small>' : '') + '</span></div>';
                }).join('');
            }

            function position() {
                var r = el.getBoundingClientRect();
                panel.style.width = r.width + 'px';
                panel.style.left = r.left + 'px';
                var listH = panel.offsetHeight || 150;
                if (window.innerHeight - r.bottom < listH + 20 && r.top > listH) {
                    panel.style.top = 'auto';
                    panel.style.bottom = (window.innerHeight - r.top + 6) + 'px';
                    panel.classList.add('up');
                } else {
                    panel.style.bottom = 'auto';
                    panel.style.top = (r.bottom + 6) + 'px';
                    panel.classList.remove('up');
                }
            }

            function open() {
                var idx = options.findIndex(function (o) { return o.value === value; });
                hi = idx < 0 ? 0 : idx;
                renderList();
                position();
                panel.classList.add('open');
                el.classList.add('open');
                isOpen = true;
            }

            function close() {
                panel.classList.remove('open');
                el.classList.remove('open');
                isOpen = false;
            }

            function choose(i) {
                var o = options[i];
                if (!o) { return; }
                var changed = o.value !== value;
                value = o.value;
                paint();
                close();
                el.focus();
                if (changed && opts.onChange) { opts.onChange(value); }
            }

            el.addEventListener('click', function () { if (isOpen) { close(); } else { open(); } });

            el.addEventListener('keydown', function (e) {
                if (!isOpen) {
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); open(); }
                    return;
                }
                if (e.key === 'ArrowDown') { e.preventDefault(); hi = (hi + 1) % options.length; renderList(); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); hi = (hi - 1 + options.length) % options.length; renderList(); }
                else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(hi); }
                else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
            });

            listEl.addEventListener('mousedown', function (e) { e.preventDefault(); });
            listEl.addEventListener('click', function (e) {
                var row = e.target.closest('.pp-item');
                if (row) { choose(Number(row.getAttribute('data-i'))); }
            });

            document.addEventListener('mousedown', function (e) {
                if (isOpen && !panel.contains(e.target) && !el.contains(e.target)) { close(); }
            });
            window.addEventListener('resize', close);
            window.addEventListener('scroll', function (e) {
                if (isOpen && !panel.contains(e.target)) { close(); }
            }, true);

            paint();

            return {
                el: el,
                get: function () { return value; },
                set: function (v) { value = v; paint(); },
                setOptions: function (list, v) {
                    options = list;
                    value = v;
                    paint();
                }
            };
        }
    };
})();