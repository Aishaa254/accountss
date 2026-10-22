// Menu: ek waqt mein ek section
var menuLinks = document.querySelectorAll('.settings-link');
var sections = document.querySelectorAll('.section');

menuLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
        event.preventDefault();

        menuLinks.forEach(function (l) { l.classList.remove('active'); });
        sections.forEach(function (s) { s.classList.remove('active'); });

        link.classList.add('active');
        document.getElementById(link.dataset.section).classList.add('active');
    });
});

// Tabs: Font / Text / Theme / Logo
var tabButtons = document.querySelectorAll('.tab-btn');
var tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        tabButtons.forEach(function (b) { b.classList.remove('active'); });
        tabPanels.forEach(function (p) { p.classList.remove('active'); });

        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// Theme colors
var colorBoxes = document.querySelectorAll('.color-box');

function markColor(name) {
    colorBoxes.forEach(function (box) {
        box.classList.toggle('active', box.dataset.theme === name);
    });
}

markColor(localStorage.getItem('theme') || 'emerald');

colorBoxes.forEach(function (box) {
    box.addEventListener('click', function () {
        var name = box.dataset.theme;
        applyTheme(name);
        pending.theme = name;
        markColor(name);
    });
});

document.getElementById('reset-theme').addEventListener('click', function () {
    applyTheme('emerald');
    pending.theme = 'emerald';
    markColor('emerald');
});

// Light / Dark mode
var modeButtons = document.querySelectorAll('.mode-btn');

function markMode(mode) {
    modeButtons.forEach(function (button) {
        button.classList.toggle('active', button.dataset.mode === mode);
    });
}

markMode(localStorage.getItem('mode') || 'light');

modeButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        var mode = button.dataset.mode;
        applyMode(mode);
        pending.mode = mode;
        markMode(mode);
    });
});

// Font
var fontButtons = document.querySelectorAll('.font-btn');

function markFont(name) {
    fontButtons.forEach(function (button) {
        button.classList.toggle('active', button.dataset.font === name);
    });
}

markFont(localStorage.getItem('font') || 'segoe');

fontButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        var name = button.dataset.font;
        applyFont(name);
        pending.font = name;
        markFont(name);
    });
});

// Title input mein saved naam dikhao
var titleInput = document.getElementById('titleText');
if (titleInput) {
    titleInput.value = localStorage.getItem('appTitle') || 'AccountPro';
}

// Brand: Save Changes dabane par hi save
document.getElementById('brandSave').addEventListener('click', function () {
    if (pending.theme) {
        localStorage.setItem('theme', pending.theme);
    }
    if (pending.theme === 'custom' && pending.customColor) {
        localStorage.setItem('customColor', pending.customColor);
    }
    if (pending.mode) {
        localStorage.setItem('mode', pending.mode);
    }
    if (pending.font) {
        localStorage.setItem('font', pending.font);
    }

    if (titleInput) {
        var newTitle = titleInput.value.trim();
        if (newTitle) {
            localStorage.setItem('appTitle', newTitle);
            applyTitle();
        }
    }

    pending = {};
    alert('Brand settings saved');
});

// ===== Logo (Light / Dark preview) =====
(function () {
    var file = document.getElementById('lgFile');
    var chooseBtn = document.getElementById('lgChoose');
    var saveBtn = document.getElementById('lgSave');
    var removeBtn = document.getElementById('lgRemove');
    var msg = document.getElementById('lgMsg');
    if (!file || !chooseBtn || !saveBtn || !removeBtn) { return; }

    var imgs = document.querySelectorAll('#tab-logo .lg-img');
    var empties = document.querySelectorAll('#tab-logo .lg-empty');
    var pendingLogo = null;

    function show(text, type) {
        msg.textContent = text;
        msg.className = 'lg-msg ' + type;
    }

    function showPreview(src) {
        imgs.forEach(function (img) {
            if (src) {
                img.src = src;
                img.style.display = 'block';
            } else {
                img.removeAttribute('src');
                img.style.display = 'none';
            }
        });
        empties.forEach(function (e) {
            e.style.display = src ? 'none' : 'block';
        });
    }

    function updateSidebar() {
        if (typeof applySidebarLogo === 'function') {
            applySidebarLogo();
        }
    }

    showPreview(localStorage.getItem('brandLogo'));
    updateSidebar();

    chooseBtn.addEventListener('click', function () {
        file.click();
    });

    file.addEventListener('change', function () {
        var f = file.files[0];
        if (!f) { return; }

        if (f.type === 'image/svg+xml') {
            if (f.size > 200 * 1024) {
                show('SVG file is too big', 'error');
                file.value = '';
                return;
            }
            var svgReader = new FileReader();
            svgReader.onload = function () {
                pendingLogo = svgReader.result;
                showPreview(pendingLogo);
                show('Looks good? Click Save Logo', 'ok');
            };
            svgReader.readAsDataURL(f);
            return;
        }

        if (f.size > 10 * 1024 * 1024) {
            show('Image is too big (maximum 10 MB)', 'error');
            file.value = '';
            return;
        }

        var reader = new FileReader();
        reader.onload = function () {
            var img = new Image();
            img.onload = function () {
                var maxSize = 400;
                var scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                var canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

                pendingLogo = canvas.toDataURL('image/png');
                showPreview(pendingLogo);
                show('Looks good? Click Save Logo', 'ok');
            };
            img.onerror = function () {
                show('This image could not be read', 'error');
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(f);
    });

    saveBtn.addEventListener('click', function () {
        if (!pendingLogo) {
            show('Choose an image first', 'error');
            return;
        }
        try {
            localStorage.setItem('brandLogo', pendingLogo);
        } catch (e) {
            show('Could not save, try a smaller image', 'error');
            return;
        }
        pendingLogo = null;
        file.value = '';
        updateSidebar();
        show('Logo saved', 'ok');
    });

    removeBtn.addEventListener('click', function () {
        localStorage.removeItem('brandLogo');
        pendingLogo = null;
        file.value = '';
        showPreview(null);
        updateSidebar();
        show('Logo removed', 'ok');
    });
})();
// System: currency save (database mein)
var currencySelect = document.getElementById('currency');
var positionSelect = document.getElementById('symbolPosition');
var appSettings = window.APP_SETTINGS || {};
currencySelect.value = appSettings.currency || 'PKR';
positionSelect.value = appSettings.symbolPosition || 'before';

document.getElementById('systemSave').addEventListener('click', function () {
    fetch('/settings/system', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
            currency: currencySelect.value,
            symbol_position: positionSelect.value
        })
    })
    .then(function (res) {
        if (!res.ok) { throw new Error('failed'); }
        window.APP_SETTINGS = { currency: currencySelect.value, symbolPosition: positionSelect.value };
        applyCurrency();
        alert('System settings saved');
    })
    .catch(function () {
        alert('Could not save system settings');
    });
});

