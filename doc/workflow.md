# DEMS — Full Work Plan & Workflow

**Project**: Multi-Tenant SaaS Election Management System (DEMS)
**Stack**: Laravel 12 (Backend API) + React (Frontend SPA)
**Last Updated**: 2026-03-29
**Status**: In Progress — Phase 21

---

## Overview

This document is the master work plan for building DEMS. It is updated every time code is written, modified, or scaffolded. Each phase lists its steps with full detail, decisions, diagrams, and completion status.

---

## Phase Index

| Phase | Title | Status |
|-------|-------|--------|
| 1 | System Architecture & Design | ✅ Done |
| 2 | Database Design & Schema | ✅ Done |
| 3 | Backend Scaffolding & Configuration | ✅ Done |
| 4 | Authentication & Authorization | ✅ Done |
| 5 | Organization Module | ✅ Done |
| 6 | Election Module | ✅ Done |
| 7 | Voter Management Module | ✅ Done |
| 8 | Candidate & Post Management | ✅ Done |
| 9 | Voting Engine | ✅ Done |
| 10 | Results & Analytics Module | ✅ Done |
| 11 | Frontend — Project Setup | ✅ Done |
| 12 | Frontend — Auth & Layout | ✅ Done |
| 13 | Frontend — Organization & Election UI | ✅ Done |
| 14 | Frontend — Voter & Candidate UI | ✅ Done |
| 15 | Frontend — Voting Interface | ✅ Done |
| 16 | Frontend — Results & Analytics UI | ✅ Done |
| 17 | Notifications & Email System | ✅ Done |
| 18 | Advanced Features | ✅ Done |
| 19 | Security Hardening | ✅ Done |
| 20 | Testing | ✅ Done |
| 21 | Deployment & DevOps | ✅ Done |

---

## Phase 1 — System Architecture & Design ✅

**Goal**: Define the complete technical blueprint before writing a single line of code.

---

### 1.1 — System Architecture Diagram ✅

The system has 3 layers:

```
┌─────────────────────────────────────────────────────┐
│                  CLIENT LAYER                        │
│   React SPA (Browser)  ←→  Axios + React Query      │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────▼──────────────────────────────┐
│                  API LAYER (Laravel 12)              │
│  /api/v1/*  →  Sanctum Auth → Role/Permission Check │
│  Controllers → Services → Models → Events           │
│  Queue Worker (Redis) — emails, heavy jobs          │
└──────────┬────────────────────────┬─────────────────┘
           │                        │
┌──────────▼──────┐      ┌──────────▼──────┐
│   MySQL (DB)    │      │   Redis          │
│  Shared schema  │      │  Cache + Queues  │
│  org_id scoped  │      └─────────────────┘
└─────────────────┘
```

---

### 1.2 — Tenant Isolation Strategy ✅

- **Model**: Shared Database, single schema
- Every tenant-scoped table has an `organization_id` column
- A `TenantScope` global scope is applied to all tenant models — automatically appends `WHERE organization_id = <current_org>` to every query
- Super Admin bypasses this scope via a flag check
- No row-level security at DB level — enforced purely at application layer via Laravel global scopes and Policies

---

### 1.3 — API Versioning Strategy ✅

All routes prefixed with `/api/v1/`:

```
/api/v1/auth/*          → authentication (login, logout, password reset)
/api/v1/organizations/* → org management
/api/v1/elections/*     → election CRUD + lifecycle
/api/v1/voters/*        → voter management per election
/api/v1/candidates/*    → candidate management
/api/v1/posts/*         → position management
/api/v1/votes/*         → voting engine
/api/v1/results/*       → results & analytics
/api/v1/admin/*         → super admin only endpoints
```

Standard API response envelope for all endpoints:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": {
    "pagination": {
      "current_page": 1,
      "per_page": 15,
      "total": 100
    }
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

---

### 1.4 — Laravel Backend Folder Structure ✅

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── V1/
│   │   │           ├── Auth/
│   │   │           │   ├── LoginController.php
│   │   │           │   ├── LogoutController.php
│   │   │           │   └── PasswordResetController.php
│   │   │           ├── Admin/
│   │   │           │   └── OrganizationController.php  (super admin)
│   │   │           ├── OrganizationController.php
│   │   │           ├── ElectionController.php
│   │   │           ├── VoterController.php
│   │   │           ├── CandidateController.php
│   │   │           ├── PostController.php
│   │   │           ├── VoteController.php
│   │   │           └── ResultController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureOrganizationOwnership.php
│   │   │   └── SetTenantScope.php
│   │   └── Requests/
│   │       └── Api/V1/
│   │           ├── Auth/
│   │           ├── Election/
│   │           ├── Voter/
│   │           └── Vote/
│   ├── Models/
│   │   ├── Organization.php
│   │   ├── User.php
│   │   ├── Election.php
│   │   ├── Post.php
│   │   ├── Candidate.php
│   │   ├── Voter.php
│   │   ├── Vote.php
│   │   └── AuditLog.php
│   ├── Services/
│   │   ├── VotingService.php
│   │   ├── ResultService.php
│   │   ├── VoterImportService.php
│   │   └── ElectionSchedulerService.php
│   ├── Events/
│   │   ├── VoteCast.php
│   │   ├── ElectionStarted.php
│   │   └── ElectionCompleted.php
│   ├── Listeners/
│   │   ├── LogVoteCast.php
│   │   └── PublishElectionResults.php
│   ├── Jobs/
│   │   ├── StartElectionJob.php
│   │   ├── StopElectionJob.php
│   │   ├── SendVoterInvitationJob.php
│   │   └── ExportResultsJob.php
│   ├── Policies/
│   │   ├── ElectionPolicy.php
│   │   ├── VoterPolicy.php
│   │   └── VotePolicy.php
│   ├── Scopes/
│   │   └── TenantScope.php
│   └── Exports/
│       ├── VotersExport.php
│       └── ResultsExport.php
├── database/
│   ├── migrations/
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── RolesAndPermissionsSeeder.php
│       └── SuperAdminSeeder.php
└── routes/
    └── api.php
```

---

### 1.5 — React Frontend Folder Structure ✅

```
frontend/
├── src/
│   ├── api/
│   │   ├── axios.js            → base Axios instance with interceptors
│   │   ├── auth.js
│   │   ├── elections.js
│   │   ├── voters.js
│   │   ├── votes.js
│   │   └── results.js
│   ├── components/
│   │   ├── ui/                 → ShadCN base components (Button, Input, etc.)
│   │   └── shared/
│   │       ├── Navbar.jsx
│   │       ├── Sidebar.jsx
│   │       ├── CountdownTimer.jsx
│   │       ├── StatusBadge.jsx
│   │       └── DataTable.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── SetupPassword.jsx
│   │   ├── admin/              → super admin pages
│   │   │   ├── Dashboard.jsx
│   │   │   └── Organizations.jsx
│   │   ├── org/                → org admin pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Elections.jsx
│   │   │   ├── ElectionDetail.jsx
│   │   │   ├── Voters.jsx
│   │   │   ├── Candidates.jsx
│   │   │   ├── Posts.jsx
│   │   │   └── Results.jsx
│   │   └── voter/              → voter-facing pages
│   │       ├── Dashboard.jsx
│   │       ├── VotingInstructions.jsx
│   │       ├── Ballot.jsx
│   │       └── VoteConfirmed.jsx
│   ├── store/
│   │   ├── authStore.js        → Zustand: user, token, role
│   │   └── electionStore.js    → Zustand: active election state
│   ├── hooks/
│   │   ├── useElections.js     → React Query hooks
│   │   ├── useVoters.js
│   │   └── useResults.js
│   ├── utils/
│   │   ├── dateHelper.js       → GMT+6 formatting
│   │   ├── exportHelper.js
│   │   └── constants.js
│   └── router/
│       ├── index.jsx
│       └── guards/
│           ├── AuthGuard.jsx
│           ├── RoleGuard.jsx
│           └── VoterGuard.jsx
└── public/
```

---

### 1.6 — Environment Variables (`.env.example`) ✅

```env
# App
APP_NAME=DEMS
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000
APP_TIMEZONE=Asia/Dhaka

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dems
DB_USERNAME=root
DB_PASSWORD=

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# Mail
MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@dems.app
MAIL_FROM_NAME="${APP_NAME}"

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost:5173

