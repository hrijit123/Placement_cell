# Frontend Changes — ISL Connect

This document summarizes the frontend work added on top of the existing backend (per [NEXT_STEPS.md](NEXT_STEPS.md) and [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md)). The ML/translation service was explicitly out of scope for this work, aside from making its frontend failure mode visible instead of silent.

## 1. Student Dossier Dashboard (highest priority in NEXT_STEPS.md)

**New routes:**
- `src/app/dashboard/page.tsx` — staff-only landing page where a TEACHER/ADMIN enters a student's NGO ID (e.g. `ISL-2024-001`) to open their dossier. Blocks access for any other role with a clear message.
- `src/app/dashboard/student/[studentId]/page.tsx` + `DossierView.tsx` — the dossier itself, consuming `GET /api/ngo/students/[studentId]`.

**Behavior:**
- Renders personal details, disability/accommodation notes, education/skills/certifications, job preferences, every job application (with outcome/salary/rejection reason), full career/placement history, and attendance.
- **Redaction UI**: when the API returns `"[REDACTED]"` (which it does for TEACHER viewers on `disabilityInfo`, `expectedSalary`, `offeredSalary`, `rejectionReason`), the field renders as a locked "🔒 Redacted" badge instead of the raw string. A banner also flags the whole page as a "Teacher view — sensitive fields redacted."
- **Error states**: distinct, human-readable screens for 401 (sign in required), 403 (student not in your cohort), 404 (student not found), 429 (rate limit hit, with a retry button), and network failures — instead of a blank page or raw JSON.
- **Pagination**: a "View Full History" toggle refetches with `?full=true` to get the complete attendance/career history (the API caps default results at 5 records each).

**Navbar:** added a "Student Dossiers" link for TEACHER and ADMIN roles (previously TEACHER had no navigation entries at all).

## 2. Admin Metrics Dashboard (`src/app/admin/page.tsx`)

**Auth guard added** — the admin page previously had *no* server-side access check (the check was commented out in the source). It now re-verifies the session against the database (role === ADMIN and status === ACTIVE) and redirects everyone else to `/`.

**New KPI cards:** Placement Rate, Currently Employed, Average Placement Salary (in addition to the existing Total Students / Recruiters / Jobs / Applications cards).

**New charts** (`src/app/admin/ChartsSection.tsx`, using Recharts):
- **Application Pipeline** — bar chart of applications by status, in lifecycle order (Applied → Interview → Offer → Accepted/Rejected)
- **Top Employers** — horizontal bar chart of placement counts by company
- **Attendance Ratio** — donut chart (Present / Late / Absent)
- **Application Volume** — line chart of applications submitted per month, last 6 months

All aggregation is done server-side with Prisma `groupBy`/`aggregate` calls; charts show a "No data recorded yet" empty state rather than breaking on empty datasets.

## 3. Interview Room — visible failure state

`src/app/interview/page.tsx`: previously a failed WebSocket auth (e.g., ML service offline, or user not signed in as STUDENT/RECRUITER) only logged to the browser console — the user saw no indication anything was wrong. Now:
- A `translationStatus` state (`connecting` / `connected` / `unavailable`) tracks the real connection state.
- The pre-join screen shows an explicit warning banner when translation is unavailable.
- The in-call captions area shows "⚠ Translation service offline — captions disabled" instead of silently showing nothing.

## 4. Bug fixes found while testing end-to-end

- **`getServerSession()` called without `authOptions`** in six API routes — this meant NextAuth couldn't read the session/JWT correctly, silently causing every request to look unauthenticated (401/403) even for legitimately signed-in users. Fixed in:
  - `src/app/api/ws-auth/route.ts`
  - `src/app/api/admin/export/route.ts`
  - `src/app/api/user/role/route.ts`
  - `src/app/api/jobs/route.ts`
  - `src/app/api/admin/users/route.ts`
  - `src/app/api/admin/users/[id]/status/route.ts`
- **Supabase pooler timeouts** (`EAUTHTIMEOUT`/`ETIMEDOUT`) intermittently crashing pages that hit the database — added an explicit 30s `connectionTimeoutMillis` and `keepAlive` to the shared Prisma connection pool in `src/lib/prisma.ts`. Also removed verbose `log: ['query']` from the production branch (was logging every SQL statement, a noise/PII concern in prod).
- **Next.js 16 dynamic route params**: `params` is now a `Promise` in route handlers; updated the dossier and admin user-status routes to `await params` instead of destructuring it synchronously.

## 5. Supporting files (not shipped to production)

- `web-portal/prisma/seed.mjs` — a local dev seed script that populates the Supabase DB with demo data (3 students, 2 cohorts, 2 teachers, 1 admin, 1 recruiter, 3 jobs, sample applications/attendance/career history) so the dossier and admin pages can be tested with realistic data. Run with `node --env-file=.env prisma/seed.mjs` from `web-portal/`. Safe to re-run (upserts).

## What was verified

All of the above was tested against a live (seeded) Supabase database, not just compiled:
- Dossier API: 200 for valid admin/teacher lookups, 403 for a teacher viewing a student outside their cohort, 400 for malformed student IDs, 404 for unknown IDs, correct `[REDACTED]` values for teacher-scoped fields.
- Admin dashboard: 307 redirect when signed out, 200 with all charts/cards populated when signed in as ADMIN.
- `?full=true` returns the complete attendance/career history (10 records) vs. the default-capped 5.

## Explicitly not addressed here

- Cohort management UI (creating cohorts / assigning students & teachers — currently DB-only).
- A dedicated teacher-only dashboard (teachers currently share the same `/dashboard` search entry point as admins).
- Formal accessibility audit (contrast, keyboard navigation, screen-reader labeling).
- Global error boundaries (`error.tsx`, `not-found.tsx`) at the app root.
- The ML/translation backend itself (`ml-service/`) — out of scope per project instructions.
