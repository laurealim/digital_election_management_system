# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DEMS** is a Multi-Tenant SaaS Election Management System targeting government offices, companies, associations, and cooperatives. Backend is a Laravel 12 API (`backend/`). Frontend is a React SPA (`frontend/`, not yet scaffolded).

See [requirements.md](requirements.md) for full spec and [doc/workflow.md](doc/workflow.md) for the step-by-step build plan.

**Current Status**: Phase 21 — Full role system, landing page, Bengali i18n, and role management UI complete.

## Tech Stack

### Backend (`backend/`)
- **Framework**: Laravel 12 with Laravel Sanctum (API token auth)
- **Authorization**: Spatie Laravel Permission (roles & permissions)
- **Database**: MySQL — shared-DB multi-tenancy via `organization_id` + global scopes
- **Caching/Queues**: Redis (`CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`)
- **Excel import**: Maatwebsite/Laravel-Excel
- **PDF export**: barryvdh/laravel-dompdf
- **Architecture**: Event-driven, RESTful API-first (`/api/v1/`)

### Frontend (`frontend/`)
- **Framework**: React 19 (Vite) — runs on `http://localhost:5173`
- **Styling**: Tailwind CSS v3 + ShadCN UI component system (CSS variable color tokens)
- **State**: Zustand (`src/store/authStore.js`) — token + user persisted to localStorage
- **Server state**: TanStack React Query — `staleTime: 1min`, `retry: 1`
- **Routing**: React Router v6 (`src/router/index.jsx`) — `AuthGuard` + `RoleGuard` protect all routes
- **API client**: `src/api/axios.js` — Bearer token injection, 401 → redirect to `/login`

## Development Commands

```bash
# Frontend
cd frontend
npm install
npm run dev              # runs on http://localhost:5173
npm run build            # production build

# Backend
cd backend
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve              # runs on http://localhost:8000
php artisan queue:work --queue=emails,heavy,elections
php artisan schedule:work      # election auto start/stop

# Run a single test
php artisan test --filter TestClassName
```

## Backend Architecture

### Multi-Tenancy
All tenant-scoped models extend `app/Models/TenantModel.php`, which applies `app/Scopes/TenantScope.php` automatically. This scope injects `WHERE organization_id = <current_user_org>` on every query. Super admins bypass it. `organization_id` is also auto-set on `creating`.

### Base Controller
All API controllers extend `app/Http/Controllers/Api/V1/ApiController.php`. Use its helpers:
- `$this->success($data, $message, $status)` — 200 response
- `$this->created($data)` — 201 response
- `$this->error($message, $status, $errors)` — error response
- `$this->paginated($paginator)` — paginated list response

### Standard API Response Envelope
```json
{ "success": true, "message": "...", "data": {}, "meta": {} }
```

### Roles (Spatie) — 7 Roles
`super_admin` · `org_admin` · `org_user` · `election_admin` · `election_user` · `voter` · `candidate`

- **super_admin** — full access, manages all orgs/elections via `/admin/*` routes
- **org_admin** — full CRUD within their org (elections, voters, posts, candidates, results)
- **org_user** — create/edit elections (no delete), manage voters, view results
- **election_admin** — manage voters + posts + candidates within elections, view results
- **election_user** — manage voters (no delete), view results
- **voter** — cast vote, view published results
- **candidate** — cast vote, view results, view own candidate vote tally (`/results/mine`)

Route-level protection uses `->middleware('role:super_admin')` or `'role:super_admin|org_admin'`. Policy-level in `app/Policies/`.

`User` model helpers: `isSuperAdmin()`, `isOrgAdmin()`, `isOrgUser()`, `isElectionAdmin()`, `isElectionUser()`, `isVoter()`, `isCandidate()`, `isOrgManager()` (org_admin/org_user/super_admin), `isElectionManager()` (all mgmt roles).

### Scheduler
`routes/console.php` runs every minute checking for elections to start/stop (`StartElectionJob` / `StopElectionJob`). Requires `php artisan schedule:work` running.

