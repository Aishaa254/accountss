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
        Schema::table('products', function (Blueprint $table) {
            $table->string('image', 255)->nullable();
        });
    
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->decimal('cost', 12, 2)->default(0);
        });
    
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->decimal('sale_price', 12, 2)->nullable();
        });
    
        foreach (['products', 'invoices', 'invoice_payments', 'purchases', 'purchase_payments', 'stock_adjustments'] as $name) {
            if (Schema::hasTable($name) && !Schema::hasColumn($name, 'created_by')) {
                Schema::table($name, function (Blueprint $table) {
                    $table->unsignedBigInteger('created_by')->nullable();
                });
            }
        }
    }
    
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('image');
        });
    
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn(['description', 'cost']);
        });
    
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropColumn('sale_price');
        });
    
        foreach (['products', 'invoices', 'invoice_payments', 'purchases', 'purchase_payments', 'stock_adjustments'] as $name) {
            if (Schema::hasTable($name) && Schema::hasColumn($name, 'created_by')) {
                Schema::table($name, function (Blueprint $table) {
                    $table->dropColumn('created_by');
                });
            }
        }
    }
};