# Frontend
FRONTEND_URL=http://localhost:5173

# Vote Security
VOTE_HASH_SALT=change_this_to_a_random_secret
```

---

### 1.7 — Redis Usage Plan ✅

| Key Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `election:{id}:status` | String | 1hr | Cached election status, invalidated on transition |
| `election:{id}:results` | Hash | Forever | Cached final vote counts post-completion |
| `voter:{id}:voted:{election_id}` | String | Election lifetime | Fast double-vote check before DB query |
| `org:{id}:elections` | JSON String | 5min | Cached election list per org |
| Queue: `emails` | Queue | — | Welcome emails, password resets, reminders |
| Queue: `heavy` | Queue | — | Excel import processing, PDF/Excel result exports |
| Queue: `elections` | Queue | — | Scheduled StartElectionJob / StopElectionJob |

---

### 1.8 — Authentication Flow ✅

```
── Voter First Login Flow ──────────────────────────────
1. Org Admin imports voter (Excel or manual form)
2. System creates User record (password = NULL)
3. System dispatches SendVoterInvitationJob (queued)
4. Email sent: "Set up your password" with signed URL
   → URL: {FRONTEND_URL}/setup-password?token=xxx&email=yyy
5. Voter clicks link → enters new password
6. POST /api/v1/auth/setup-password → password saved, account active
7. Voter redirected to Login page

── Standard Login Flow ─────────────────────────────────
1. POST /api/v1/auth/login  { email, password }
2. Sanctum validates credentials
3. Returns: { token, user: { id, name, role, organization_id } }
4. Frontend stores token in Zustand + localStorage
5. All subsequent requests: Authorization: Bearer <token>

── Password Reset Flow ─────────────────────────────────
1. POST /api/v1/auth/forgot-password  { email }
2. Signed reset token stored in password_reset_tokens table
3. Email dispatched with reset link (expires 60 min)
4. POST /api/v1/auth/reset-password  { token, email, password }
5. Password updated, all existing tokens for user revoked

── Logout Flow ─────────────────────────────────────────
1. POST /api/v1/auth/logout
2. Current Sanctum token deleted from personal_access_tokens
3. Frontend clears Zustand store + localStorage
```

**Deliverables**: Architecture diagram, folder structure, env file, Redis plan, auth flow — all defined.

---

## Phase 2 — Database Design & Schema 🔄

**Goal**: Design a complete, normalized, multi-tenant database schema with all tables, columns, relationships, constraints, and indexes.

---

### 2.1 — `organizations` table ✅

Tenant root. Every tenant-scoped record links back here.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `name` | VARCHAR(255) | NOT NULL | Organization display name |
| `type` | ENUM | NOT NULL | `govt`, `private`, `association`, `cooperative` |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login + verification email |
| `phone` | VARCHAR(20) | NOT NULL | |
| `address` | TEXT | NULLABLE | |
| `email_verified_at` | TIMESTAMP | NULLABLE | NULL = unverified |
| `is_active` | TINYINT(1) | DEFAULT 1 | Soft enable/disable by super admin |
| `created_at` | TIMESTAMP | | |
| `updated_at` | TIMESTAMP | | |

---

### 2.2 — `users` table ✅

All user types in one table. Role assigned via Spatie (super_admin, org_admin, voter, candidate).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `organization_id` | BIGINT UNSIGNED | FK NULLABLE | NULL = Super Admin |
| `name` | VARCHAR(255) | NOT NULL | |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Globally unique across all orgs |
| `mobile` | VARCHAR(20) | NULLABLE | Required for voters |
| `office_name` | VARCHAR(255) | NULLABLE | Voter's department/office |
| `designation` | VARCHAR(255) | NULLABLE | Voter's job title |
| `password` | VARCHAR(255) | NULLABLE | NULL until first-login setup |
| `password_set_at` | TIMESTAMP | NULLABLE | Timestamp of first password set |
| `email_verified_at` | TIMESTAMP | NULLABLE | |
| `is_active` | TINYINT(1) | DEFAULT 1 | |
| `created_at` | TIMESTAMP | | |
| `updated_at` | TIMESTAMP | | |

**Index**: `organization_id`

---

### 2.3 — `elections` table ✅

One election belongs to one organization. Fully isolated.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `organization_id` | BIGINT UNSIGNED | FK, NOT NULL | Tenant scope |
| `name` | VARCHAR(255) | NOT NULL | |
| `description` | TEXT | NULLABLE | |
| `election_date` | DATE | NOT NULL | The date of the election |
| `voting_start_time` | TIME | NOT NULL | Default `09:00:00` (GMT+6) |
| `voting_end_time` | TIME | NOT NULL | Default `16:00:00` (GMT+6) |
| `status` | ENUM | NOT NULL, DEFAULT `draft` | `draft`, `scheduled`, `active`, `completed`, `cancelled` |
| `candidate_mode` | ENUM | NOT NULL, DEFAULT `selected` | `selected` (admin assigns) or `open` (all voters eligible) |
| `allow_multi_post` | TINYINT(1) | DEFAULT 0 | Candidate can run for multiple posts |
| `is_result_published` | TINYINT(1) | DEFAULT 0 | Auto-set true when completed |
| `completed_at` | TIMESTAMP | NULLABLE | |
| `created_at` | TIMESTAMP | | |
| `updated_at` | TIMESTAMP | | |

**Business Rule**: `election_date + voting_start_time` must be ≥ 24 hours from `created_at` — enforced at app layer (Form Request validation).

**Index**: `(organization_id, status)`

---

### 2.4 — `posts` table ✅

Positions/roles voters can vote for within an election.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `organization_id` | BIGINT UNSIGNED | FK, NOT NULL | Tenant scope |
| `election_id` | BIGINT UNSIGNED | FK, NOT NULL | |
| `name` | VARCHAR(255) | NOT NULL | e.g. President, Treasurer |
| `winner_count` | TINYINT UNSIGNED | NOT NULL, DEFAULT 1 | How many winners for this post |
| `order` | TINYINT UNSIGNED | DEFAULT 0 | Display order on ballot |
| `created_at` | TIMESTAMP | | |
| `updated_at` | TIMESTAMP | | |

**Index**: `(election_id)`

---

### 2.5 — `candidates` table ✅

A user assigned (or self-nominated) to run for a specific post in an election.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `organization_id` | BIGINT UNSIGNED | FK, NOT NULL | Tenant scope |
| `election_id` | BIGINT UNSIGNED | FK, NOT NULL | |
| `post_id` | BIGINT UNSIGNED | FK, NOT NULL | |
| `user_id` | BIGINT UNSIGNED | FK, NOT NULL | Must be a voter in this election |
| `nominated_by` | BIGINT UNSIGNED | FK NULLABLE | `users.id` of admin who assigned |
| `created_at` | TIMESTAMP | | |
| `updated_at` | TIMESTAMP | | |

**Unique**: `(election_id, post_id, user_id)` — no duplicate candidacy per post per election.

**Index**: `(election_id, post_id)`

---

### 2.6 — `voters` table ✅

Junction table: links a user to a specific election they are enrolled in.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `organization_id` | BIGINT UNSIGNED | FK, NOT NULL | Tenant scope |
| `election_id` | BIGINT UNSIGNED | FK, NOT NULL | |
| `user_id` | BIGINT UNSIGNED | FK, NOT NULL | |
| `import_source` | ENUM | NOT NULL | `manual`, `excel` |
| `has_voted` | TINYINT(1) | DEFAULT 0 | Fast flag — avoids heavy query |
| `voted_at` | TIMESTAMP | NULLABLE | |
| `created_at` | TIMESTAMP | | |
| `updated_at` | TIMESTAMP | | |

**Unique**: `(election_id, user_id)` — a user can only be enrolled once per election.

**Index**: `(election_id)`, `(user_id)`

---

### 2.7 — `votes` table ✅

The most critical table. Write-once. Tamper-proof. Never updated or soft-deleted.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `organization_id` | BIGINT UNSIGNED | FK, NOT NULL | Tenant scope |
| `election_id` | BIGINT UNSIGNED | FK, NOT NULL | |
| `voter_id` | BIGINT UNSIGNED | FK, NOT NULL | → `voters.id` |
| `post_id` | BIGINT UNSIGNED | FK, NOT NULL | |
| `candidate_id` | BIGINT UNSIGNED | FK, NOT NULL | → `candidates.id` |
| `vote_hash` | VARCHAR(64) | NOT NULL | SHA-256 of `voter_id+election_id+post_id+salt` — integrity check |
| `ip_address` | VARCHAR(45) | NULLABLE | Optional tracking |
| `user_agent` | TEXT | NULLABLE | Optional tracking |
| `cast_at` | TIMESTAMP | NOT NULL | Exact vote cast time |

**No `created_at` / `updated_at`** — votes are immutable, write-once only.

**Unique**: `(voter_id, election_id, post_id)` — **DB-level enforcement** of one vote per post per election.

**Index**: `(election_id, post_id, candidate_id)` — optimized for result aggregation queries.

---

### 2.8 — `audit_logs` table ✅

Append-only log of all significant user actions across the system.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `organization_id` | BIGINT UNSIGNED | FK NULLABLE | NULL for super admin actions |
| `user_id` | BIGINT UNSIGNED | FK NULLABLE | NULL for system/cron actions |
| `action` | VARCHAR(100) | NOT NULL | e.g. `vote.cast`, `election.created`, `voter.imported` |
| `subject_type` | VARCHAR(100) | NULLABLE | Morph type e.g. `Election`, `Vote` |
| `subject_id` | BIGINT UNSIGNED | NULLABLE | ID of the affected record |
| `payload` | JSON | NULLABLE | Snapshot of relevant data at time of action |
| `ip_address` | VARCHAR(45) | NULLABLE | |
| `created_at` | TIMESTAMP | NOT NULL | Append-only — no `updated_at` |

**Index**: `(organization_id, action)`, `(user_id)`

---

### 2.9 — `password_reset_tokens` table ✅

Handles both standard password resets and first-login setup links for imported voters.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `email` | VARCHAR(255) | PK | |
| `token` | VARCHAR(255) | NOT NULL | Hashed token |
| `type` | ENUM | NOT NULL, DEFAULT `reset` | `reset` = forgot password, `setup` = first-login voter setup |
| `created_at` | TIMESTAMP | NULLABLE | Used to check expiry (60 min) |

---

### 2.10 — Foreign Keys, Indexes & Unique Constraints ✅

**Summary of all UNIQUE constraints (double-protection):**

| Table | Unique Constraint | Purpose |
|-------|-------------------|---------|
| `organizations` | `(email)` | One org per email |
| `users` | `(email)` | Global unique user email |
| `voters` | `(election_id, user_id)` | Voter enrolled once per election |
| `candidates` | `(election_id, post_id, user_id)` | No duplicate candidacy |
| `votes` | `(voter_id, election_id, post_id)` | **Core: one vote per post per election** |

**Foreign Key Cascade Rules:**

| FK | On Delete |
|----|-----------|
| `users.organization_id` → `organizations.id` | RESTRICT |
| `elections.organization_id` → `organizations.id` | RESTRICT |
| `posts.election_id` → `elections.id` | CASCADE |
| `candidates.election_id` → `elections.id` | CASCADE |
| `voters.election_id` → `elections.id` | RESTRICT (protect votes) |
| `votes.voter_id` → `voters.id` | RESTRICT |
| `votes.candidate_id` → `candidates.id` | RESTRICT |

---

### 2.11 — Full ERD (Entity Relationship Diagram) ✅

```
organizations (1)────────────(N) users
     │                              │
     │ (1)                          │
     ▼                              │
   elections (1)──────────(N) voters (N)──(1) users
     │
     ├──(1)────(N) posts
     │              │
     │              └──(1)────(N) candidates ──(N)──(1) users
     │
     └──(1)────(N) votes
                    │
                    ├── voter_id  →  voters.id
                    ├── post_id   →  posts.id
                    └── candidate_id → candidates.id

