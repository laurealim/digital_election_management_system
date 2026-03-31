<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('election_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->boolean('has_voted')->default(false);
            $table->timestamp('voted_at')->nullable();
            $table->timestamp('invitation_sent_at')->nullable();
            $table->timestamps();

            // A user can only be enrolled once per election
            $table->unique(['election_id', 'user_id']);
            $table->index(['election_id', 'has_voted']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voters');
    }
};
