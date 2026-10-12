@php
try {
$appSettings = \App\Models\Setting::pluck('value', 'key')->toArray();
} catch (\Throwable $e) {
$appSettings = [];
}
@endphp
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') - AccountPro</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Roboto:wght@400;500;700&family=Noto+Serif:wght@400;500;600&display=swap">
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <link rel="stylesheet" href="{{ asset('css/layout/sidebar.css') }}">
    <link rel="stylesheet" href="{{ asset('css/layout/navbar.css') }}">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="app-settings" content="{{ json_encode((object) $appSettings) }}">
    <meta name="settings-save-url" content="{{ url('/settings/save') }}">
    <script src="{{ asset('js/settings-sync.js') }}"></script>
    <script src="{{ asset('js/theme.js') }}"></script>

    @stack('styles')
</head>

<body>

    @include('layout.sidebar')

    <div class="main">
        @include('layout.navbar')

        <main class="content">
            @yield('content')
        </main>
    </div>

    @stack('scripts')

</body>

</html>