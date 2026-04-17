<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nominations', function (Blueprint $table) {
            $table->renameColumn('nid_or_employee_id', 'nid');
        });

        Schema::table('nominations', function (Blueprint $table) {
            $table->unique(['election_id', 'nid'], 'nominations_election_id_nid_unique');
        });
    }

    public function down(): void
    {
        Schema::table('nominations', function (Blueprint $table) {
            $table->dropUnique('nominations_election_id_nid_unique');
            $table->renameColumn('nid', 'nid_or_employee_id');
        });
    }
};