audit_logs ──(N)──(1) users
audit_logs ──(N)──(1) organizations
```

**Deliverables**: All 9 tables fully defined, ERD complete, constraints documented.

---

## Phase 3 — Backend Scaffolding & Configuration

**Goal**: Set up the Laravel 12 project with all required packages and base configuration.

### Steps:
- [x] 3.1 Initialize Laravel 12 project (`composer create-project laravel/laravel backend`)
- [x] 3.2 Install and configure Laravel Sanctum (`php artisan install:api`)
- [x] 3.3 Install and configure Spatie Laravel Permission (`composer require spatie/laravel-permission`)
- [x] 3.4 Configure Redis as cache and queue driver in `.env` (`QUEUE_CONNECTION=redis`, `CACHE_STORE=redis`)
- [x] 3.5 Install Maatwebsite Laravel-Excel (`composer require maatwebsite/excel`) for voter import
- [x] 3.6 Install barryvdh/laravel-dompdf (`composer require barryvdh/laravel-dompdf`) for PDF export
- [x] 3.7 Create `.env` and `.env.example` with all DEMS variables (DB, Redis, Mail, Sanctum, VOTE_HASH_SALT)
- [x] 3.8 Set up `routes/api.php` with full `/v1` prefix group — all routes stubbed
- [x] 3.9 Create `app/Scopes/TenantScope.php` — auto-injects `organization_id`, bypasses for super_admin
- [x] 3.10 Create `app/Models/TenantModel.php` — base model all tenant models extend
- [x] 3.11 Configure CORS + Sanctum stateful middleware in `bootstrap/app.php`
- [x] 3.12 Create `app/Http/Controllers/Api/V1/ApiController.php` — `success()`, `error()`, `created()`, `paginated()` helpers
- [x] 3.13 Configure election lifecycle scheduler in `routes/console.php` (runs every minute, StartElectionJob / StopElectionJob)

**Deliverables**: Working Laravel 12 project, all packages installed, base architecture wired

---

## Phase 4 — Authentication & Authorization

**Goal**: Implement secure, role-based authentication for all user types.

### Steps:
- [x] 4.1 Run Spatie migrations + publish config; define all roles: `super_admin`, `org_admin`, `voter`, `candidate`
- [x] 4.2 Define all permissions: `manage-organizations`, `manage-elections`, `manage-voters`, `cast-vote`, `view-results`, etc.
- [x] 4.3 Create `RolesAndPermissionsSeeder.php` — seeds all roles and assigns permissions (guard: `web`)
- [x] 4.4 Create `SuperAdminSeeder.php` — creates default super admin (`admin@dems.app` / `Admin@1234`)
- [x] 4.5 Create `LoginController` — validates credentials, returns Sanctum token + user data, blocks inactive/unset-password users
- [x] 4.6 Create `LogoutController` — revokes current token only
- [x] 4.7 Create `ForgotPasswordController` — generates reset token, dispatches `SendPasswordResetMailJob`
- [x] 4.8 Create `ResetPasswordController` — validates token (60 min expiry), updates password
- [x] 4.9 Create `SetupPasswordController` — first-login for imported voters (type: `setup`), blocks if already set
- [x] 4.10 Create `PasswordResetService` — token generation, validation, reset logic
- [x] 4.11 Create `SendPasswordResetMailJob` + `PasswordResetMail` mailable + `password-reset.blade.php` template
- [x] 4.12 Write Form Request validators for all 4 auth flows
- [x] 4.13 Updated `users` migration — DEMS fields: `organization_id`, `mobile`, `office_name`, `designation`, `password_set_at`, `is_active`; `password_reset_tokens` table gets `type` ENUM column
- [x] 4.14 Fixed: MySQL default engine was MyISAM — set `engine=InnoDB` in `config/database.php`; switched to `predis` client; set `CACHE_STORE=file` + `QUEUE_CONNECTION=database` for local dev (Redis not available in WAMP by default)

**API Endpoints:**
```
POST /api/v1/auth/login
POST /api/v1/auth/logout               (auth required)
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/setup-password
GET  /api/v1/auth/me                   (auth required)
```

**Deliverables**: All auth endpoints working, roles seeded, middleware in place

---

## Phase 5 — Organization Module

**Goal**: Allow organizations to register and be managed by Super Admin.

### Steps:
- [x] 5.1 Create and run `organizations` migration — includes `type` ENUM, `is_active`, `email_verified_at`; adds FK `users.organization_id → organizations.id` in same migration
- [x] 5.2 Create `Organization` model — `HasMany` users + elections; `isVerified()` + `admins()` helpers
- [x] 5.3 Create `RegisterOrganizationRequest` — validates org fields + admin account fields in one payload
- [x] 5.4 Create `UpdateOrganizationRequest` — partial update with unique email ignore-self
- [x] 5.5 Create `OrganizationController` — `store()` (registers org + org_admin in DB transaction, dispatches verification email), `verify()` (signed URL handler), `show()`, `update()`
- [x] 5.6 Create `Admin\OrganizationController` — `index()` (paginated, searchable, filterable), `show()`, `toggleStatus()`
- [x] 5.7 Create `SendOrganizationVerificationMailJob` + `OrganizationVerificationMail` + blade template (24h signed URL)
- [x] 5.8 Added `org.verify` named signed route in `routes/api.php`

**API Endpoints:**
```
POST   /api/v1/organizations                  (public — registration)
GET    /api/v1/organizations/{id}             (org admin — own org)
PUT    /api/v1/organizations/{id}             (org admin — update profile)
GET    /api/v1/admin/organizations            (super admin — list all)
PATCH  /api/v1/admin/organizations/{id}/toggle-status  (super admin)
```

**Deliverables**: Organization model, registration flow, email verification, tenant scope applied

---

## Phase 6 — Election Module ✅

**Goal**: Full election lifecycle management per organization.

### Steps:
- [x] 6.1 Create and run `elections` migration
- [x] 6.2 Create `Election` model with status enum, relationships, and `isImmutable()` helper
- [x] 6.3 Create `ElectionPolicy` — org admin can only manage own elections; immutable check on edit/delete
- [x] 6.4 Create `CreateElectionRequest` — validates 24h minimum constraint on `election_date + voting_start_time`
- [x] 6.5 Create `UpdateElectionRequest` — same 24h check only when date/time fields are present
- [x] 6.6 Create `ElectionController` — full CRUD + status transition endpoint + duplicate
- [x] 6.7 Implement status transition logic: `draft` ↔ `scheduled`, `→ cancelled`; `active`/`completed` driven by jobs
- [x] 6.8 Create `StartElectionJob` and `StopElectionJob` — dispatched with delay on election scheduling
- [x] 6.9 Create `ElectionObserver` — triggers jobs when status changes to `scheduled`
- [x] 6.10 Implement election duplication: copies election + posts structure (not voters or votes)

**API Endpoints:**
```
GET    /api/v1/elections                  (org admin — own elections)
POST   /api/v1/elections
GET    /api/v1/elections/{id}
PUT    /api/v1/elections/{id}
DELETE /api/v1/elections/{id}             (only if draft/scheduled)
POST   /api/v1/elections/{id}/duplicate
PATCH  /api/v1/elections/{id}/status      (manual override if needed)
```

**Deliverables**: Election CRUD, auto start/stop jobs, immutability enforcement, duplication

---

## Phase 7 — Voter Management Module ✅

**Goal**: Allow org admins to add and manage voters per election.

### Steps:
- [x] 7.1 Create and run `voters` migration (election_id, user_id, org_id, has_voted, voted_at, invitation_sent_at; unique on election+user)
- [x] 7.2 Create `Voter` model extending TenantModel + relationships to Election, User, Organization
- [x] 7.3 Create `VoterPolicy` — org ownership + `isEditable()` guard on add/delete
- [x] 7.4 Create `StoreVoterRequest` — validates name/email/mobile; cross-org email check
- [x] 7.5 Create `VoterController` — index (paginated + search), store (firstOrCreate user + enroll + invite), destroy, resendInvitation, import
- [x] 7.6 Create `SendVoterInvitationJob` — generates setup token, dispatches `VoterInvitationMail`, updates `invitation_sent_at`
- [x] 7.7 Create `VoterInvitationMail` + `voter-invitation.blade.php` — shows election details + setup URL
- [x] 7.8 Create `VotersImport` (Maatwebsite `ToCollection + WithHeadingRow`) — row-level validation, skips dupes, collects per-row errors, dispatches invitations

**API Endpoints:**
```
GET    /api/v1/elections/{election}/voters
POST   /api/v1/elections/{election}/voters              (manual add)
POST   /api/v1/elections/{election}/voters/import       (Excel upload)
DELETE /api/v1/elections/{election}/voters/{voter}
POST   /api/v1/elections/{election}/voters/{voter}/resend-invitation
```

**Deliverables**: Voter model, manual add, Excel import, invitation email

---

## Phase 8 — Candidate & Post Management ✅

**Goal**: Allow admins to define positions and assign candidates per election.

### Steps:
- [x] 8.1 Create and run `posts` migration (election_id, org_id, title, description, max_votes, order)
- [x] 8.2 Create and run `candidates` migration (election_id, post_id, user_id, org_id, bio; unique post+user)
- [x] 8.3 Create `Post` model extending TenantModel + relationships to Election, Organization, Candidates
- [x] 8.4 Create `Candidate` model extending TenantModel + relationships to Election, Post, User, Organization
- [x] 8.5 Create `PostPolicy` — org ownership + `isEditable()` guard on create/update/delete
- [x] 8.6 Create `CandidatePolicy` — org ownership + `isEditable()` guard on create/delete
- [x] 8.7 Create `PostController` — index (with candidate count), store, update, destroy
- [x] 8.8 Create `CandidateController` — index (open mode returns all voters), store (selected mode only), destroy
- [x] 8.9 Candidate mode enforcement: `open` mode blocks manual assignment; `selected` mode requires explicit add
- [x] 8.10 Voter enrollment check: user_id must be in `voters` for this election before being assigned
- [x] 8.11 `allow_multi_post` enforcement: prevents same user from being candidate on multiple posts when false

**API Endpoints:**
```
GET    /api/v1/elections/{election}/posts
POST   /api/v1/elections/{election}/posts
PUT    /api/v1/elections/{election}/posts/{post}
DELETE /api/v1/elections/{election}/posts/{post}
GET    /api/v1/elections/{election}/posts/{post}/candidates
POST   /api/v1/elections/{election}/posts/{post}/candidates
DELETE /api/v1/elections/{election}/posts/{post}/candidates/{candidate}
```

**Deliverables**: Post + Candidate models, assignment logic, mode enforcement

---

## Phase 9 — Voting Engine ✅

**Goal**: Implement the secure, atomic, tamper-proof voting mechanism.

### Steps:
- [x] 9.1 Create `votes` migration — unique `(voter_id, election_id, post_id)`; `vote_hash` unique string(64); no `updated_at`
- [x] 9.2 Create `audit_logs` migration — org_id, election_id, user_id (no FK), event, payload JSON, ip_address, user_agent; no `updated_at`
- [x] 9.3 Create `Vote` model — `$timestamps = false`; append-only; all relationships
- [x] 9.4 Create `AuditLog` model — `$timestamps = false`; payload cast to array
- [x] 9.5 Create `VoteCast` event — carries voter, election, voteIds, ip, userAgent
- [x] 9.6 Create `LogVoteCast` listener — writes to `audit_logs` on `VoteCast`
- [x] 9.7 Create `VotingService::castVote()` — election active check, `lockForUpdate()` on voter row, per-ballot `hash_hmac` hash, bulk Vote insert, sets `has_voted + voted_at`, fires `VoteCast` event
- [x] 9.8 Create `CastVoteRequest` — no duplicate posts, post_id belongs to election, candidate_id belongs to post
- [x] 9.9 Create `VoteController` — `store()` (enrolment check, delegates to VotingService), `status()` (returns has_voted + voted_at)
- [x] 9.10 Register `VoteCast → LogVoteCast` in `AppServiceProvider`
- [x] 9.11 `throttle:10,1` applied to `POST /elections/{election}/vote` route
- [x] 9.12 `vote_hash_salt` added to `config/app.php` via `VOTE_HASH_SALT` env var

**API Endpoints:**
```
POST /api/v1/elections/{election}/vote
GET  /api/v1/elections/{election}/voting-status
```

**Vote Submission Payload:**
```json
{
  "votes": [
    { "post_id": 1, "candidate_id": 5 },
    { "post_id": 2, "candidate_id": 8 }
  ]
}
```

**Deliverables**: Atomic vote submission, race condition protection, hash integrity, audit log

---

## Phase 10 — Results & Analytics Module ✅

**Goal**: Auto-publish and serve election results with chart-ready data and exports.

### Steps:
- [x] 10.1 Create `ResultService::getResults()` — aggregates votes per post per candidate, computes winners (top max_votes), turnout %, chart labels+datasets
- [x] 10.2 Create `ElectionCompleted` event — dispatched by `StopElectionJob` after transitioning to `completed`
- [x] 10.3 Create `PublishElectionResults` listener — auto-sets `is_result_published = true` on `ElectionCompleted`
- [x] 10.4 Register `ElectionCompleted → PublishElectionResults` in `AppServiceProvider`
- [x] 10.5 Create `ResultsExport` (Maatwebsite `WithMultipleSheets`) — Summary sheet + one sheet per post with rank/votes/winner columns
- [x] 10.6 Create `pdf/election-results.blade.php` — styled A4 PDF with turnout box, per-post tables, winner highlighting
- [x] 10.7 Create `ResultController` — `show()`, `exportPdf()` (DomPDF), `exportExcel()` (Maatwebsite)
- [x] 10.8 Access control: org admins always see results; voters/candidates only after `is_result_published = true`

**API Endpoints:**
```
GET  /api/v1/elections/{election}/results
GET  /api/v1/elections/{election}/results/export/pdf
GET  /api/v1/elections/{election}/results/export/excel
```

**Results Response Structure:**
```json
{
  "election": { "id": 1, "name": "Annual Election 2026" },
  "posts": [
    {
      "id": 1,
      "name": "President",
      "winner_count": 1,
      "winners": [{ "user": { "name": "John" }, "vote_count": 45 }],
      "candidates": [
        { "user": { "name": "John" }, "vote_count": 45 },
        { "user": { "name": "Jane" }, "vote_count": 30 }
      ],
      "chart": {
        "labels": ["John", "Jane"],
        "datasets": [{ "data": [45, 30] }]
      }
    }
  ]
}
```

**Deliverables**: Result aggregation, winner logic, chart JSON, PDF/Excel export

---

## Phase 11 — Frontend — Project Setup ✅

**Goal**: Scaffold the React SPA with all tooling configured.

### Steps:
- [x] 11.1 Vite React project scaffolded (`frontend/`) — `npm create vite@latest frontend -- --template react`
- [x] 11.2 Tailwind CSS v3 installed + configured — `tailwind.config.js` with full ShadCN color palette via CSS vars
- [x] 11.3 ShadCN UI components bootstrapped manually — `cn()` util, Button, Input, Label, Card, Badge, Alert in `src/components/ui/`
- [x] 11.4 `src/api/axios.js` — baseURL from `VITE_API_BASE_URL`, Bearer token injection, 401 → localStorage clear + redirect
- [x] 11.5 TanStack React Query — `QueryClientProvider` with `staleTime: 1min` in `main.jsx`
- [x] 11.6 Zustand `authStore` — `token`, `user`, `setAuth()`, `logout()` with localStorage persistence
- [x] 11.7 React Router v6 — full route tree in `src/router/index.jsx` (all pages for phases 12–16)
- [x] 11.8 `AuthGuard.jsx` — redirects to `/login` if no token in store
- [x] 11.9 `RoleGuard.jsx` — redirects to role-appropriate home if role mismatch
- [x] 11.10 `.env` with `VITE_API_BASE_URL=http://localhost:8000`; build passes clean (`npm run build` ✓)

