<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cash in Hand aur saare bank accounts yahan hote hain
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->string('type', 10);                    // cash | bank
            $table->string('bank_name', 80)->nullable();
            $table->string('account_title', 80)->nullable();
            $table->string('last4', 4)->nullable();        // account number ke sirf akhri 4 hindse
            $table->decimal('opening', 14, 2)->default(0);
            $table->boolean('is_system')->default(false);  // Cash in Hand delete/band nahi hoga
            $table->boolean('active')->default(true);
            $table->string('note', 150)->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });

        // Har aamad / kharch ki entry. Baqi rakam hamesha issi se banti hai
        Schema::create('account_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained()->restrictOnDelete();
            $table->date('date');
            $table->string('direction', 3);                // in | out
            $table->decimal('amount', 14, 2);
            $table->string('kind', 20)->default('deposit'); // deposit, withdraw (aage: payment, expense, transfer)
            $table->string('method', 30)->nullable();
            $table->string('reference', 60)->nullable();
            $table->string('note', 150)->nullable();
            $table->string('source_type', 40)->nullable(); // Step 2 mein invoice/purchase se link
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('transfer_key', 36)->nullable(); // Step 5 mein transfer ki dono entries
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'date']);
            $table->index(['source_type', 'source_id']);
        });

        DB::table('accounts')->insert([
            'name' => 'Cash in Hand',
            'type' => 'cash',
            'opening' => 0,
            'is_system' => true,
            'active' => true,
            'note' => 'System account',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('account_transactions');
        Schema::dropIfExists('accounts');
    }
};