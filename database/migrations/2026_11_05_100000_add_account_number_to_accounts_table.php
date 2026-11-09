<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Poora account number (pehle sirf akhri 4 digits save hote the)
        Schema::table('accounts', function (Blueprint $table) {
            $table->string('account_number', 24)->nullable()->after('account_title');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('account_number');
        });
    }
};