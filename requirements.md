
# 🚀 Project: Multi-Tenant SaaS Election Management System (EMS)
## 📌 Overview
You are an expert Software Architect, expert UI/UX Designer, expert Senior Laravel Developer, and React Engineer. Build a **modern, scalable, secure, and high-performance SaaS-based Election Management System (EMS)**.
This platform will allow **organizations (government offices, companies, associations, cooperatives, etc.)** to conduct **fully digital, isolated, and secure elections/voting processes**.
Each organization can create and manage **multiple independent elections**, and each election must be **fully isolated** from others (multi-tenant architecture).

---

## 🎯 Core Objectives
* Multi-tenant SaaS system
* Fully isolated elections per organization
* Secure, tamper-proof voting
* High scalability (thousands to millions of voters)
* Real-time analytics & results
* Modern UX/UI
* API-first architecture

---

## 🏗️ Tech Stack Requirements
### Backend:
* Laravel 12 (latest)
* Laravel Sanctum (API authentication)
* Spatie Laravel Permission (roles & permissions)
* Queue system (Redis)
* MySQL
* Event-driven architecture

### Frontend:
* React (latest version)
* State management: Zustand / Redux Toolkit
* UI Framework: Tailwind CSS + ShadCN UI
* Axios / React Query for API handling

---

## 🧩 Architecture Requirements
### Multi-Tenancy Model
* Tenant = Organization
* Strict data isolation between tenants
* Suggested:
  * Shared DB + Tenant ID (with global scopes)

---

## 👥 User Roles
### 1. Super Admin (Platform Owner)
* Manage all organizations
* Monitor elections
* Control system-wide settings

### 2. Organization Admin
* Manage organization profile
* Create/manage elections
* Manage voters, candidates, posts
* Configure voting rules
* View reports & analytics

### 3. Voter
* Participate in elections
* Vote once per election
* View own voting status

### 4. Candidate (extends Voter)
* Participate in elections
* View candidacy status and results

---

## 🏢 Organization Module
* Registration with:
  * Name
  * Type (Govt / Private / Association / Cooperative)
  * Email
  * Phone
  * Address
* Email verification
* Subscription (SaaS-ready, optional for future)

---

## 🗳️ Election Module
### Create Election
* Name
* Description
* Election Date
* Voting Time (default: 09:00 AM – 04:00 PM GMT+6)
* Configurable (must be ≥ 24 hours from creation)

### Rules:
* Election is **immutable after completion**
* Only results/report visible post-election

---

## 👤 Voter Management
* Add voters via:
  * Excel import
  * Manual form

### Required Fields:
* Name
* Email (unique)
* Mobile
* Organization/Office Name
* Designation

### Features:
* Bulk import with validation
* Send password reset email
* First login requires password setup

---

## 🧑‍💼 Candidate Management
### Modes:
1. **Selected Candidates**
   * Admin selects from voter list
2. **Open Candidates**
   * All voters appear as selectable candidates (searchable dropdown)

---

## 🏷️ Post/Position Management
Examples:
* President
* General Secretary
* Treasurer
* Executive Members

### Features:
* Each post can have:
  * Single winner OR
  * Multiple winners (configurable how many)
* Candidate assignment per post (if no one assigned, all voter consider as candidate)
* Candidate can run for multiple posts (configurable)

---

## ⏰ Voting Schedule
* Editable anytime (minimum 24h constraint)(timezone should be in bangladesh local time. may be gmt+6)
* Auto start/stop voting
* Countdown timer before election

---

## 🔐 Authentication Flow
* Email-based login
* Password reset via email

---

## 🗳️ Voting Flow
### Pre-Voting:
* Dashboard shows:
  * Upcoming elections
  * Countdown timer

### During Voting:
* "Start Voting" button visible
* Instruction page
* Voting interface:
  * List of posts
  * Searchable dropdown for candidates
* Submit vote:
  * One-time submission only
  * Lock after submission

### Post-Voting:
* Status: "Vote Completed"

---

## 📊 Result & Analytics Module
### After Election Ends:
* Auto-publish results

### Features:
* Winner per post
* Vote counts
* Charts:
  * Bar chart
  * Pie chart
* Comparative analysis
* Export:
  * PDF
  * Excel

---

## 🔒 Security Requirements
* Prevent double voting
* Encrypted vote storage
* Audit logs for all actions
* CSRF/XSS protection
* Rate limiting
* IP/device tracking (optional)
* Tamper-proof voting mechanism

---

## ⚡ Performance Requirements
* Handle large-scale voters (100K+)
* Optimized DB queries
* Caching (Redis)
* Queue-based heavy tasks

---

## 🔌 API Requirements
* RESTful API
* Versioned (v1, v2)
* Token-based authentication (Sanctum)
* Proper error handling
* Rate limiting

---

## 🎨 UI/UX Requirements
* Clean, modern dashboard
* Mobile responsive
* Accessibility friendly
* Real-time feedback
* Smooth animations

---

## 📦 Additional Features (Advanced)
* Multi-language support (English + Bangla)
* Notification system (Email)
* Role-based dashboards
* Election duplication feature
* Partial voter reuse across elections

---

## 📁 Deliverables Required from Claude
Generate the following step-by-step:
1. System Architecture Diagram
2. Database Schema (ERD + tables)
3. Backend Folder Structure (Laravel)
4. Frontend Architecture (React)
5. API Specification (Endpoints)
6. Authentication Flow
7. Voting Algorithm (secure logic)
8. Multi-tenancy Implementation Strategy
9. Security Implementation Plan
10. Sample UI Screens (React components)
11. Deployment Guide (Cloud)

---

## ⚠️ Important Constraints
* Each election must be **fully isolated**
* No cross-organization data leakage
* Election data becomes **read-only after completion**
* A voter can vote **only once per election**
* System must be **extensible and scalable**

---

## 🎯 Goal

Build a **production-ready, enterprise-grade SaaS Election Management System** comparable to global digital voting platforms, optimized for **government and institutional use**.

---