<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Modify status enum to include 'published' and 'cancelled'
        DB::statement("ALTER TABLE elections MODIFY COLUMN status ENUM('draft','published','scheduled','active','completed','cancelled') NOT NULL DEFAULT 'draft'");

        // Modify candidate_mode enum to include 'nominated'
        DB::statement("ALTER TABLE elections MODIFY COLUMN candidate_mode ENUM('selected','open','nominated') NOT NULL DEFAULT 'selected'");

        Schema::table('elections', function (Blueprint $table) {
            $table->enum('nomination_type', ['single', 'multiple'])->nullable()->after('candidate_mode');
            $table->timestamp('publish_at')->nullable()->after('nomination_type');
        });
    }

    public function down(): void
    {
        Schema::table('elections', function (Blueprint $table) {
            $table->dropColumn(['nomination_type', 'publish_at']);
        });

        DB::statement("ALTER TABLE elections MODIFY COLUMN candidate_mode ENUM('selected','open') NOT NULL DEFAULT 'selected'");
        DB::statement("ALTER TABLE elections MODIFY COLUMN status ENUM('draft','scheduled','active','completed','cancelled') NOT NULL DEFAULT 'draft'");
    }
};