/* =========================================================
 |  SETTINGS PAGE — JavaScript
 ========================================================= */
 document.addEventListener('DOMContentLoaded', function () {

    /* =========================================================
     |  1. SIDEBAR — Section Switching
     ========================================================= */
    const settingsLinks = document.querySelectorAll('.settings-link');
    const sections      = document.querySelectorAll('.section');

    settingsLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            settingsLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            sections.forEach(s => s.classList.remove('active'));
            const target = document.getElementById(this.dataset.section);
            if (target) target.classList.add('active');
        });
    });

    /* =========================================================
     |  2. TABS — Brand section
     ========================================================= */
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const parent = this.closest('.settings-card');
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

            this.classList.add('active');
            const target = parent.querySelector('#' + this.dataset.tab);
            if (target) target.classList.add('active');
        });
    });

    /* =========================================================
     |  3. FONT SELECTION
     ========================================================= */
    document.querySelectorAll('.font-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const input = document.getElementById('input-font');
            if (input) input.value = this.dataset.font;
        });
    });

    /* =========================================================
     |  4. THEME COLOR PRESET
     ========================================================= */
    document.querySelectorAll('.color-box').forEach(box => {
        box.addEventListener('click', function () {
            document.querySelectorAll('.color-box').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const input = document.getElementById('input-theme-color');
            if (input) input.value = this.dataset.theme;
        });
    });

    /* =========================================================
     |  5. CUSTOM COLOR
     ========================================================= */
    const saveColorBtn = document.getElementById('saveColor');
    if (saveColorBtn) {
        saveColorBtn.addEventListener('click', function () {
            const input = document.getElementById('customColor');
            const msg = document.getElementById('colorMsg');
            const val = input.value.trim();

            if (!val) {
                msg.textContent = 'Please enter a color code.';
                msg.style.color = '#e11d48';
                return;
            }
            if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(val)) {
                document.getElementById('input-theme-color').value = val;
                msg.textContent = '✓ Color applied. Click Save Changes to store.';
                msg.style.color = '#10b981';
            } else {
                msg.textContent = '✗ Invalid hex code. Use format like #ff5500';
                msg.style.color = '#e11d48';
            }
        });
    }

    /* =========================================================
     |  6. APPEARANCE MODE
     ========================================================= */
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const input = document.getElementById('input-appearance');
            if (input) input.value = this.dataset.mode;
        });
    });

    /* =========================================================
     |  7. LOGO UPLOAD PREVIEW
     ========================================================= */
    const lgFile   = document.getElementById('lgFile');
    const lgChoose = document.getElementById('lgChoose');
    const lgRemove = document.getElementById('lgRemove');
    const lgMsg    = document.getElementById('lgMsg');

    if (lgChoose && lgFile) {
        lgChoose.addEventListener('click', () => lgFile.click());
    }

    if (lgFile) {
        lgFile.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;

            if (file.size > 4194304) {
                if (lgMsg) {
                    lgMsg.textContent = '✗ File too big. Maximum 4MB allowed.';
                    lgMsg.style.color = '#e11d48';
                }
                this.value = '';
                return;
            }

            const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
            if (!allowed.includes(file.type)) {
                if (lgMsg) {
                    lgMsg.textContent = '✗ Only PNG, JPG or SVG allowed.';
                    lgMsg.style.color = '#e11d48';
                }
                this.value = '';
                return;
            }

            if (lgMsg) {
                lgMsg.textContent = '✓ File selected: ' + file.name;
                lgMsg.style.color = '#10b981';
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                document.querySelectorAll('.lg-img').forEach(img => {
                    img.src = e.target.result;
                    img.style.display = '';
                });
                document.querySelectorAll('.lg-empty').forEach(el => {
                    el.style.display = 'none';
                });
            };
            reader.readAsDataURL(file);
        });
    }

    if (lgRemove && lgFile) {
        lgRemove.addEventListener('click', function () {
            lgFile.value = '';
            document.querySelectorAll('.lg-img').forEach(img => {
                img.src = '';
                img.style.display = 'none';
            });
            document.querySelectorAll('.lg-empty').forEach(el => {
                el.style.display = '';
            });
            if (lgMsg) {
                lgMsg.textContent = '✓ Logo removed. Click Save Changes to store.';
                lgMsg.style.color = '#10b981';
            }
        });
    }

    /* =========================================================
     |  8. COMPANY FORM — CUSTOM VALIDATION (novalidate)
     ========================================================= */
    const companyForm = document.getElementById('companyForm');
    if (!companyForm) return;

    const rules = {
        company_name: {
            required: true,
            minLength: 2,
            maxLength: 255,
            pattern: /^[A-Za-z0-9\s\.\,\-\&\'\(\)]+$/,
            messages: {
                required: 'Company name is required.',
                minLength: 'Company name must be at least 2 characters.',
                maxLength: 'Company name must not exceed 255 characters.',
                pattern: "Only letters, numbers, spaces, and . , - & ' ( ) are allowed.",
            },
        },
        registration_number: {
            required: true,
            minLength: 3,
            maxLength: 100,
            pattern: /^[A-Za-z0-9\-\/]+$/,
            messages: {
                required: 'Registration number is required.',
                minLength: 'Registration number must be at least 3 characters.',
                maxLength: 'Registration number must not exceed 100 characters.',
                pattern: 'Only letters, numbers, - and / are allowed.',
            },
        },
        phone: {
            required: true,
            minLength: 7,
            maxLength: 50,
            pattern: /^[0-9+\-\s()]+$/,
            messages: {
                required: 'Phone number is required.',
                minLength: 'Phone number must be at least 7 characters.',
                maxLength: 'Phone number must not exceed 50 characters.',
                pattern: 'Only digits and + - ( ) are allowed.',
            },
        },
        email: {
            required: true,
            maxLength: 255,
            email: true,
            messages: {
                required: 'Company email is required.',
                maxLength: 'Email must not exceed 255 characters.',
                email: 'Please enter a valid email address.',
            },
        },
        address: {
            required: false,
            maxLength: 500,
            messages: {
                maxLength: 'Address must not exceed 500 characters.',
            },
        },
    };

    function showError(input, message) {
        input.classList.add('is-invalid');
        const old = input.parentElement.querySelector('.field-error[data-js="true"]');
        if (old) old.remove();

        const p = document.createElement('p');
        p.className = 'field-error';
        p.dataset.js = 'true';
        p.textContent = message;
        input.parentElement.appendChild(p);
    }

    function clearError(input) {
        input.classList.remove('is-invalid');
        const err = input.parentElement.querySelector('.field-error[data-js="true"]');
        if (err) err.remove();
    }

    function validateField(input) {
        const name = input.name;
        const rule = rules[name];
        if (!rule) return true;

        const value = input.value.trim();

        if (rule.required && value === '') {
            showError(input, rule.messages.required);
            return false;
        }
        if (!rule.required && value === '') {
            clearError(input);
            return true;
        }
        if (rule.minLength && value.length < rule.minLength) {
            showError(input, rule.messages.minLength);
            return false;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            showError(input, rule.messages.maxLength);
            return false;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
            showError(input, rule.messages.pattern);
            return false;
        }
        if (rule.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                showError(input, rule.messages.email);
                return false;
            }
        }
        clearError(input);
        return true;
    }

    // Live validation
    companyForm.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('is-invalid')) {
                validateField(input);
            }
        });
    });

    // Submit validation
    companyForm.addEventListener('submit', function (e) {
        let valid = true;
        let firstInvalid = null;

        ['company_name', 'registration_number', 'phone', 'email', 'address'].forEach(name => {
            const input = companyForm.querySelector(`[name="${name}"]`);
            if (!input) return;
            if (!validateField(input)) {
                valid = false;
                if (!firstInvalid) firstInvalid = input;
            }
        });

        if (!valid) {
            e.preventDefault();
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalid.focus();
            }
        }
    });
});