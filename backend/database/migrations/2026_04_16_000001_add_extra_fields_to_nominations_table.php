<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nominations', function (Blueprint $table) {
            $table->string('father_name')->nullable()->after('organization_name');
            $table->string('mother_name')->nullable()->after('father_name');
            $table->string('nid_or_employee_id')->nullable()->after('mother_name');
            $table->string('designation')->nullable()->after('nid_or_employee_id');
            $table->text('address')->nullable()->after('designation');
        });
    }

    public function down(): void
    {
        Schema::table('nominations', function (Blueprint $table) {
            $table->dropColumn(['father_name', 'mother_name', 'nid_or_employee_id', 'designation', 'address']);
        });
    }
};