**Deliverables**: Vite React project, Tailwind + ShadCN, Axios client, React Query, Zustand, routing

---

## Phase 12 — Frontend — Auth & Layout ✅

**Goal**: Login, password setup, and role-based shell layouts.

### Steps:
- [x] 12.1 `Login.jsx` — email/password form, role-based redirect after login, `requires_setup` error handling
- [x] 12.2 `ForgotPassword.jsx` — email form, success message, back to login link
- [x] 12.3 `SetupPassword.jsx` + `ResetPassword.jsx` — thin wrappers over shared `PasswordForm` component
- [x] 12.4 `PasswordForm.jsx` — reads `?token=&email=` from URL, validates match + length, calls setup or reset API
- [x] 12.5 `SuperAdminLayout.jsx` — sidebar (Organizations link), Outlet, via `Sidebar` component
- [x] 12.6 `OrgAdminLayout.jsx` — sidebar (Elections link), Outlet
- [x] 12.7 `VoterLayout.jsx` — top nav bar with My Elections link + sign-out, centered Outlet
- [x] 12.8 Token persistence already done via Zustand + localStorage in Phase 11; `authStore` rehydrates on load

**Deliverables**: All auth pages, 3 role-based layouts, protected routing

---

## Phase 13 — Frontend — Organization & Election UI ✅