### Key Files
| File | Purpose |
|------|---------|
| `app/Scopes/TenantScope.php` | Global multi-tenant query scope |
| `app/Models/TenantModel.php` | Base model — all tenant models extend this |
| `app/Http/Controllers/Api/V1/ApiController.php` | Base controller with response helpers |
| `routes/api.php` | All API routes under `/api/v1/` |
| `routes/console.php` | Scheduled election lifecycle jobs |
| `bootstrap/app.php` | CORS, Sanctum stateful middleware, Spatie middleware aliases, 404 JSON handler |
| `app/Http/Controllers/Api/V1/Auth/` | LoginController, LogoutController, MeController, ForgotPasswordController, ResetPasswordController, SetupPasswordController |
| `app/Services/PasswordResetService.php` | Token generation, validation (60 min expiry), password reset logic |
| `app/Jobs/SendPasswordResetMailJob.php` | Queued email dispatch for password reset + first-login setup |
| `app/Mail/PasswordResetMail.php` | Mailable — handles both `reset` and `setup` types |
| `database/seeders/RolesAndPermissionsSeeder.php` | Seeds 7 roles + 21 granular permissions |
| `app/Http/Controllers/Api/V1/Admin/RolesController.php` | GET/PUT roles+permissions; GET/PUT user role assignment |
| `database/seeders/SuperAdminSeeder.php` | Default super admin: `admin@dems.app` / `Admin@1234` |
| `app/Models/Organization.php` | Tenant root model; `isVerified()`, `admins()` helpers |
| `app/Http/Controllers/Api/V1/OrganizationController.php` | Public registration (org + admin in 1 transaction), email verify, profile view/update |
| `app/Http/Controllers/Api/V1/Admin/OrganizationController.php` | Super admin: paginated list, show, toggle status |
| `app/Jobs/SendOrganizationVerificationMailJob.php` | Dispatches 24h signed verification URL email |
| `app/Models/Election.php` | Tenant model; status helpers, `votingStartsAt()`, `votingEndsAt()` in Asia/Dhaka |
| `app/Policies/ElectionPolicy.php` | Enforces org ownership + `isEditable()` / `isImmutable()` guards |
| `app/Http/Controllers/Api/V1/ElectionController.php` | CRUD + status transitions + duplicate endpoint |
| `app/Jobs/StartElectionJob.php` | Transitions election `scheduled → active`; dispatched with delay from observer |
| `app/Jobs/StopElectionJob.php` | Transitions election `active → completed`; dispatched with delay from observer |
| `app/Observers/ElectionObserver.php` | On `status → scheduled`, dispatches delayed Start/Stop jobs |
| `app/Models/Voter.php` | TenantModel; belongs to Election, User, Organization |
| `app/Policies/VoterPolicy.php` | Org ownership + `isEditable()` guard on add/delete |
| `app/Http/Controllers/Api/V1/VoterController.php` | Index, store (firstOrCreate user), destroy, resendInvitation, import |
| `app/Jobs/SendVoterInvitationJob.php` | Generates setup token, sends VoterInvitationMail, stamps `invitation_sent_at` |
| `app/Mail/VoterInvitationMail.php` | Invitation email with election details + setup URL |
| `app/Imports/VotersImport.php` | Excel import — row validation, skip dupes, per-row error collection |
| `app/Models/Post.php` | TenantModel; belongs to Election; has many Candidates; `max_votes`, `order` |
| `app/Models/Candidate.php` | TenantModel; belongs to Election, Post, User, Organization |
| `app/Policies/PostPolicy.php` | Org ownership + `isEditable()` guard |
| `app/Policies/CandidatePolicy.php` | Org ownership + `isEditable()` guard; open mode blocks manual assign |
| `app/Http/Controllers/Api/V1/PostController.php` | CRUD for posts within an election |
| `app/Http/Controllers/Api/V1/CandidateController.php` | Assign/remove candidates; enforces mode, voter enrollment, allow_multi_post |
| `app/Models/Vote.php` | Append-only (`$timestamps=false`); unique `(voter_id, election_id, post_id)` |
| `app/Models/AuditLog.php` | Immutable audit trail; payload cast to array |
| `app/Events/VoteCast.php` | Carries voter, election, voteIds, ip, userAgent |
| `app/Listeners/LogVoteCast.php` | Writes to `audit_logs` on every vote |
| `app/Services/VotingService.php` | Core vote logic — `lockForUpdate`, HMAC hash per ballot, atomic transaction |
| `app/Http/Controllers/Api/V1/VoteController.php` | `store()` (delegates to VotingService) + `status()` (has_voted/voted_at) |
| `app/Events/ElectionCompleted.php` | Fired by StopElectionJob when election transitions to completed |
| `app/Listeners/PublishElectionResults.php` | Auto-sets `is_result_published = true` on ElectionCompleted |
| `app/Services/ResultService.php` | Aggregates votes → winners, turnout %, chart labels+datasets |
| `app/Exports/ResultsExport.php` | Multi-sheet Excel export (Summary + one sheet per post) |
| `app/Http/Controllers/Api/V1/ResultController.php` | `show()`, `exportPdf()`, `exportExcel()`, `myCandidateResults()` — access-controlled by role |
| `resources/views/pdf/election-results.blade.php` | DomPDF template — A4 results report with winner highlighting |

