<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->string('mailable')->index();       // e.g. VoterInvitationMail
            $table->string('recipient');               // email address
            $table->string('subject')->nullable();
            $table->string('status', 20)->default('sent'); // sent | failed
            $table->text('error')->nullable();
            $table->unsignedBigInteger('related_id')->nullable();   // polymorphic FK (election_id, org_id…)
            $table->string('related_type', 100)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
