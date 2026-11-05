<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = ['purchase_payments', 'vendor_payments', 'expenses'];

    public function up(): void
    {
        foreach ($this->tables as $name) {
            Schema::table($name, function (Blueprint $table) use ($name) {
                $table->unsignedBigInteger('account_id')->nullable();
                $table->string('reference', 60)->nullable();

                if (!Schema::hasColumn($name, 'created_by')) {
                    $table->unsignedBigInteger('created_by')->nullable();
                }

                $table->foreign('account_id')->references('id')->on('accounts')->restrictOnDelete();
            });
        }

        // Purani saari payments aur expenses "Cash in Hand" se maan li jati hain
        $cashId = DB::table('accounts')->where('type', 'cash')->where('is_system', true)->value('id');

        foreach ($this->tables as $name) {
            DB::table($name)->whereNull('account_id')->update(['account_id' => $cashId]);
        }

        $this->copy(
            DB::table('purchase_payments as p')
                ->join('purchases as pu', 'pu.id', '=', 'p.purchase_id')
                ->join('vendors as v', 'v.id', '=', 'pu.vendor_id')
                ->orderBy('p.id')
                ->select('p.id', 'p.amount', 'p.date', 'p.method', 'p.created_by', 'pu.no as po_no', 'v.name as vendor'),
            function ($r) use ($cashId) {
                return $this->row($cashId, $r, 'payment_out', 'purchase_payment', 'Paid ' . $r->po_no . ' to ' . $r->vendor);
            }
        );

        $this->copy(
            DB::table('vendor_payments as p')
                ->join('vendors as v', 'v.id', '=', 'p.vendor_id')
                ->orderBy('p.id')
                ->select('p.id', 'p.amount', 'p.date', 'p.method', 'p.note', 'p.created_by', 'v.name as vendor'),
            function ($r) use ($cashId) {
                $note = 'Paid ' . $r->vendor . ' (opening balance)' . ($r->note ? ' - ' . $r->note : '');
                return $this->row($cashId, $r, 'payment_out', 'vendor_payment', $note);
            }
        );

        $this->copy(
            DB::table('expenses as p')
                ->orderBy('p.id')
                ->select('p.id', 'p.amount', 'p.date', 'p.method', 'p.title', 'p.note', 'p.created_by'),
            function ($r) use ($cashId) {
                return $this->row($cashId, $r, 'expense', 'expense', $r->title . ($r->note ? ' - ' . $r->note : ''));
            }
        );
    }

    private function row($cashId, $r, string $kind, string $source, string $note): array
    {
        return [
            'account_id' => $cashId,
            'date' => $r->date,
            'direction' => 'out',
            'amount' => $r->amount,
            'kind' => $kind,
            'method' => $r->method,
            'reference' => null,
            'note' => $note,
            'source_type' => $source,
            'source_id' => $r->id,
            'created_by' => $r->created_by,
        ];
    }

    private function copy($query, callable $map): void
    {
        $query->chunk(200, function ($rows) use ($map) {
            $insert = [];

            foreach ($rows as $r) {
                $insert[] = $map($r) + ['created_at' => now(), 'updated_at' => now()];
            }

            if ($insert) {
                DB::table('account_transactions')->insert($insert);
            }
        });
    }

    public function down(): void
    {
        DB::table('account_transactions')->whereIn('source_type', ['purchase_payment', 'vendor_payment', 'expense'])->delete();

        foreach ($this->tables as $name) {
            Schema::table($name, function (Blueprint $table) use ($name) {
                $table->dropForeign(['account_id']);

                $cols = ['account_id', 'reference'];
                if (in_array($name, ['vendor_payments', 'expenses'], true)) {
                    $cols[] = 'created_by';
                }

                $table->dropColumn($cols);
            });
        }
    }
};