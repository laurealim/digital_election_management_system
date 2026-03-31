<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voters', function (Blueprint $table) {
            // null = never sent, 'sent' = delivered to SMTP, 'failed' = exception thrown
            $table->string('invitation_status', 10)->nullable()->default(null)->after('invitation_sent_at');
        });
    }

    public function down(): void
    {
        Schema::table('voters', function (Blueprint $table) {
            $table->dropColumn('invitation_status');
        });
    }
};
