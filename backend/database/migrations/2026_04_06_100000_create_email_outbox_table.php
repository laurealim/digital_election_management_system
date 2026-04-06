<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_outbox', function (Blueprint $table) {
            $table->id();
            $table->string('type', 50)->index();          // voter_invitation | password_reset | setup_password
            $table->string('to_address');                 // recipient email
            $table->string('subject');                    // email subject line
            $table->longText('body');                     // rendered HTML body
            $table->unsignedBigInteger('reference_id')->nullable();   // voter_id or user_id
            $table->unsignedBigInteger('organization_id')->nullable()->index();
            $table->string('status', 20)->default('pending'); // pending | sent | failed
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_outbox');
    }
};