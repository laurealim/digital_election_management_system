<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['govt', 'private', 'association', 'cooperative']);
            $table->string('email', 191)->unique();
            $table->string('phone', 20);
            $table->text('address')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add FK on users now that organizations table exists
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('organization_id')
                  ->references('id')
                  ->on('organizations')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
        });

        Schema::dropIfExists('organizations');
    }
};
