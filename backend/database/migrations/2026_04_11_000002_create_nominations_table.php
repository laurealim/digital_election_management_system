<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nominations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('election_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('token_number', 8)->unique();
            $table->string('name');
            $table->string('email');
            $table->string('mobile', 20);
            $table->string('organization_name')->nullable(); // applicant's org/office
            $table->enum('status', ['pending', 'verified', 'rejected', 'accepted'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->boolean('payment_status')->default(false);
            $table->timestamp('payment_verified_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['election_id', 'email']); // prevent duplicate applications
            $table->index(['organization_id', 'status']);
            $table->index(['election_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nominations');
    }
};