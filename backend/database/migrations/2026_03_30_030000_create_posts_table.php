<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('election_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('max_votes')->default(1); // how many candidates a voter may pick for this post
            $table->unsignedSmallInteger('order')->default(0);
            $table->timestamps();

            $table->index(['election_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
