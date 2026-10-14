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
        localStorage.setItem('theme', name);
        markColor(name);
    });
});

document.getElementById('reset-theme').addEventListener('click', function () {
    applyTheme('emerald');
    localStorage.removeItem('theme');
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
        localStorage.setItem('mode', mode);
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
        localStorage.setItem('font', name);
        markFont(name);
    });
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
    var pending = null;

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

    // Sidebar ka logo theme.js wala function lagata hai
    function updateSidebar() {
        if (typeof applySidebarLogo === 'function') {
            applySidebarLogo();
        }
    }

    // Page khulte hi saved logo dikhao
    showPreview(localStorage.getItem('brandLogo'));
    updateSidebar();

    chooseBtn.addEventListener('click', function () {
        file.click();
    });

    file.addEventListener('change', function () {
        var f = file.files[0];
        if (!f) { return; }

        // SVG already halki hoti hai, usay waise hi rakho
        if (f.type === 'image/svg+xml') {
            if (f.size > 200 * 1024) {
                show('SVG file is too big', 'error');
                file.value = '';
                return;
            }
            var svgReader = new FileReader();
            svgReader.onload = function () {
                pending = svgReader.result;
                showPreview(pending);
                show('Looks good? Click Save Logo', 'ok');
            };
            svgReader.readAsDataURL(f);
            return;
        }

        // PNG / JPG: badi ho to khud chhoti kar do
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

                pending = canvas.toDataURL('image/png');
                showPreview(pending);
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
        if (!pending) {
            show('Choose an image first', 'error');
            return;
        }
        try {
            localStorage.setItem('brandLogo', pending);
        } catch (e) {
            show('Could not save, try a smaller image', 'error');
            return;
        }
        pending = null;
        file.value = '';
        updateSidebar();
        show('Logo saved', 'ok');
    });

    removeBtn.addEventListener('click', function () {
        localStorage.removeItem('brandLogo');
        pending = null;
        file.value = '';
        showPreview(null);
        updateSidebar();
        show('Logo removed', 'ok');
    });
})();
