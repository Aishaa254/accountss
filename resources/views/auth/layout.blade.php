<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') - AccountPro</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap">
    <link rel="stylesheet" href="{{ asset('css/auth/auth.css') }}">
</head>

<body class="ax-body">
    <div class="ax-grid"></div>
    <div class="ax-glow g1"></div>
    <div class="ax-glow g2"></div>

    <main class="ax-wrap">

        <!-- ===== Left: 3D accounting scene ===== -->
        <section class="ax-art">
            <div class="ax-brand">
                <span class="ax-brand-logo">A</span> AccountPro
            </div>

            <h2 class="ax-hero">Your books, <em>always balanced.</em></h2>
            <p class="ax-hero-sub">Invoices, purchases, stock and reports in one place, with every entry on record.</p>

            <div class="ax-scene">
                <div class="ax-stage" id="axStage">

                    <div class="ax-card ax-ledger">
                        <div class="ax-cardhead"><i class="fa-solid fa-book"></i> Journal Entry <span>JV-0042</span></div>
                        <div class="ax-row ax-row-h"><span>Account</span><span>Debit</span><span>Credit</span></div>
                        <div class="ax-row"><span>Cash</span><span>50,000</span><span>-</span></div>
                        <div class="ax-row"><span>Sales</span><span>-</span><span>50,000</span></div>
                        <div class="ax-balanced"><i class="fa-solid fa-scale-balanced"></i> Debit = Credit <b><i class="fa-solid fa-circle-check"></i></b></div>
                    </div>

                    <div class="ax-card ax-invoice">
                        <div class="ax-cardhead"><i class="fa-solid fa-file-invoice"></i> Invoice <span>#INV-0042</span></div>
                        <div class="ax-line w80"></div>
                        <div class="ax-line w60"></div>
                        <div class="ax-line w70"></div>
                        <div class="ax-total"><small>Total</small><b>Rs 48,500</b></div>
                        <div class="ax-stamp">PAID</div>
                    </div>

                    <div class="ax-card ax-chart">
                        <div class="ax-cardhead"><i class="fa-solid fa-chart-column"></i> Profit this year <span>+24%</span></div>
                        <div class="ax-bars">
                            <i style="--h:34%;--i:0"></i>
                            <i style="--h:52%;--i:1"></i>
                            <i style="--h:44%;--i:2"></i>
                            <i style="--h:68%;--i:3"></i>
                            <i style="--h:60%;--i:4"></i>
                            <i style="--h:82%;--i:5"></i>
                            <i style="--h:100%;--i:6"></i>
                        </div>
                    </div>

                    <div class="ax-card ax-calc">
                        <div class="ax-display">1,25,000</div>
                        <div class="ax-keys">
                            <i style="--i:0">7</i><i style="--i:1">8</i><i style="--i:2">9</i><i style="--i:3">+</i>
                            <i style="--i:4">4</i><i style="--i:5">5</i><i style="--i:6">6</i><i style="--i:7">-</i>
                            <i style="--i:8">1</i><i style="--i:9">2</i><i style="--i:10">3</i><i style="--i:11">=</i>
                        </div>
                    </div>

                    <div class="ax-coinwrap w1"><div class="ax-coin">Rs</div></div>
                    <div class="ax-coinwrap w2"><div class="ax-coin">Rs</div></div>
                    <div class="ax-coinwrap w3"><div class="ax-coin">Rs</div></div>

                </div>
            </div>
        </section>

        <!-- ===== Right: form ===== -->
        <section class="ax-formside">
            @yield('form')
        </section>
    </main>

    <script>
        // 3D scene mouse ke saath hilta hai
        (function () {
            var stage = document.getElementById('axStage');
            if (!stage) { return; }
            document.addEventListener('mousemove', function (e) {
                var x = e.clientX / window.innerWidth - 0.5;
                var y = e.clientY / window.innerHeight - 0.5;
                stage.style.transform = 'rotateX(' + (6 - y * 16) + 'deg) rotateY(' + (-12 + x * 26) + 'deg)';
            });
        })();

        // Password dekhne wali aankh
        document.querySelectorAll('.ax-input input[type="password"]').forEach(function (input) {
            input.classList.add('has-eye');
            var eye = document.createElement('button');
            eye.type = 'button';
            eye.className = 'ax-eye';
            eye.innerHTML = '<i class="fa-regular fa-eye"></i>';
            eye.addEventListener('click', function () {
                var show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                eye.innerHTML = show ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
            });
            input.parentNode.appendChild(eye);
        });

        // Khali fields ki check aur loading
        var form = document.getElementById('authForm');
        if (form) {
            form.addEventListener('submit', function (e) {
                var ok = true;
                form.querySelectorAll('[data-required]').forEach(function (input) {
                    var wrap = input.closest('.ax-field');
                    var err = wrap.querySelector('.ax-err');
                    var bad = input.value.trim() === '';
                    wrap.querySelector('.ax-input').classList.toggle('bad', bad);
                    if (bad) { err.textContent = input.getAttribute('data-required'); ok = false; }
                    else if (!err.hasAttribute('data-server')) { err.textContent = ''; }
                });
                if (!ok) {
                    e.preventDefault();
                    form.classList.remove('shake');
                    void form.offsetWidth;
                    form.classList.add('shake');
                    return;
                }
                document.getElementById('authBtn').classList.add('loading');
            });
        }
    </script>
</body>

</html>