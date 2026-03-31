<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ─── Define Permissions ───────────────────────────────────────────────
        $permissions = [
            // Organization
            'manage-organizations',
            'view-organizations',

            // Elections
            'create-elections',
            'edit-elections',
            'delete-elections',
            'view-elections',

            // Voters
            'manage-voters',       // add / edit / import / export
            'delete-voters',       // remove voters from election
            'view-voters',

            // Candidates & Posts
            'manage-candidates',
            'manage-posts',

            // Voting
            'cast-vote',
            'view-voting-status',

            // Results & Reports
            'view-results',
            'export-results',
            'view-detailed-reports',       // with vote counts per candidate
            'view-own-candidate-results',  // candidate sees their own vote tally

            // System
            'view-audit-logs',
            'manage-system',
            'send-reset-password',
            'manage-roles',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // ─── Super Admin — full access ────────────────────────────────────────
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        // ─── Org Admin — full control within their org ────────────────────────
        $orgAdmin = Role::firstOrCreate(['name' => 'org_admin', 'guard_name' => 'web']);
        $orgAdmin->syncPermissions([
            'view-organizations',
            'create-elections',
            'edit-elections',
            'delete-elections',
            'view-elections',
            'manage-voters',
            'delete-voters',
            'view-voters',
            'manage-candidates',
            'manage-posts',
            'view-results',
            'export-results',
            'view-detailed-reports',
            'view-audit-logs',
            'send-reset-password',
        ]);

        // ─── Org User — add/edit elections, manage voters, view results ───────
        $orgUser = Role::firstOrCreate(['name' => 'org_user', 'guard_name' => 'web']);
        $orgUser->syncPermissions([
            'create-elections',
            'edit-elections',
            'view-elections',
            'manage-voters',
            'view-voters',
            'view-results',
            'export-results',
            'view-detailed-reports',
            'send-reset-password',
        ]);

        // ─── Election Admin — manage voters/posts/candidates for elections ────
        $electionAdmin = Role::firstOrCreate(['name' => 'election_admin', 'guard_name' => 'web']);
        $electionAdmin->syncPermissions([
            'view-elections',
            'manage-voters',
            'delete-voters',
            'view-voters',
            'manage-candidates',
            'manage-posts',
            'view-results',
            'export-results',
            'view-detailed-reports',
            'send-reset-password',
        ]);

        // ─── Election User — add/edit/import voters, view results ─────────────
        $electionUser = Role::firstOrCreate(['name' => 'election_user', 'guard_name' => 'web']);
        $electionUser->syncPermissions([
            'view-elections',
            'manage-voters',
            'view-voters',
            'view-results',
            'export-results',
            'send-reset-password',
        ]);

        // ─── Voter — cast vote and view results ───────────────────────────────
        $voter = Role::firstOrCreate(['name' => 'voter', 'guard_name' => 'web']);
        $voter->syncPermissions([
            'cast-vote',
            'view-voting-status',
            'view-results',
        ]);

        // ─── Candidate — vote + view results + own candidate result ──────────
        $candidate = Role::firstOrCreate(['name' => 'candidate', 'guard_name' => 'web']);
        $candidate->syncPermissions([
            'cast-vote',
            'view-voting-status',
            'view-results',
            'view-own-candidate-results',
        ]);
    }
}
