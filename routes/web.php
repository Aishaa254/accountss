<?php
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('pages.dashboard.dashboard');
});

Route::get('/settings', function () {
    return view('pages.settings.settings');
});
Route::get('/customers', function () {
    return view('pages.customers.customers');
});
Route::get('/invoices', function () {
    return view('pages.invoices.invoices');
});

Route::prefix('settings')->name('settings.')->group(function () {
    Route::get('/',          [SettingController::class, 'index'])->name('index');
    Route::post('/brand',    [SettingController::class, 'saveBrand'])->name('brand');
    Route::post('/system',   [SettingController::class, 'saveSystem'])->name('system');
    Route::post('/company',  [SettingController::class, 'saveCompany'])->name('company');
    Route::post('/currency', [SettingController::class, 'saveCurrency'])->name('currency');
    Route::post('/email',    [SettingController::class, 'saveEmail'])->name('email');
    Route::post('/contact',  [SettingController::class, 'saveContact'])->name('contact');
});

Route::post('/settings/save', [SettingController::class, 'save'])->name('settings.save');