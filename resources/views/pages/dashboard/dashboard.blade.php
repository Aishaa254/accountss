@extends('layout.app')

@section('title', 'Dashboard')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/dashboard/dashboard.css') }}">
@endpush

@section('content')
    <h1 class="dashboard-title">Dashboard</h1>
    <p class="dashboard-text">Track your accounts, clients and payments.</p>
@endsection