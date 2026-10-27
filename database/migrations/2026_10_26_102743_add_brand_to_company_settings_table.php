<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->string('brand_font', 20)->nullable();
            $table->string('brand_theme', 20)->nullable();
            $table->string('brand_custom_color', 7)->nullable();
            $table->string('brand_title', 60)->nullable();
            $table->string('brand_footer', 150)->nullable();
            $table->string('brand_logo', 255)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn(['brand_font', 'brand_theme', 'brand_custom_color', 'brand_title', 'brand_footer', 'brand_logo']);
        });
    }
};