// ===== Company / Contact form validation =====
(function () {
    var RE_EMAIL    = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;
    var RE_URL      = /^(https?:\/\/)?(www\.)?[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}(\/\S*)?$/;
    var RE_NAME     = /^[A-Za-z0-9][A-Za-z0-9 .,&'()\-]*$/;
    var RE_REG      = /^[A-Za-z0-9\-\/]+$/;
    var RE_MOBILE   = /^(\+92|0)3\d{9}$/;
    var RE_LANDLINE = /^(\+92|0)[24-9]\d{8,9}$/;

    function strip(v) { return v.replace(/[\s\-]/g, ''); }

    var rules = {
        name: function (v) {
            if (v.length < 3) return 'must be at least 3 characters';
            if (!RE_NAME.test(v)) return "can only have letters, numbers, spaces and . , & ' ( ) -";
            return '';
        },
        reg: function (v) {
            if (v.length < 3) return 'must be at least 3 characters';
            if (!RE_REG.test(v)) return 'can only have letters, numbers, - and /';
            return '';
        },
        phone: function (v) {
            var p = strip(v);
            if (!RE_MOBILE.test(p) && !RE_LANDLINE.test(p)) {
                return 'is not valid. Example: 03001234567, +923001234567 or 042-35123456';
            }
            return '';
        },
        mobile: function (v) {
            if (!RE_MOBILE.test(strip(v))) {
                return 'is not valid. Example: 03001234567 or +923001234567';
            }
            return '';
        },
        email: function (v) {
            if (!RE_EMAIL.test(v) || v.indexOf('..') !== -1) {
                return 'is not valid. Example: name@example.com';
            }
            return '';
        },
        url: function (v) {
            if (!RE_URL.test(v)) return 'is not valid. Example: www.example.com';
            return '';
        },
        address: function (v) {
            if (v.length < 5) return 'must be at least 5 characters';
            return '';
        }
    };

    function getError(input) {
        var v = input.value.trim();
        var label = input.getAttribute('data-label') || 'This field';
        if (v === '') {
            return input.hasAttribute('data-required') ? label + ' is required' : '';
        }
        var fn = rules[input.getAttribute('data-rule')];
        var msg = fn ? fn(v) : '';
        return msg ? label + ' ' + msg : '';
    }

    function show(input, msg) {
        var box = input.parentNode.querySelector('.field-error');
        if (msg) {
            if (!box) {
                box = document.createElement('small');
                box.className = 'field-error';
                input.parentNode.appendChild(box);
            }
            box.textContent = msg;
            input.classList.add('is-invalid');
        } else {
            if (box) box.parentNode.removeChild(box);
            input.classList.remove('is-invalid');
        }
    }

    function isPhone(input) {
        var r = input.getAttribute('data-rule');
        return r === 'phone' || r === 'mobile';
    }

    document.querySelectorAll('.validate-form').forEach(function (form) {
        var inputs = form.querySelectorAll('[data-rule]');

        inputs.forEach(function (input) {
            input.addEventListener('input', function () {
                if (isPhone(input)) {
                    input.value = input.value.replace(/[^0-9+\-\s]/g, '');
                }
                if (input.classList.contains('is-invalid')) {
                    show(input, getError(input));
                }
            });
            input.addEventListener('blur', function () {
                input.value = input.value.trim();
                show(input, getError(input));
            });
        });

        form.addEventListener('submit', function (e) {
            var firstBad = null;
            inputs.forEach(function (input) {
                var msg = getError(input);
                show(input, msg);
                if (msg && !firstBad) firstBad = input;
            });
            if (firstBad) {
                e.preventDefault();
                firstBad.focus();
                return;
            }
            inputs.forEach(function (input) {
                if (isPhone(input) && input.value) input.value = strip(input.value);
            });
        });
    });

    // Server se error aaye to usi section ko khol do
       // Server se error ya success aaye to usi section ko khol do
       var page = document.querySelector('.settings-page');
       var openId = page ? page.getAttribute('data-open') : '';
       var bad = document.querySelector('.validate-form .is-invalid');
       if (bad && bad.closest('.section')) { openId = bad.closest('.section').id; }
       if (openId) {
           var link = document.querySelector('.settings-link[data-section="' + openId + '"]');
           if (link) link.click();
       }

    })();