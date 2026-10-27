@php
    $b = \App\Models\CompanySetting::first();
    $brandData = [
        'font' => $b->brand_font ?? 'segoe',
        'theme' => $b->brand_theme ?? 'emerald',
        'customColor' => $b->brand_custom_color ?? '',
        'title' => $b->brand_title ?? 'AccountPro',
        'footer' => $b->brand_footer ?? '',
        'logo' => ($b && $b->brand_logo) ? asset($b->brand_logo) : '',
    ];
@endphp
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') - {{ $brandData['title'] }}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Roboto:wght@400;500;700&family=Noto+Serif:wght@400;500;600&display=swap">
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <link rel="stylesheet" href="{{ asset('css/layout/sidebar.css') }}">
    <link rel="stylesheet" href="{{ asset('css/layout/navbar.css') }}">
    <link rel="stylesheet" href="{{ asset('css/layout/motion.css') }}">
    <script>window.APP_SETTINGS = @json($appSettings);</script>
    <script>window.APP_BRAND = @json($brandData);</script>
    <script src="{{ asset('js/theme.js') }}"></script>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @stack('styles')
</head>

<body>

    @include('layout.sidebar')

    <div class="main">
        @include('layout.navbar')

        <main class="content">
            @yield('content')
        </main>

        @if($brandData['footer'] !== '')
        <footer class="app-footer" style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">{{ $brandData['footer'] }}</footer>
        @endif
    </div>

    @stack('scripts')

</body>

</html>