## Frontend Architecture

### Route Namespacing
- `/` — public landing page (`LandingPage.jsx`)
- `/admin/*` — super_admin only (`SuperAdminLayout`)
- `/dashboard`, `/elections/*` — management roles: org_admin, org_user, election_admin, election_user (`OrgAdminLayout`)
- `/voter/*` — voter + candidate (`VoterLayout`)

### Key Frontend Files
| File | Purpose |
|------|---------|
| `src/hooks/useBasePath.js` | Returns `/admin`, `''`, or `/voter` based on current user role |
| `src/pages/public/LandingPage.jsx` | Bengali landing page with features, roles, how-it-works sections |
| `src/pages/admin/RolesPage.jsx` | Permissions matrix editor + user role assignment table |
| `src/pages/voter/CandidateResultsPage.jsx` | Candidate's own vote tally per post with charts |
| `src/api/roles.js` | `getRolesAndPermissions`, `updateRolePermissions`, `getUsers`, `assignUserRole` |
| `src/i18n/bn.json` + `en.json` | Full Bengali + English translations for all UI text |

### Role-Based UI Guards
- `RoleGuard` checks `user.role` (singular string from `MeController`)
- Management roles share `OrgAdminLayout` — role-specific title set dynamically
- Election detail tabs (Voters, Posts, Candidates, Results) conditionally show actions based on `user.role` in the component

## Workflow Tracking

**Every time code is written, updated, or modified:**
1. Update [doc/workflow.md](doc/workflow.md) — mark completed steps `[x]`, add entry to Change Log
2. Update this `CLAUDE.md` if architecture, commands, or key files change

Always read [doc/workflow.md](doc/workflow.md) before starting a phase to understand what is done and what comes next.

## Local Dev Notes (WAMP)
- Redis is not available by default in WAMP — `.env` uses `CACHE_STORE=file`, `QUEUE_CONNECTION=database`, `SESSION_DRIVER=file`
- Switch these to `redis` once a Redis server is running (`REDIS_CLIENT=predis` is configured)
- MySQL default engine was MyISAM — fixed by setting `'engine' => 'InnoDB'` in `config/database.php`
- `Schema::defaultStringLength(191)` set in `AppServiceProvider` for utf8mb4 index compatibility

## Security Priorities
- Double-vote prevention: unique DB constraint on `(voter_id, election_id, post_id)` + Redis lock in `VotingService`
- All voting actions logged to `audit_logs` table
- `VOTE_HASH_SALT` in `.env` used to generate tamper-proof `vote_hash` per vote record
- Rate limiting: global `throttle:60,1`, voting endpoint `throttle:10,1`, login `throttle:5,1`
