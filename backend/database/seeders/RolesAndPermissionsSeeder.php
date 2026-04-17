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
            'manage-nominations',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // ─── Super Admin — full access ────────────────────────────────────────
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        // ─── Org Admin — full CRUD within their org ──────────────────────────
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
            'send-reset-password',
        ]);

        // ─── Org User — create/edit elections, manage voters, view results ──
        $orgUser = Role::firstOrCreate(['name' => 'org_user', 'guard_name' => 'web']);
        $orgUser->syncPermissions([
            'create-elections',
            'edit-elections',
            'view-elections',
            'manage-voters',
            'view-voters',
            'manage-candidates',
            'manage-posts',
            'view-results',
            'view-detailed-reports',
        ]);

        // ─── Election Admin — full election CRUD, voters, posts, candidates, nominations ─
        $electionAdmin = Role::firstOrCreate(['name' => 'election_admin', 'guard_name' => 'web']);
        $electionAdmin->syncPermissions([
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
            'send-reset-password',
            'manage-nominations',
        ]);

        // ─── Election User — create/edit elections, manage voters/posts/candidates, view results ─
        $electionUser = Role::firstOrCreate(['name' => 'election_user', 'guard_name' => 'web']);
        $electionUser->syncPermissions([
            'create-elections',
            'edit-elections',
            'view-elections',
            'manage-voters',
            'view-voters',
            'manage-candidates',
            'manage-posts',
            'view-results',
            'export-results',
        ]);

        // ─── Moderator — view/edit voters, send invitations, password reset ───
        $moderator = Role::firstOrCreate(['name' => 'moderator', 'guard_name' => 'web']);
        $moderator->syncPermissions([
            'view-elections',
            'view-voters',
            'manage-voters',
            'send-reset-password',
        ]);

        // ─── Voter — cast vote, view + export results ────────────────────────
        $voter = Role::firstOrCreate(['name' => 'voter', 'guard_name' => 'web']);
        $voter->syncPermissions([
            'cast-vote',
            'view-voting-status',
            'view-results',
            'export-results',
        ]);

        // ─── Candidate — vote + view/export results + own candidate result ───
        $candidate = Role::firstOrCreate(['name' => 'candidate', 'guard_name' => 'web']);
        $candidate->syncPermissions([
            'cast-vote',
            'view-voting-status',
            'view-results',
            'export-results',
            'view-own-candidate-results',
        ]);
    }
}
