(function () {
    // ---------- Helpers ----------
    function $(id) { return document.getElementById(id); }

    function esc(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function fmtWhen(iso) {
        if (!iso) { return 'Never'; }
        var d = new Date(iso);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
            d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

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
                    var err = new Error(data.message || 'request failed');
                    err.errors = data.errors || {};
                    throw err;
                }
                return data;
            });
        });
    }

    function toast(message, type) {
        var t = $('usToast');
        t.textContent = message;
        t.className = 'vd-toast show ' + (type || 'ok');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(function () { t.className = 'vd-toast'; }, 2600);
    }

    function openModal(id) { $(id).classList.add('open'); }
    function closeModal(id) { $(id).classList.remove('open'); }

    function setErr(id, msg) {
        var el = document.querySelector('[data-err="' + id + '"]');
        if (el) { el.textContent = msg || ''; }
        var input = $(id);
        if (input) { input.classList.toggle('vd-invalid', !!msg); }
    }

    var formIds = ['ufName', 'ufEmail', 'ufPhone', 'ufRole', 'ufPass'];
    function clearErrs() { formIds.forEach(function (id) { setErr(id, ''); }); }

    // ---------- State ----------
    var users = [];
    var roles = [];
    var state = { filter: 'all', search: '', role: 'all' };
    var editingId = null;

    function find(id) { return users.filter(function (u) { return u.id === id; })[0]; }
    function roleInfo(key) { return roles.filter(function (r) { return r.key === key; })[0]; }

    function load() {
        return api('GET', '/users/list').then(function (data) {
            users = data.users;
            roles = data.roles;
            fillRoles();
            render();
        });
    }

    // ---------- Render ----------
    function fillRoles() {
        $('usRoles').innerHTML = roles.map(function (r) {
            return '<div class="us-role"><b><span class="us-badge us-badge-' + esc(r.key) + '">' + esc(r.label) + '</span></b>' +
                '<p>' + esc(r.about) + '</p></div>';
        }).join('');

        var selected = state.role;
        $('usRole').innerHTML = '<option value="all">All roles</option>' + roles.map(function (r) {
            return '<option value="' + esc(r.key) + '">' + esc(r.label) + '</option>';
        }).join('');
        $('usRole').value = selected;

        $('ufRole').innerHTML = '<option value="">Choose a role</option>' + roles.map(function (r) {
            return '<option value="' + esc(r.key) + '">' + esc(r.label) + '</option>';
        }).join('');
    }

    function visible() {
        var q = state.search.trim().toLowerCase();
        return users.filter(function (u) {
            if (state.filter === 'active' && !u.active) { return false; }
            if (state.filter === 'inactive' && u.active) { return false; }
            if (state.role !== 'all' && u.role !== state.role) { return false; }
            if (q && (u.name + ' ' + u.email + ' ' + u.job_title).toLowerCase().indexOf(q) === -1) { return false; }
            return true;
        });
    }

    function rowHtml(u) {
        var avatar = 'vd-av-' + (((u.id - 1) % 5) + 1);
        var statusBadge = u.active
            ? '<span class="vd-badge vd-badge-active">Active</span>'
            : '<span class="vd-badge vd-badge-inactive">Inactive</span>';

        return '<tr>' +
            '<td><div class="vd-vendor">' +
                '<span class="vd-avatar ' + avatar + '">' + esc(u.name.charAt(0).toUpperCase()) + '</span>' +
                '<div><div class="vd-name">' + esc(u.name) + (u.me ? '<span class="us-me">You</span>' : '') + '</div>' +
                '<div class="vd-company">' + esc(u.job_title || u.email) + '</div></div>' +
            '</div></td>' +
            '<td><span class="us-badge us-badge-' + esc(u.role) + '">' + esc(u.role_label) + '</span></td>' +
            '<td><div>' + esc(u.email) + '</div><div class="vd-bar-note">' + esc(u.phone || 'No phone') + '</div></td>' +
            '<td>' + esc(fmtWhen(u.last_login)) + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td><div class="us-actions">' +
                '<button type="button" class="us-act" data-act="edit" data-id="' + u.id + '" title="Edit"><i class="fa-regular fa-pen-to-square"></i></button>' +
                (u.me ? '' : '<button type="button" class="us-act ' + (u.active ? 'danger' : '') + '" data-act="toggle" data-id="' + u.id + '" title="' + (u.active ? 'Deactivate' : 'Activate') + '">' +
                    '<i class="fa-solid ' + (u.active ? 'fa-user-slash' : 'fa-user-check') + '"></i></button>') +
            '</div></td>' +
        '</tr>';
    }

    function render() {
        var list = visible();
        $('usRows').innerHTML = list.length
            ? list.map(rowHtml).join('')
            : '<tr class="vd-empty"><td colspan="6"><i class="fa-regular fa-folder-open"></i>No users found</td></tr>';

        var active = users.filter(function (u) { return u.active; }).length;
        $('usCardTotal').textContent = users.length;
        $('usCardActive').textContent = active;
        $('usCardInactive').textContent = users.length - active;
        $('usCardOwners').textContent = users.filter(function (u) { return u.role === 'owner'; }).length;

        var counts = { all: users.length, active: active, inactive: users.length - active };
        document.querySelectorAll('#usChips .vd-chip').forEach(function (chip) {
            chip.querySelector('span').textContent = counts[chip.getAttribute('data-filter')];
        });
    }

    // ---------- Add / Edit ----------
    function showRoleAbout() {
        var r = roleInfo($('ufRole').value);
        $('ufRoleAbout').textContent = r ? r.about : '';
    }
    $('ufRole').addEventListener('change', showRoleAbout);

    function openForm(u) {
        editingId = u ? u.id : null;
        clearErrs();

        $('usFormTitle').textContent = u ? 'Edit User' : 'Add User';
        $('usSave').textContent = u ? 'Save Changes' : 'Save User';

        $('ufName').value = u ? u.name : '';
        $('ufEmail').value = u ? u.email : '';
        $('ufPhone').value = u ? u.phone : '';
        $('ufJob').value = u ? u.job_title : '';
        $('ufRole').value = u ? u.role : '';
        $('ufStatus').value = u ? (u.active ? 'active' : 'inactive') : 'active';
        $('ufStatus').disabled = !!(u && u.me);
        $('ufRole').disabled = !!(u && u.me);
        $('ufPass').value = '';

        $('ufPassLabel').innerHTML = u ? 'New Password' : 'Password <span class="vd-req">*</span>';
        $('ufPassHint').textContent = u ? 'Leave empty to keep the current password. Type a new one to reset it.' : '';

        showRoleAbout();
        openModal('usFormModal');
        setTimeout(function () { $('ufName').focus(); }, 60);
    }

    function validPassword(p) {
        return p.length >= 8 && /[A-Za-z]/.test(p) && /[0-9]/.test(p);
    }

    function save() {
        clearErrs();
        var ok = true;

        var name = $('ufName').value.trim();
        var email = $('ufEmail').value.trim();
        var phone = $('ufPhone').value.trim();
        var role = $('ufRole').value;
        var pass = $('ufPass').value;

        if (name.length < 2) { setErr('ufName', 'Enter the full name (at least 2 letters)'); ok = false; }

        if (!email) { setErr('ufEmail', 'Enter the email'); ok = false; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('ufEmail', 'Enter a valid email like name@company.com'); ok = false; }
        else if (users.some(function (u) { return u.id !== editingId && u.email.toLowerCase() === email.toLowerCase(); })) {
            setErr('ufEmail', 'This email is already used by another user'); ok = false;
        }

        if (phone && !/^[0-9+\-\s()]+$/.test(phone)) { setErr('ufPhone', 'Phone can only have numbers, +, - and spaces'); ok = false; }
        if (!role) { setErr('ufRole', 'Choose a role'); ok = false; }

        if (!editingId && !pass) { setErr('ufPass', 'Set a password for this user'); ok = false; }
        else if (pass && !validPassword(pass)) { setErr('ufPass', 'Use at least 8 characters with letters and numbers'); ok = false; }

        if (!ok) { return; }

        var data = {
            name: name,
            email: email,
            phone: phone,
            job_title: $('ufJob').value.trim(),
            role: role,
            active: $('ufStatus').value === 'active'
        };
        if (pass) { data.password = pass; }

        var request = editingId ? api('PUT', '/users/' + editingId, data) : api('POST', '/users', data);

        request.then(function () {
            toast(editingId ? 'User updated' : 'User added');
            closeModal('usFormModal');
            load();
        }).catch(function (err) {
            var e = err.errors || {};
            var map = { name: 'ufName', email: 'ufEmail', phone: 'ufPhone', role: 'ufRole', password: 'ufPass' };
            var shown = false;
            Object.keys(map).forEach(function (k) {
                if (e[k]) { setErr(map[k], e[k][0]); shown = true; }
            });
            if (!shown) { toast(err.message || 'Could not save user', 'err'); }
        });
    }

    $('usNew').addEventListener('click', function () { openForm(null); });
    $('usSave').addEventListener('click', save);

    // ---------- Row buttons ----------
    $('usRows').addEventListener('click', function (e) {
        var btn = e.target.closest('.us-act');
        if (!btn) { return; }

        var u = find(Number(btn.getAttribute('data-id')));
        if (!u) { return; }

        if (btn.getAttribute('data-act') === 'edit') { openForm(u); return; }

        var next = !u.active;
        api('PUT', '/users/' + u.id + '/status', { active: next })
            .then(function () {
                toast(next ? u.name + ' is active again' : u.name + ' can no longer log in');
                load();
            })
            .catch(function (err) { toast(err.message || 'Could not change status', 'err'); });
    });

    // ---------- Popups, search, filters ----------
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

    $('usSearch').addEventListener('input', function () { state.search = this.value; render(); });
    $('usRole').addEventListener('change', function () { state.role = this.value; render(); });
    $('usChips').addEventListener('click', function (e) {
        var chip = e.target.closest('.vd-chip');
        if (!chip) { return; }
        document.querySelectorAll('#usChips .vd-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        state.filter = chip.getAttribute('data-filter');
        render();
    });

    load();
})();