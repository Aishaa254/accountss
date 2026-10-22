<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Models\CompanySetting;

use Illuminate\Support\Facades\View;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        View::composer('layout.app', function ($view) {
            $s = CompanySetting::first();
        
            $view->with('appSettings', [
                'currency' => $s->currency ?? 'PKR',
                'symbolPosition' => $s->symbol_position ?? 'before',
            ]);
        });
    }
}