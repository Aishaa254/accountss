<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 30)->default('staff')->after('password');
            $table->boolean('active')->default(true)->after('role');
            $table->string('phone', 30)->nullable()->after('active');
            $table->string('job_title', 80)->nullable()->after('phone');
            $table->string('language', 5)->default('en')->after('job_title');
            $table->timestamp('last_login_at')->nullable()->after('language');
        });

        // Agar pehle se koi user maujood hai to sab se purane ko owner bana do
        $first = DB::table('users')->min('id');
        if ($first) {
            DB::table('users')->where('id', $first)->update(['role' => 'owner']);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'active', 'phone', 'job_title', 'language', 'last_login_at']);
        });
    }
};