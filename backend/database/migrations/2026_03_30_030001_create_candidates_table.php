<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('election_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->text('bio')->nullable();
            $table->timestamps();

            // A user can only be a candidate once per post
            $table->unique(['post_id', 'user_id']);
            $table->index(['election_id', 'post_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};
