<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompanySettingController;
use App\Models\CompanySetting;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\InventoryController;
Route::get('/', function () {
    return view('pages.dashboard.dashboard');
});
Route::get('/dashboard/data', [DashboardController::class, 'data']);

Route::get('/settings', function () {
    $company = CompanySetting::first();
    return view('pages.settings.settings', compact('company'));
});

Route::get('/customers', function () {
    return view('pages.customers.customers');
});
Route::get('/customers/list', [CustomerController::class, 'index']);
Route::post('/customers', [CustomerController::class, 'store']);
Route::put('/customers/{customer}', [CustomerController::class, 'update']);

Route::get('/invoices', function () {
    return view('pages.invoices.invoices');
});
Route::get('/invoices/list', [InvoiceController::class, 'index']);
Route::post('/invoices', [InvoiceController::class, 'store']);
Route::post('/invoices/{invoice:no}/pay', [InvoiceController::class, 'pay']);
Route::delete('/invoices/{invoice:no}', [InvoiceController::class, 'destroy']);

Route::get('/vendors', function () {
    return view('pages.vendors.vendors');
});
Route::get('/vendors/list', [VendorController::class, 'index']);
Route::post('/vendors', [VendorController::class, 'store']);
Route::put('/vendors/{vendor}', [VendorController::class, 'update']);
Route::delete('/vendors/{vendor}', [VendorController::class, 'destroy']);
Route::post('/vendors/{vendor}/pay', [VendorController::class, 'pay']);

Route::get('/purchases', function () {
    return view('pages.purchases.purchases');
});
Route::get('/purchases/list', [PurchaseController::class, 'index']);
Route::post('/purchases', [PurchaseController::class, 'store']);
Route::put('/purchases/{purchase}', [PurchaseController::class, 'update']);
Route::delete('/purchases/{purchase}', [PurchaseController::class, 'destroy']);
Route::post('/purchases/{purchase}/pay', [PurchaseController::class, 'pay']);


Route::get('/expenses',function(){
    return view('pages.expenses.expenses');
});
Route::get('/expenses/list', [ExpenseController::class, 'index']);
Route::post('/expenses', [ExpenseController::class, 'store']);
Route::put('/expenses/{expense}', [ExpenseController::class, 'update']);
Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy']);

Route::get('/dashboard',function(){
    return view('pages.dashboard.dashboard');
});

Route::get('/reports',function(){
    return view('pages.reports.reports');
});
Route::get('/reports/data', [ReportController::class, 'data']);

Route::get('/inventory', function () {
    return view('pages.inventory.inventory');
});
Route::get('/inventory/list', [InventoryController::class, 'index']);
Route::post('/inventory', [InventoryController::class, 'store']);
Route::put('/inventory/{product}', [InventoryController::class, 'update']);
Route::delete('/inventory/{product}', [InventoryController::class, 'destroy']);
Route::post('/inventory/{product}/adjust', [InventoryController::class, 'adjust']);
Route::get('/inventory/summary', [InventoryController::class, 'summary']);

Route::post('/settings/company', [CompanySettingController::class, 'save'])->name('company.save');
Route::get('/company/info', [CompanySettingController::class, 'info']);
Route::post('/settings/system', [CompanySettingController::class, 'saveSystem']);