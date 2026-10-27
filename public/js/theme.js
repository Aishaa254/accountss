var pending = {};

// Brand settings saved in the database (sent by layout/app.blade.php)
var BRAND = window.APP_BRAND || {};

var themes = {
    emerald: ['#0f766e', '#10b981'],
    ocean: ['#1d4ed8', '#3b82f6'],
    purple: ['#6d28d9', '#8b5cf6'],
    sunset: ['#c2410c', '#f97316'],
    rose: ['#be123c', '#f43f5e'],
    sky: ['#0e7490', '#06b6d4']
};

var darkThemes = {
    emerald: ['#14b8a6', '#34d399'],
    ocean: ['#60a5fa', '#93c5fd'],
    purple: ['#a78bfa', '#c4b5fd'],
    sunset: ['#fb923c', '#fdba74'],
    rose: ['#fb7185', '#fda4af'],
    sky: ['#22d3ee', '#67e8f9']
};

var fonts = {
    segoe: '"Segoe UI", Arial, sans-serif',
    poppins: '"Poppins", sans-serif',
    roboto: '"Roboto", sans-serif',
    notoserif: '"Noto Serif", serif'
};

var currentThemeName = 'emerald';

// ---------- Custom color helpers ----------
function lighten(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (255 - r) * amt);
    g = Math.round(g + (255 - g) * amt);
    b = Math.round(b + (255 - b) * amt);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function setCustomTheme(color) {
    var light = lighten(color, 0.35);
    themes.custom = [color, light];
    darkThemes.custom = [color, light];
}

// ---------- Apply functions ----------
function applyTheme(name) {
    if (!themes[name]) name = 'emerald';
    currentThemeName = name;

    var isDark = document.documentElement.getAttribute('data-mode') === 'dark';
    var colors = isDark ? darkThemes[name] : themes[name];

    document.documentElement.style.setProperty('--main', colors[0]);
    document.documentElement.style.setProperty('--main-light', colors[1]);
}

function applyMode(mode) {
    if (mode === 'dark') {
        document.documentElement.setAttribute('data-mode', 'dark');
    } else {
        document.documentElement.removeAttribute('data-mode');
    }
    applyTheme(currentThemeName);
}

function applyFont(name) {
    if (!fonts[name]) name = 'segoe';
    document.documentElement.style.setProperty('--font', fonts[name]);
}

// ---------- Apply the saved settings as the page opens ----------
// Theme color, font, title, footer and logo come from the database (company-wide).
// Light / Dark mode stays in this browser, because it is a personal choice.
var savedCustom = BRAND.customColor;
if (savedCustom) setCustomTheme(savedCustom);

applyMode(localStorage.getItem('mode') || 'light');
applyTheme(BRAND.theme || 'emerald');
applyFont(BRAND.font || 'segoe');

// ---------- Settings page: Custom color Save button ----------
document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('customColor');
    var saveBtn = document.getElementById('saveColor');
    var msg = document.getElementById('colorMsg');
    if (!input || !saveBtn) return;

    if (savedCustom) input.value = savedCustom;

    saveBtn.addEventListener('click', function () {
        var value = input.value.trim();
        if (value.charAt(0) !== '#') value = '#' + value;

        if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
            if (msg) { msg.textContent = 'Write code correctly #ff5500'; msg.className = 'color-msg error'; }
            return;
        }

        setCustomTheme(value);
        pending.customColor = value;
        pending.theme = 'custom';
        applyTheme('custom');
        input.value = value;
        if (msg) { msg.textContent = 'Preview on. Click Save Changes to keep it'; msg.className = 'color-msg ok'; }
    });
});

// Sidebar logo: if there is a logo, show it instead of the "A" icon
function applySidebarLogo() {
    var img = document.getElementById('sidebarLogo');
    var icon = document.getElementById('sidebarIcon');
    if (!img || !icon) { return; }

    if (BRAND.logo) {
        img.src = BRAND.logo;
        img.style.display = 'block';
        icon.style.display = 'none';
    } else {
        img.removeAttribute('src');
        img.style.display = 'none';
        icon.style.display = '';
    }
}

document.addEventListener('DOMContentLoaded', applySidebarLogo);

// Title: browser tab and sidebar name
function applyTitle() {
    var t = BRAND.title;
    if (!t) { return; }

    var parts = document.title.split(' - ');
    document.title = parts[0] + ' - ' + t;

    var h = document.getElementById('sidebarTitle');
    if (h) { h.textContent = t; }
}

document.addEventListener('DOMContentLoaded', applyTitle);

// Currency: one common function for the whole site
var currencySymbols = { PKR: 'Rs', USD: '$', AED: 'AED', SAR: 'SAR', EUR: '€' };

function appCurrency() {
    var s = window.APP_SETTINGS || {};
    return {
        code: s.currency || 'PKR',
        pos: s.symbolPosition || 'before'
    };
}

function formatMoney(amount) {
    var c = appCurrency();
    var sym = currencySymbols[c.code] || c.code;
    var amt = Number(amount).toLocaleString('en-US');
    return c.pos === 'before' ? sym + ' ' + amt : amt + ' ' + sym;
}

function applyCurrency() {
    var c = appCurrency();
    var sym = currencySymbols[c.code] || c.code;

    document.querySelectorAll('.money').forEach(function (el) {
        el.textContent = formatMoney(el.dataset.amount);
    });
    document.querySelectorAll('.cur-sym').forEach(function (el) {
        el.textContent = sym;
    });
}

document.addEventListener('DOMContentLoaded', applyCurrency);