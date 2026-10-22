<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->double('opening')->default(0)->after('terms');
        });
    
        DB::statement('UPDATE vendors SET opening = balance + paid');
    
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn(['balance', 'paid', 'dueIn']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->double('balance')->default(0);
            $table->double('paid')->default(0);
            $table->integer('dueIn')->nullable();
        });
    
        DB::statement('UPDATE vendors SET balance = opening');
    
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn('opening');
        });
    }
};
