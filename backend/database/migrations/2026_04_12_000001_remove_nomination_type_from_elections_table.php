<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('elections', 'nomination_type')) {
            Schema::table('elections', function (Blueprint $table) {
                $table->dropColumn('nomination_type');
            });
        }
    }

    public function down(): void
    {
        Schema::table('elections', function (Blueprint $table) {
            $table->enum('nomination_type', ['single', 'multiple'])->nullable()->after('candidate_mode');
        });
    }
};