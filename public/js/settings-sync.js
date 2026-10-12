(function () {
    // Jo settings database mein save hongi
    var keys = ['theme', 'mode', 'font', 'brandLogo', 'customThemes'];

    // Meta tags se settings aur save ka URL parho
    var settingsMeta = document.querySelector('meta[name="app-settings"]');
    var urlMeta = document.querySelector('meta[name="settings-save-url"]');
    var saved = {};
    try {
        saved = JSON.parse(settingsMeta ? settingsMeta.content : '{}') || {};
    } catch (e) {
        saved = {};
    }
    var saveUrl = urlMeta ? urlMeta.content : '/settings/save';

    // 1. Page khulte hi database ki settings lagao
    keys.forEach(function (k) {
        if (saved[k] !== undefined && saved[k] !== null) {
            localStorage.setItem(k, saved[k]);
        } else {
            localStorage.removeItem(k);
        }
    });

    // 2. Server ko bhejne wala function
    function send(key, value) {
        var tokenTag = document.querySelector('meta[name="csrf-token"]');
        fetch(saveUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': tokenTag ? tokenTag.content : ''
            },
            body: JSON.stringify({ key: key, value: value })
        }).catch(function () {});
    }

    // 3. Jab bhi purani JS in settings ko save kare, database mein bhi bhejo
    var originalSet = Storage.prototype.setItem;
    var originalRemove = Storage.prototype.removeItem;

    Storage.prototype.setItem = function (key, value) {
        originalSet.apply(this, arguments);
        if (this === window.localStorage && keys.indexOf(key) !== -1) {
            send(key, String(value));
        }
    };

    Storage.prototype.removeItem = function (key) {
        originalRemove.apply(this, arguments);
        if (this === window.localStorage && keys.indexOf(key) !== -1) {
            send(key, null);
        }
    };
})();