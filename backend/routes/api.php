<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\V1\Auth\ResetPasswordController;
use App\Http\Controllers\Api\V1\Auth\SetupPasswordController;
use App\Http\Controllers\Api\V1\Auth\MeController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\ElectionController;
use App\Http\Controllers\Api\V1\VoterController;
use App\Http\Controllers\Api\V1\PostController;
use App\Http\Controllers\Api\V1\CandidateController;
use App\Http\Controllers\Api\V1\VoteController;
use App\Http\Controllers\Api\V1\ResultController;
use App\Http\Controllers\Api\V1\Admin\OrganizationController as AdminOrganizationController;
use App\Http\Controllers\Api\V1\Admin\RolesController;
use App\Http\Controllers\Api\V1\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\PublicResultController;
use App\Http\Controllers\Api\V1\ResendWebhookController;

Route::prefix('v1')->group(function () {

    // ─── Public Auth Routes ───────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('login',          [LoginController::class, 'store'])->middleware('throttle:5,1');
        Route::post('forgot-password',[ForgotPasswordController::class, 'store'])->middleware('throttle:10,1');
        Route::post('reset-password', [ResetPasswordController::class, 'store'])->middleware('throttle:10,1');
        Route::post('setup-password', [SetupPasswordController::class, 'store'])->middleware('throttle:10,1');
    });

    // ─── Public Results (no auth) ─────────────────────────────────────────────
    Route::get('public/results',      [PublicResultController::class, 'index']);
    Route::get('public/results/{id}', [PublicResultController::class, 'show']);

    // ─── Resend Webhook (no auth — Resend calls this) ─────────────────────────
    Route::post('webhooks/resend', [ResendWebhookController::class, 'handle']);

    // ─── Public Organization Registration ────────────────────────────────────
    Route::post('organizations', [OrganizationController::class, 'store']);

    // ─── Organization Email Verification (signed URL) ─────────────────────────
    Route::get('organizations/{id}/verify', [OrganizationController::class, 'verify'])
         ->name('org.verify')
         ->middleware('signed');

    // ─── Protected Routes (requires Sanctum token) ───────────────────────────
    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {

        // Auth
        Route::post('auth/logout', [LogoutController::class, 'store']);
        Route::get('auth/me',      [MeController::class, 'show']);

        // Organization (own org — org admin)
        Route::get('organizations/{organization}',  [OrganizationController::class, 'show']);
        Route::put('organizations/{organization}',  [OrganizationController::class, 'update']);

        // Elections
        Route::apiResource('elections', ElectionController::class);
        Route::post('elections/{election}/duplicate',      [ElectionController::class, 'duplicate']);
        Route::patch('elections/{election}/status',        [ElectionController::class, 'updateStatus']);
        Route::patch('elections/{election}/public-result', [ElectionController::class, 'togglePublicResult']);

        // Voters (nested under elections)
        Route::prefix('elections/{election}')->group(function () {
            Route::get('voters',                          [VoterController::class, 'index']);
            Route::post('voters',                         [VoterController::class, 'store']);
            Route::put('voters/{voter}',                  [VoterController::class, 'update']);
            Route::post('voters/import',                  [VoterController::class, 'import']);
            Route::get('voters/export',                   [VoterController::class, 'export']);
            Route::post('voters/copy-from/{source}',      [VoterController::class, 'copyFrom']);
            Route::delete('voters/{voter}',               [VoterController::class, 'destroy']);
            Route::post('voters/{voter}/resend-invitation',[VoterController::class, 'resendInvitation']);
            Route::post('voters/send-invitations',         [VoterController::class, 'sendBulkInvitations']);
        });

        // Posts (positions) — nested under elections
        Route::prefix('elections/{election}')->group(function () {
            Route::apiResource('posts', PostController::class)->except(['index', 'show']);
            Route::get('posts', [PostController::class, 'index']);

            // Candidates — nested under posts
            Route::get('posts/{post}/candidates',         [CandidateController::class, 'index']);
            Route::post('posts/{post}/candidates',        [CandidateController::class, 'store']);
            Route::delete('posts/{post}/candidates/{candidate}', [CandidateController::class, 'destroy']);
        });

        // Voting
        Route::post('elections/{election}/vote', [VoteController::class, 'store'])
            ->middleware('throttle:voting');
        Route::get('elections/{election}/voting-status',  [VoteController::class, 'status']);

        // Results
        Route::get('elections/{election}/results',              [ResultController::class, 'show']);
        Route::get('elections/{election}/results/mine',         [ResultController::class, 'myCandidateResults']);
        Route::get('elections/{election}/results/export/pdf',   [ResultController::class, 'exportPdf']);
        Route::get('elections/{election}/results/export/excel', [ResultController::class, 'exportExcel']);

        // Dashboards
        Route::get('dashboard',       [DashboardController::class, 'orgAdmin']);
        Route::get('admin/dashboard', [DashboardController::class, 'superAdmin'])
            ->middleware('role:super_admin');

        // ─── Super Admin Routes ───────────────────────────────────────────────
        Route::prefix('admin')->middleware('role:super_admin')->group(function () {
            Route::get('organizations',                    [AdminOrganizationController::class, 'index']);
            Route::post('organizations',                   [AdminOrganizationController::class, 'store']);
            Route::get('organizations/{organization}',     [AdminOrganizationController::class, 'show']);
            Route::patch('organizations/{organization}/toggle-status', [AdminOrganizationController::class, 'toggleStatus']);

            // Role & permission management (super_admin only)
            Route::get('roles',                             [RolesController::class, 'index']);
            Route::put('roles/{role}/permissions',          [RolesController::class, 'updatePermissions']);

            // Staff user management (super_admin only)
            Route::get('users',                             [AdminUserController::class, 'index']);
            Route::post('users',                            [AdminUserController::class, 'store']);
            Route::put('users/{user}',                      [AdminUserController::class, 'update']);
            Route::put('users/{user}/role',                 [AdminUserController::class, 'updateRole']);
            Route::patch('users/{user}/toggle-status',      [AdminUserController::class, 'toggleStatus']);
            Route::post('users/{user}/resend-setup',        [AdminUserController::class, 'resendSetupEmail']);
            Route::delete('users/{user}',                   [AdminUserController::class, 'destroy']);
        });

        // ─── Voter-with-roles management (any user with view-voters permission) ─
        Route::middleware('permission:view-voters')->group(function () {
            Route::get('admin/voters',                      [RolesController::class, 'voters']);
            Route::put('admin/users/{user}/roles',          [RolesController::class, 'syncRoles']);
            Route::get('admin/organizations-list',          [RolesController::class, 'organizationsList']);
            Route::get('admin/elections-list',              [RolesController::class, 'electionsList']);
        });
    });
});