**Goal**: Admin interfaces for org and election management.

### Steps:
- [x] 13.1 `RegisterOrganization.jsx` — 2-section form (org + admin), type dropdown, success state, field-level error display
- [x] 13.2 `admin/Organizations.jsx` — paginated table with search, type labels, status badge (Unverified/Inactive/Active), Activate/Deactivate toggle via React Query mutation
- [x] 13.3 `elections/ElectionList.jsx` — paginated table with search + status filter, status badges, view/edit/duplicate/delete actions (edit+delete only for draft/scheduled)
- [x] 13.4 `elections/ElectionForm.jsx` — create + edit form (detects `:id` param), loads existing data, all fields including candidate mode radio + multi-post checkbox
- [x] 13.5 Client-side 24h guard on voting_start_time; `min` attribute on date picker; end-after-start validation
- [x] 13.6 `elections/ElectionDetail.jsx` — tabbed page (Overview / Voters / Posts & Candidates / Results); status transition buttons; duplicate + delete actions
- [x] 13.7 Duplication via `duplicateElection()` mutation — redirects to new election detail on success

**Deliverables**: Org registration form, election list, election CRUD form, election detail tabs

---

## Phase 14 — Frontend — Voter & Candidate UI

**Goal**: Voter import, post management, and candidate assignment UI.

