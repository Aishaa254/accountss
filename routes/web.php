<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompanySettingController;
use App\Models\CompanySetting;
Route::get('/', function () {
    return view('pages.dashboard.dashboard');
});

Route::get('/settings', function () {
    $company = CompanySetting::first();
    return view('pages.settings.settings', compact('company'));
});
Route::get('/customers', function () {
    return view('pages.customers.customers');
});
Route::get('/invoices', function () {
    return view('pages.invoices.invoices');
});
Route::get('/vendors', function () {
    return view('pages.vendors.vendors');
});
Route::get('/purchases', function () {
    return view('pages.purchases.purchases');
});
Route::get('/expenses',function(){
    return view('pages.expenses.expenses');
});
Route::post('/settings/company', [CompanySettingController::class, 'save'])->name('company.save');