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
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuditLogController;

/*
|--------------------------------------------------------------------------
| Login se pehle (sab ke liye khula)
|--------------------------------------------------------------------------
*/

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::get('/setup', [AuthController::class, 'showSetup']);
Route::post('/setup', [AuthController::class, 'setup'])->middleware('throttle:10,1');

/*
|--------------------------------------------------------------------------
| Login ke baad
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/profile/password', [UserController::class, 'changePassword']);

    // Har logged in user ko chahiye (sidebar badge, item pickers, company info)
    Route::get('/company/info', [CompanySettingController::class, 'info']);
    Route::get('/inventory/summary', [InventoryController::class, 'summary']);
    Route::get('/inventory/options', [InventoryController::class, 'options']);

    // ---------- Dashboard ----------
    Route::middleware('can.module:dashboard')->group(function () {
        Route::get('/', function () {
            return view('pages.dashboard.dashboard');
        });
        Route::get('/dashboard', function () {
            return view('pages.dashboard.dashboard');
        });
        Route::get('/dashboard/data', [DashboardController::class, 'data']);
    });

    // ---------- Sales ----------
    Route::middleware('can.module:sales')->group(function () {
        Route::get('/customers', function () {
            return view('pages.customers.customers');
        });
        Route::get('/customers/list', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::put('/customers/{customer}', [CustomerController::class, 'update']);
        Route::post('/customers/{customer}/receive', [CustomerController::class, 'receive']);

        Route::get('/invoices', function () {
            return view('pages.invoices.invoices');
        });
        Route::get('/invoices/list', [InvoiceController::class, 'index']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::post('/invoices/{invoice:no}/pay', [InvoiceController::class, 'pay']);
        Route::delete('/invoices/{invoice:no}', [InvoiceController::class, 'destroy']);
    });

    // ---------- Purchases ----------
    Route::middleware('can.module:purchases')->group(function () {
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
    });

    // ---------- Expenses ----------
    Route::middleware('can.module:expenses')->group(function () {
        Route::get('/expenses', function () {
            return view('pages.expenses.expenses');
        });
        Route::get('/expenses/list', [ExpenseController::class, 'index']);
        Route::post('/expenses', [ExpenseController::class, 'store']);
        Route::put('/expenses/{expense}', [ExpenseController::class, 'update']);
        Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy']);
    });

    // ---------- Reports ----------
    Route::middleware('can.module:reports')->group(function () {
        Route::get('/reports', function () {
            return view('pages.reports.reports');
        });
        Route::get('/reports/data', [ReportController::class, 'data']);
    });

    // ---------- Inventory ----------
    Route::middleware('can.module:inventory')->group(function () {
        Route::get('/inventory', function () {
            return view('pages.inventory.inventory');
        });

        Route::get('/inventory/list', [InventoryController::class, 'index']);
        Route::post('/inventory', [InventoryController::class, 'store']);
        Route::put('/inventory/{product}', [InventoryController::class, 'update']);
        Route::delete('/inventory/{product}', [InventoryController::class, 'destroy']);
        Route::post('/inventory/{product}/adjust', [InventoryController::class, 'adjust']);
    });

    // ---------- Settings ----------
    Route::middleware('can.module:settings')->group(function () {
        Route::get('/settings', function () {
            $company = CompanySetting::first();
            return view('pages.settings.settings', compact('company'));
        });
        Route::post('/settings/company', [CompanySettingController::class, 'save'])->name('company.save');
        Route::post('/settings/system', [CompanySettingController::class, 'saveSystem']);
        Route::post('/settings/brand', [CompanySettingController::class, 'saveBrand']);
        Route::post('/settings/brand/logo', [CompanySettingController::class, 'saveLogo']);
        Route::delete('/settings/brand/logo', [CompanySettingController::class, 'removeLogo']);
    });

    // ---------- Team ----------
    Route::middleware('can.module:users')->group(function () {
        Route::get('/users', function () {
            return view('pages.users.users');
        });
        Route::get('/users/list', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::put('/users/{user}/status', [UserController::class, 'status']);
    });

    // ---------- Activity log ----------
    Route::middleware('can.module:audit')->group(function () {
        Route::get('/audit-log', function () {
            return view('pages.audit.audit');
        });
        Route::get('/audit-log/list', [AuditLogController::class, 'index']);
    });
});