### Steps:
- [x] 14.1 Build Voter list page — table with name, email, designation, vote status, actions
- [x] 14.2 Build manual Add Voter modal/drawer form
- [x] 14.3 Build Excel import UI — drag-and-drop file zone, upload progress, error rows displayed in table
- [x] 14.4 Build Posts (Positions) management page — list, add, edit, reorder, set winner count
- [x] 14.5 Build Candidate assignment page — toggle selected/open mode; in selected mode: searchable voter dropdown to assign per post
- [x] 14.6 Build candidate list per post with remove button (locked once election is active)

**Deliverables**: Voter management UI, Excel import UI, post + candidate management

---

## Phase 15 — Frontend — Voting Interface

**Goal**: The voter-facing election experience — end-to-end ballot flow.

### Steps:
- [x] 15.1 Build Voter Dashboard — lists upcoming + active elections with countdown timer component
- [x] 15.2 Build `CountdownTimer.jsx` — real-time countdown to election start (updates every second)
- [x] 15.3 Build Instructions page — shown before ballot; explains one-time submission rule
- [x] 15.4 Build Ballot page — renders one section per post; each section has a searchable dropdown of candidates
- [x] 15.5 Require all posts answered before enabling Submit button
- [x] 15.6 Build Review + Confirm step — shows all selections before final submit
- [x] 15.7 Build `VoteConfirmed.jsx` — success screen post-submission
- [x] 15.8 Handle already-voted state — show read-only "You have already voted" with timestamp

**Deliverables**: Countdown timer, ballot form, confirmation step, locked state

---

## Phase 16 — Frontend — Results & Analytics UI

**Goal**: Visual results presentation with charts and export actions.

### Steps:
- [x] 16.1 Build Results page — winner card per post (name, vote count, winner badge)
- [x] 16.2 Install and integrate `recharts` for bar chart (votes per candidate per post)
- [x] 16.3 Integrate pie chart (vote share percentage per candidate per post)
- [x] 16.4 Build PDF export button — triggers GET `.../results/export/pdf`, downloads file
- [x] 16.5 Build Excel export button — triggers GET `.../results/export/excel`, downloads file
- [x] 16.6 Show results only if `is_result_published = true`; otherwise show "Results not yet published"

**Deliverables**: Winner cards, bar + pie charts, download buttons

---

## Phase 17 — Notifications & Email System

**Goal**: Transactional email system for all user-facing communications.

### Steps:
- [x] 17.1 Configure mail driver in `.env` (SMTP); create `MailServiceProvider` if needed
- [x] 17.2 Create `VoterInvitationMail` — "Welcome, set your password" with signed setup URL
- [x] 17.3 Create `PasswordResetMail` — standard reset link email
- [x] 17.4 Create `OrganizationVerificationMail` — email verification on org registration
- [x] 17.5 Create `ElectionReminderMail` — dispatched 24h before election starts (via scheduler)
- [x] 17.6 Create `ResultsPublishedMail` — notifies org admins when results are auto-published
- [x] 17.7 All mails dispatched via queued jobs on `emails` queue
- [x] 17.8 Create `email_logs` table + model to track delivery status

**Deliverables**: 5 email templates, all queued, email log tracking

---

## Phase 18 — Advanced Features

**Goal**: Enhancements specified in requirements.

### Steps:
- [x] 18.1 Multi-language: set up `i18next` + `react-i18next` + language detector on frontend; EN + Bengali (bn) locale JSON files; LanguageSwitcher component in Sidebar + VoterLayout
- [x] 18.2 Org Admin Dashboard: total elections/voters/votes stat cards, turnout bar chart per election, election status pie chart
- [x] 18.3 Voter reuse: "Copy from Election" button in VotersTab opens modal; backend copyFrom endpoint enrolls and sends invitations, skips duplicates
- [x] 18.4 Super Admin monitoring dashboard: org/election/voter stats, elections-per-month bar chart, orgs-by-type pie chart, recent audit log table

**Deliverables**: i18n (EN + Bangla), analytics dashboards, voter reuse

---

## Phase 19 — Security Hardening

**Goal**: Production-grade security audit and hardening.

### Steps:
- [x] 19.1 Audit every API endpoint — all protected routes under `auth:sanctum`; every controller action has `authorize()` or explicit role/org check
- [x] 19.2 `throttle:60,1` on entire authenticated route group; `throttle:5,1` on login; `throttle:10,1` on forgot/reset/setup-password
- [x] 19.3 `throttle:10,1` on vote submission endpoint (already done in Phase 9, verified)
- [x] 19.4 All user input covered by Form Requests or `$request->validate()`; no raw unchecked input reaches DB
- [x] 19.5 `vote_hash` uses `hash_hmac('sha256', "voter|election|post|candidate", VOTE_HASH_SALT)` — correct keyed hash integrity
- [x] 19.6 TenantScope injects `WHERE organization_id = X` on all TenantModel queries; policies enforce org ownership; super admin bypasses scope only
- [x] 19.7 Vote model now has `updating`/`deleting` boot events that throw RuntimeException; no update/delete routes exist for votes
- [x] 19.8 All `selectRaw` calls use only constants/column names — no user input interpolation; all `where` clauses use bound parameters
- [x] 19.9 SecurityHeaders middleware: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, CSP (skipped for binary exports); registered globally
- [x] Bug fix: PostsTab was sending `voter.id` to CandidateController which expected `user_id` — fixed to send `v.user?.id`

**Deliverables**: All endpoints secured, brute-force protection, isolation verified

---

## Phase 20 — Testing

**Goal**: Automated test coverage for all critical paths.

### Steps:
- [x] 20.1 Feature test: login with valid/invalid credentials
- [x] 20.2 Feature test: voter first-login password setup flow
- [x] 20.3 Feature test: cast vote — success path
- [x] 20.4 Feature test: cast vote — double vote attempt (must return 422)
- [x] 20.5 Feature test: tenant isolation — org A voter cannot vote in org B election
- [x] 20.6 Feature test: election status transitions (draft → scheduled → active → completed)
- [x] 20.7 Feature test: immutability — cannot edit completed election
- [x] 20.8 Feature test: Excel voter import with valid and invalid rows
- [x] 20.9 Unit test: `ResultService::determineWinners()` with tie-break scenarios
- [x] 20.10 Unit test: `vote_hash` generation and verification
- [x] 20.11 Frontend: component test for `Ballot.jsx` — all posts required before submit enabled

**Deliverables**: Passing test suite for all critical paths

---

## Phase 21 — Deployment & DevOps ✅

**Goal**: Production-ready deployment on a live server.

> Docker was not used. Deployment is via Git — `git pull` on the server after every push to `main`.

### Steps:
- [x] 21.1 Provision Ubuntu 24.04.3 LTS server (Linode, IP: 172.104.183.180)
- [x] 21.2 Install and configure Apache 2.4.58 — `mod_rewrite` enabled, virtual host configured
- [x] 21.3 Install PHP 8.4.19 via ondrej/php PPA — all Laravel extensions (mysql, mbstring, xml, curl, zip, bcmath, intl, gd, redis, fpm)
- [x] 21.4 Install MySQL 8.0.45 — `dems_production` database created, root password set
- [x] 21.5 Install phpMyAdmin 5.2.1 — accessible at `/phpmyadmin`
- [x] 21.6 Install Node.js 22.22.2 LTS via NodeSource PPA + npm 10.9.7
- [x] 21.7 Install Composer 2.9.5 at `/usr/local/bin/composer`
- [x] 21.8 Install Git 2.43.0; clone repo to `/var/www/dems`; fix safe.directory
- [x] 21.9 Configure production `.env` — `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=http://172.104.183.180`, file-based cache/session/queue, Gmail SMTP
- [x] 21.10 Run `composer install --no-dev --optimize-autoloader`
- [x] 21.11 Run `php artisan key:generate`, `migrate --force`, `db:seed --force`, `storage:link`
- [x] 21.12 Run `php artisan config:cache && route:cache && view:cache`
- [x] 21.13 Build frontend — `npm install && npm run build` → `/var/www/dems/frontend/dist`; fixed `VITE_API_BASE_URL` in `.env.production` (base domain only, no `/api/v1` suffix)
- [x] 21.14 Configure Apache virtual host (`/etc/apache2/sites-available/dems.conf`) — `DocumentRoot` → `frontend/dist`, `FallbackResource /index.html` for SPA, `RewriteRule /api/*` → Laravel backend
- [x] 21.15 Set file permissions — `storage/` + `bootstrap/cache/` → `www-data:www-data 775`
- [x] 21.16 Install Supervisor 4.2.5 — 2 queue worker processes (`dems-worker_00`, `dems-worker_01`) running `queue:work --queue=emails,heavy,elections`; config at `/etc/supervisor/conf.d/dems-worker.conf`
- [x] 21.17 Configure cron scheduler — `/etc/cron.d/dems-scheduler` runs `php artisan schedule:run` every minute as `www-data`
- [x] 21.18 Configure Gmail SMTP — `smtp.gmail.com:465 SSL`, from `laureal.seu@gmail.com`; tested with live send
- [x] 21.19 Create `doc/server_config.md` — tracks all server software versions, config paths, credentials, deployment steps, and change log

