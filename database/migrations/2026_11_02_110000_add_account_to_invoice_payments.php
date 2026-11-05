<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_payments', function (Blueprint $table) {
            $table->unsignedBigInteger('account_id')->nullable();
            $table->string('method', 30)->nullable();
            $table->string('reference', 60)->nullable();
            $table->foreign('account_id')->references('id')->on('accounts')->restrictOnDelete();
        });

        // Purani saari payments "Cash in Hand" mein maan li jati hain, koi purana record nahi toota
        $cashId = DB::table('accounts')->where('type', 'cash')->where('is_system', true)->value('id');

        DB::table('invoice_payments')->whereNull('account_id')->update([
            'account_id' => $cashId,
            'method' => 'Cash',
        ]);

        $by = Schema::hasColumn('invoice_payments', 'created_by')
            ? 'p.created_by'
            : DB::raw('NULL as created_by');

        DB::table('invoice_payments as p')
            ->join('invoices as i', 'i.id', '=', 'p.invoice_id')
            ->join('customers as c', 'c.id', '=', 'i.customer_id')
            ->orderBy('p.id')
            ->select('p.id', 'p.amount', 'p.date', 'p.method', 'p.reference', $by, 'i.no as inv_no', 'c.name as customer')
            ->chunk(200, function ($rows) use ($cashId) {
                $insert = [];

                foreach ($rows as $r) {
                    $insert[] = [
                        'account_id' => $cashId,
                        'date' => $r->date,
                        'direction' => 'in',
                        'amount' => $r->amount,
                        'kind' => 'payment_in',
                        'method' => $r->method,
                        'reference' => $r->reference,
                        'note' => 'Received ' . $r->inv_no . ' from ' . $r->customer,
                        'source_type' => 'invoice_payment',
                        'source_id' => $r->id,
                        'created_by' => $r->created_by,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                if ($insert) {
                    DB::table('account_transactions')->insert($insert);
                }
            });
    }

    public function down(): void
    {
        DB::table('account_transactions')->where('source_type', 'invoice_payment')->delete();

        Schema::table('invoice_payments', function (Blueprint $table) {
            $table->dropForeign(['account_id']);
            $table->dropColumn(['account_id', 'method', 'reference']);
        });
    }
};