**Deploy workflow (ongoing)**:
```bash
# Local — after making changes:
git add <files> && git commit -m "..." && git push origin main

# Server — to apply changes:
cd /var/www/dems && git pull origin main
cd frontend && npm run build          # only if frontend changed
cd ../backend && php artisan view:clear
supervisorctl restart dems-worker:*   # only if backend jobs/services changed
```

**Production URLs**:
| URL | Purpose |
|-----|---------|
| `http://172.104.183.180/` | Frontend (React SPA from `dist/`) |
| `http://172.104.183.180/api/v1/` | Backend API (Laravel) |
| `http://172.104.183.180/phpmyadmin` | phpMyAdmin |

**Deliverables**: Live server fully configured, app deployed, queue workers running, scheduler active, Gmail SMTP working, server config tracked in `doc/server_config.md`

---

## Change Log

| Date | Phase | Change Description |
|------|-------|--------------------|
| 2026-03-29 | All | Initial work plan created from requirements.md analysis |
| 2026-03-29 | Phase 1 | Architecture, folder structure, env vars, Redis plan, auth flow — all defined |
| 2026-03-29 | All | Full detail added to every sub-phase across all 21 phases |
| 2026-03-29 | Phase 2 | Database schema fully designed — 9 tables, ERD, constraints, indexes |
| 2026-03-29 | Phase 3 | Laravel 12 scaffolded; Sanctum, Spatie, Excel, DomPDF installed; TenantScope, TenantModel, ApiController, routes/api.php, scheduler created |
| 2026-03-30 | Phase 4 | Auth system complete — User model, migrations, seeders, LoginController, LogoutController, MeController, ForgotPasswordController, ResetPasswordController, SetupPasswordController, PasswordResetService, mail job + template. Fixed: InnoDB engine, predis client, local dev drivers |
| 2026-03-30 | Phase 5 | Organization module complete — migration, Organization model, OrganizationController (registration + verify + profile), Admin\OrganizationController (CRUD + toggle), Form Requests, verification mail + job |
| 2026-03-30 | Phase 6 | Election module complete — elections migration, Election model (TenantModel, status helpers, votingStartsAt/votingEndsAt), ElectionPolicy, CreateElectionRequest + UpdateElectionRequest (24h validation), ElectionController (CRUD + status transitions + duplicate), StartElectionJob + StopElectionJob, ElectionObserver (auto-dispatches delayed jobs on schedule), registered observer in AppServiceProvider |
| 2026-03-30 | Phase 7 | Voter module complete — voters migration, Voter model, VoterPolicy, StoreVoterRequest, VoterController (index + store + destroy + resendInvitation + import), SendVoterInvitationJob, VoterInvitationMail + blade template, VotersImport (row-level validation + error collection) |
| 2026-03-30 | Phase 8 | Post & Candidate module complete — posts + candidates migrations, Post + Candidate models (TenantModel), PostPolicy + CandidatePolicy, PostController (CRUD + candidate count), CandidateController (open/selected mode, voter enrollment check, allow_multi_post enforcement) |
| 2026-03-30 | Phase 9 | Voting engine complete — votes + audit_logs migrations, Vote + AuditLog models (append-only, no updated_at), VoteCast event, LogVoteCast listener, VotingService (lockForUpdate, HMAC hash, atomic transaction), CastVoteRequest (ballot validation), VoteController (store + status), throttle:10,1 on vote route, vote_hash_salt in config |
| 2026-03-30 | Phase 10 | Results module complete — ResultService (aggregation, winner logic, turnout, chart data), ElectionCompleted event, PublishElectionResults listener (auto-publish on completion), ResultsExport (multi-sheet Excel), PDF blade template, ResultController (show + PDF + Excel export), access control by role |
| 2026-03-30 | Phase 11 | Frontend scaffolded — Vite React, Tailwind v3 + ShadCN color system, core UI components (Button/Input/Label/Card/Badge/Alert), Axios client (token interceptor + 401 handler), React Query, Zustand authStore, React Router v6 full route tree, AuthGuard + RoleGuard, .env, build passes |
| 2026-03-30 | Phase 12 | Auth pages + layouts complete — Login (role-based redirect), ForgotPassword, shared PasswordForm (SetupPassword + ResetPassword), Sidebar component, SuperAdminLayout + OrgAdminLayout (sidebar), VoterLayout (top nav), build passes |
| 2026-03-30 | Phase 13 | Org & Election UI complete — RegisterOrganization, admin Organizations list (toggle status), ElectionList (filters + actions), ElectionForm (create/edit, 24h client validation), ElectionDetail (tabbed, status transitions, duplicate/delete), build passes |
| 2026-03-30 | Phase 14 | Voter & Candidate UI complete — VotersTab (table + AddVoterModal + Excel import with error table + resend/remove), PostsTab (PostCard + PostModal + CandidatesPanel with searchable voter dropdown for selected mode + open mode message), build passes |
| 2026-03-30 | Phase 15 | Voting interface complete — backend: ElectionController.index filters by voter enrollment for voter/candidate role; frontend: votes.js API client, CountdownTimer component, VoterDashboard (grouped active/upcoming/past with countdown), VotingPage (instructions → ballot → review → confirmed + already-voted state), build passes |
| 2026-03-30 | Phase 16 | Results UI complete — recharts installed; results.js API client (getResults, exportPdf, exportExcel with blob download); ResultsPage (turnout stats, winner cards, candidate table with share %, bar + pie charts per post, PDF/Excel export for admins, unpublished guard); ResultsTab in ElectionDetail links to results page; build passes |
| 2026-03-30 | Phase 17 | Email system complete — ElectionReminderMail + blade template + SendElectionReminderJob (queued, sends to non-voted voters 24h before start via scheduler); ResultsPublishedMail + blade + SendResultsPublishedMailJob (notifies org admins, triggered by PublishElectionResults listener); EmailLog model + migration (mailable, recipient, status, error, related); SendVoterInvitationJob updated (emails queue + logging); migrations applied |
| 2026-03-30 | Phase 18 | Advanced features complete — i18next EN+Bengali frontend i18n with LanguageSwitcher in all layouts; DashboardController (org admin: stats+participation+status charts; super admin: platform stats+monthly elections+orgs-by-type+audit log); VoterController.copyFrom (copies enrolled voters, skips dupes, sends invitations); VotersTab Copy from Election modal; OrgDashboard + AdminDashboard pages with recharts; dashboard routes added to all layouts; Login+RoleGuard redirect to /dashboard; build passes |
| 2026-03-30 | Phase 20 | Testing complete — 59 backend tests (PHPUnit/SQLite in-memory) + 4 frontend tests (Vitest/jsdom). Backend: LoginTest (6), SetupPasswordTest (5), CastVoteTest (5), DoubleVoteTest (3), TenantIsolationTest (5), ElectionStatusTransitionTest (9), ElectionImmutabilityTest (9), VoterImportTest (5), ResultServiceTest (5), VoteHashTest (5). Frontend: BallotScreen test (4). Production bugs fixed: ApiController missing AuthorizesRequests trait; PasswordResetService Carbon 3 signed diffInMinutes |
| 2026-03-30 | Phase 19 | Security hardening complete — throttle:5,1 on login; throttle:10,1 on password endpoints; throttle:60,1 on all authenticated routes; SecurityHeaders middleware (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, skips binary exports); Vote model immutability guards (updating/deleting hooks throw); all endpoints verified: auth:sanctum + policy on every action; TenantScope org isolation confirmed; no raw input interpolation in queries; bug fix: PostsTab now sends user_id not voter.id to CandidateController |
| 2026-04-01 | All | Permission-based access control overhaul — Backend: MeController returns roles[]+permissions[], all Policies use permission checks with super_admin bypass, UserController supports multi-role sync; Frontend: authStore stores roles[]/permissions[] with hasRole/hasPermission selectors, RoleGuard/useBasePath handle roles array, RolesPage StaffTab updated from single-role dropdown to multi-role checkboxes, adminUsers.js/roles.js API fixed to send {roles:[]} array, VotersTab/PostsTab guarded with permission checks (manage-voters, delete-voters, manage-posts, manage-candidates) |
| 2026-04-01 | Frontend | Full responsive design overhaul — Sidebar: mobile hamburger drawer + desktop fixed sidebar; Layouts: pt-14 lg:pt-0 for mobile top bar; All page containers: p-4 sm:p-6 lg:p-8 w-full (removed fixed max-w constraints); All tables: overflow-x-auto + min-w for horizontal scroll on mobile; All grids (turnout stats, form fields): grid-cols-1 sm:grid-cols-N; All modals: p-4 padding on overlay, mx-4 sm:mx-auto margins; VotingPage/CandidateResults/ResultsPage: w-full max-w-lg with px-4 sm:px-0 padding; VoterDashboard cards: flex-col sm:flex-row; RegisterOrganization form grids: sm:grid-cols-2; ElectionForm time inputs: sm:grid-cols-2; PublicElectionResultPage turnout grid: sm:grid-cols-3 |
| 2026-04-01 | All | Moderator Reset Password feature — Backend: ModeratorResetPasswordController with 4 endpoints (elections list, voter list with search, voter update, generate-reset-link); routes gated by `permission:send-reset-password` (moderator + super_admin); uses existing PasswordResetService to generate 60-min token; returns frontend link (no email sent). Frontend: ResetPasswordPage with election dropdown, searchable voter dropdown, inline-edit voter info, generate-link button with beautiful modal showing copyable link; routes added for both /admin/reset-password (super_admin) and /reset-password-tool (management roles); menu items added to SuperAdminLayout + OrgAdminLayout (conditional on permission); Bengali + English i18n keys added |
| 2026-04-01 | All | Assign Moderator feature — Backend: VoterController.toggleModerator() endpoint toggles moderator role on a voter's user (POST /elections/{election}/voters/{voter}/toggle-moderator); gated by super_admin/manage-roles/election_admin; voter index query updated to eager-load user.roles. Frontend: ModeratorsTab component (search, paginated voter list with moderator badge, assign/unassign toggle button); added as conditional tab in ElectionDetail (visible to super_admin + edit-elections permission); toggleModerator API function in voters.js; Bengali + English translations for moderator_tab namespace |
| 2026-04-01 | All | Two moderator types + Candidate list panel — Backend: `moderator_election` pivot table (migration + User.assignedElections() belongsToMany) for normal-moderator election assignment; AdminUserController.assignedElections/syncAssignedElections endpoints with routes; ModeratorResetPasswordController.elections() merges voter-enrolled + pivot-assigned elections; access checks in voters/updateVoter/generateResetLink now use OR logic (voter enrollment OR pivot assignment). Frontend: adminUsers.js getAssignedElections+syncAssignedElections API; UsersPage AssignElectionsModal (inline expandable row with checkbox list for moderator users); ResetPasswordPage auto-selects election when only 1 (voter-moderator case). VotingPage: CandidateListPanel component showing all candidates grouped by post with selection highlighting; desktop sticky sidebar (w-72/w-80), mobile slide-in drawer with FAB toggle; Bengali + English translations added |
| 2026-04-04 | All | Live Election Status on Landing Page — Backend: `is_live_display` column on elections table, `system_settings` key-value table (live_refresh_interval default 30s), SystemSetting model (getValue/setValue), PublicLiveElectionController (public endpoint returns live election stats + refresh interval), Admin\LiveElectionController (list active/scheduled elections, toggle live display, update refresh interval); routes: GET public/live-elections, GET/PATCH/PUT admin endpoints. Frontend: LiveElectionsPage (admin panel to toggle live display per election + configure refresh interval), LiveElectionStatus component on landing page (auto-refreshing with countdown timer, circular progress, gradient progress bar, animated LIVE badges, Bengali number formatting), SuperAdminLayout sidebar link added |
| 2026-04-06 | Phase 17 | n8n email dispatch integration — `email_outbox` table + EmailOutbox model added to store full rendered email body before sending; SendVoterInvitationJob saves to outbox before dispatching; n8n webhook dispatch button added to VotersTab so emails can be re-sent via n8n pipeline |
| 2026-04-08 | Phase 21 | Server provisioned — Ubuntu 24.04.3 LTS on Linode (172.104.183.180); Apache 2.4.58, PHP 8.4.19, MySQL 8.0.45, phpMyAdmin 5.2.1, Node.js 22.22.2, Composer 2.9.5, Git 2.43.0 installed and configured |
| 2026-04-08 | Phase 21 | DEMS deployed to production — repo cloned to `/var/www/dems`; production `.env` configured; migrations + seeds run; frontend built to `dist/`; Apache virtual host live; file permissions set |
| 2026-04-08 | Phase 21 | Queue workers configured — Supervisor 4.2.5 running 2 worker processes (`dems-worker_00/01`) on `emails,heavy,elections` queues; config at `/etc/supervisor/conf.d/dems-worker.conf` |
| 2026-04-08 | Phase 21 | Cron scheduler configured — `/etc/cron.d/dems-scheduler` runs `php artisan schedule:run` every minute as `www-data`; log at `/var/log/dems-scheduler.log` |
| 2026-04-09 | Phase 21 | Gmail SMTP configured on production server — `smtp.gmail.com:465 SSL` from `laureal.seu@gmail.com`; tested with live send |
| 2026-04-09 | Phase 17 | All 5 email templates converted to formal Bengali — voter-invitation, password-reset (setup + reset types), organization-verification, results-published, election-reminder; all Mailable subjects updated to Bengali; voter setup token expiry extended from 60 min to 24 hours |
| 2026-04-09 | Phase 21 | Production bug fix — frontend `VITE_API_BASE_URL` in `.env.production` had `/api/v1` suffix causing doubled path `/api/v1/api/v1`; fixed to base domain only; frontend rebuilt and redeployed |
| 2026-04-09 | Phase 4 | RolesAndPermissionsSeeder expanded — `org_admin` and `org_user` now have full CRUD permissions (create/edit/delete-elections, manage-voters, delete-voters, manage-candidates, manage-posts); `org_admin` also gets `send-reset-password` |
| 2026-04-09 | Phase 6 | Super admin election creation fix — TenantModel creating hook skips auto-assign for super_admin; ElectionController::store() accepts `organization_id` from request when super admin; PostController::store() uses `$election->organization_id` instead of user org; CreateElectionRequest validates `organization_id` as required for super_admin; ElectionForm.jsx shows Organization dropdown for super admin on create |
| 2026-04-09 | Phase 21 | `doc/server_config.md` created — tracks server software versions, config file paths, deployment checklist, application URLs, production .env key settings, and full change log |
