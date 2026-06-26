# ISL Connect — Technical & Security Audit Report

**Audit type:** Pre-production readiness review
**Scope:** Full-stack (Next.js web portal, FastAPI ML service, PostgreSQL/Prisma, NextAuth, WebSocket translation pipeline, Admin layer)
**Status at time of audit:** Pre-deployment, local-only, admin layer newly added, core auth/navigation functional

---

## 1. Executive Summary

ISL Connect is a two-sided marketplace with a real-time ISL translation feature — a genuinely ambitious product combining auth, RBAC, a job marketplace, video/WebSocket streaming, and ML inference. The architecture choices (Next.js App Router, Prisma + Supabase, FastAPI for ML) are reasonable and modern. However, the project is **not production-ready** in its current state. The issues below range from "will break under any real load" to "actively exploitable security holes."

**Overall risk rating: HIGH** — primarily due to:
- No rate limiting anywhere (auth, job posting, WebSocket, admin actions)
- Client-trusted role data in at least one prior flow
- ML service has no authentication, no input validation, and is wide open to abuse
- No deployment target supports persistent WebSockets out of the box (architectural blocker)
- No automated tests of any kind
- No environment separation (dev/staging/prod) or secrets hygiene plan

None of this is unusual for a project at this stage — but all of it needs to be addressed before this goes live with real user data (especially since DHH candidates' video/biometric-adjacent hand-tracking data and recruiter PII are both in scope, which raises the privacy bar further).

---

## 2. Architecture Review

### 2.1 Two-service split (Next.js + FastAPI)
**Finding:** Reasonable separation of concerns, but introduces a distributed system with no defined contract between services.

- There is no shared schema/contract (OpenAPI spec, shared types) between the Next.js frontend and the FastAPI ML service. Coordinate payload shape, model output shape, and error formats are implicit and undocumented in code.
- No service-to-service authentication. The WebSocket endpoint `ws://localhost:8000/ws/translate` accepts connections from anyone who can reach it — there is no token, no origin check, no session validation tying a WebSocket connection to a logged-in `Interview` record.

**Required changes:**
- Define a versioned contract (`/docs` OpenAPI auto-gen from FastAPI is enough as a v1 — formalize it).
- WebSocket handshake must validate a short-lived signed token (issued by Next.js after verifying the user is the legitimate participant of that specific `Interview`), not just accept any connection.
- Add `Origin` header validation on the WebSocket upgrade to prevent arbitrary websites from connecting to your inference server (cross-site WebSocket hijacking).

### 2.2 Deployment topology — architectural blocker
**Finding:** The plan as described ("deploy as an actual website") has not accounted for the fact that **Vercel's serverless functions do not support long-lived WebSocket connections.** Next.js API routes deployed to Vercel will not work for the FastAPI WebSocket service, and even a Next.js-native WS implementation would face the same limit.

**Required changes:**
- Next.js → Vercel (fine, it's stateless HTTP/SSR).
- FastAPI ML service → must go on a host with persistent connection support: Railway, Render (Web Service, not serverless), Fly.io, or a small VPS (DigitalOcean/Hetzner) running Uvicorn behind Nginx with WSS.
- Decide and document **CORS + WSS origin allowlist** between the two deployed domains now, not after deployment — this is a common last-mile bug.
- TLS termination: the WebSocket must be `wss://` in production, not `ws://`. Mixed content (HTTPS page → insecure WS) will be blocked by browsers outright.

### 2.3 Database & ORM
**Finding:** Prisma 7 + `@prisma/adapter-pg` + Supabase is a sound choice. But:

- No connection pooling configuration is mentioned. Supabase + serverless Next.js (Vercel) without PgBouncer/connection pooling will exhaust Postgres connections under even moderate concurrent load. This is one of the most common production outages for this exact stack.
- No migration strategy described for production (i.e., `prisma migrate deploy` as a CI/CD step vs. `migrate dev` — these must never be the same command in prod).
- No backup/restore policy documented.

**Required changes:**
- Use Supabase's pooled connection string (port 6543, pgbouncer mode) for the app's runtime `DATABASE_URL`, and the direct connection (port 5432) only for migrations (`DIRECT_URL` in Prisma schema's `datasource` block).
- Add `migrate deploy` to your CI/CD pipeline, gated behind manual approval for first launches.
- Enable Supabase's automatic daily backups (or equivalent) and document the restore procedure — even a one-paragraph runbook is better than nothing.

---

## 3. Security Audit

### 3.1 Authentication & Session Management
| Issue | Severity | Detail |
|---|---|---|
| Role checks previously relied on session token only | **High** | Session-stored role can go stale or be manipulated if signing keys are weak. Fixed in the admin guard I added (`requireAdmin()` re-reads from DB) — **but this pattern needs to be applied consistently to every privileged route**, including job-posting (`RECRUITER`-only) and application endpoints (`CANDIDATE`-only). Audit every API route for this. |
| No session expiry / rotation policy stated | Medium | Define `maxAge`/`updateAge` in NextAuth config explicitly. Don't rely on defaults without knowing what they are. |
| No account lockout / suspicious login detection | Low-Medium | Not critical for OAuth-only login (Google handles brute force), but if you ever add credentials-based login, this becomes mandatory. |
| `onboarding` role-selection flow — is it idempotent and guarded against replay? | Medium | A user who has already chosen a role should not be able to re-POST to the onboarding endpoint and silently switch from `CANDIDATE` to `RECRUITER` (or worse, attempt `ADMIN`). Confirm server-side that this endpoint **rejects** role reassignment after first set, and **never** accepts `ADMIN` as a client-submitted value under any circumstance. |

### 3.2 API Route Security
**Finding:** No evidence of consistent input validation, rate limiting, or authorization checks across the existing API surface (`/api/jobs`, `/api/applications`, etc. — these existed before this audit's scope but must be reviewed under the same standard as the new admin routes).

**Required changes (apply to every route):**
- **Input validation** with `zod` on every POST/PATCH/PUT body. No raw `req.json()` consumption without a schema — this is your primary defense against malformed data and basic injection-adjacent bugs.
- **Authorization, not just authentication**: e.g. `/api/jobs/[id]` (edit/delete) must verify the requesting user is the job's owning recruiter (or admin) — not just "logged in as any recruiter." This is an IDOR (Insecure Direct Object Reference) risk if not checked. Audit this specifically: can Recruiter A edit/delete Recruiter B's job posting by guessing/iterating an ID?
- **Rate limiting**: none exists anywhere. At minimum, rate-limit:
  - Login/auth endpoints
  - Job posting (prevent spam postings)
  - Application submission (prevent application-flooding a job)
  - Admin action endpoints (prevent a compromised admin session from mass-banning users in a script)
  - Use Upstash Redis + `@upstash/ratelimit` (works well with Vercel) or a simple in-memory limiter if self-hosting the Next.js app on a long-running server.

### 3.3 WebSocket / ML Service Security
This is the **highest-risk component** in the whole system.

| Issue | Severity | Detail |
|---|---|---|
| No authentication on WebSocket connection | **Critical** | Anyone with the URL can connect and send arbitrary coordinate data to your model, consuming compute for free, with no attribution. |
| No input validation on incoming coordinate payloads | **High** | If the model/feature-extraction code assumes a fixed shape/range for `(x,y,z)` arrays and receives malformed, oversized, or adversarial input, this can crash the service or be used for resource-exhaustion (DoS). Validate array length, type, and numeric bounds before feeding to the model. |
| No rate limiting on WebSocket messages | High | A malicious or buggy client streaming at high frequency can pin CPU on your inference server. Throttle inbound message rate per connection. |
| No TLS in current local setup, and no plan stated for production WSS | High (becomes blocker in prod) | See §2.2. |
| Model file (`ready_model_nn.h5`) handling | Medium | Confirm it's not committed to a public repo if the repo is public (model files can be large and are usually irrelevant to git history — use Git LFS or external storage, e.g., S3, loaded at container start). |
| No logging/monitoring of inference errors or anomalous input patterns | Medium | Add structured logging (at minimum) so you can detect abuse or model drift post-launch. |

**Required changes:**
- Issue a short-lived JWT (signed by NextAuth's secret, or a separate service secret) when a candidate/recruiter enters `/interview`, and require it as a query param or first message on WebSocket connect. FastAPI validates signature + expiry + that the `Interview` record is `SCHEDULED`/`IN_PROGRESS` and the connecting user is a legitimate participant.
- Validate every incoming payload with Pydantic models in FastAPI (you're already using FastAPI — this is nearly free to add and you should not be parsing raw JSON manually).
- Add a per-connection token bucket rate limiter (a simple in-memory dict keyed by connection ID is enough at this scale).

### 3.4 Secrets & Environment Hygiene
**Finding:** `.env` is mentioned as containing DB strings and OAuth secrets — standard, but no mention of secret rotation, `.gitignore` confirmation, or separation between dev/prod secrets.

**Required changes:**
- Confirm `.env*` is in `.gitignore` (check this literally — it is the single most common real-world leak vector for student/early-stage projects).
- Use separate Google OAuth client IDs for local dev vs. production (different authorized redirect URIs) — don't reuse one OAuth app across environments.
- Store production secrets in Vercel's/Railway's encrypted environment variable stores, never in a committed file, never in chat/Slack history.
- Rotate the Google OAuth client secret and any DB password that has ever been pasted into an AI chat, doc, or shared screen (good practice to do once before going live regardless).

### 3.5 Data Privacy Considerations (DHH-specific)
This product processes hand-tracking geometry from a vulnerable, identifiable user population for an accessibility purpose — there's a meaningfully higher duty of care here than a generic job board.

**Required additions:**
- Explicit data retention policy: are raw hand-landmark coordinates stored anywhere, even transiently, beyond the WebSocket round-trip? If not stored, **say so in your privacy policy and confirm it in code** (no accidental logging of full coordinate streams).
- Video itself: if interviews are recorded, that's biometric-adjacent data under many privacy frameworks (GDPR Art. 9 territory if any EU users, India's DPDP Act domestically). At minimum: explicit consent screen before recording, clear retention period, deletion mechanism.
- A basic Privacy Policy and Terms of Service page — currently absent — is both a legal requirement in most jurisdictions for a platform handling PII and a trust signal for an accessibility-focused product.

### 3.6 Admin Layer (newly added — self-audit)
The admin dashboard built in this session is a good start but has gaps to close before being "industry standard":

| Gap | Fix |
|---|---|
| No audit log on *read* access to sensitive data (only actions are logged) | Acceptable for now — full read-auditing is usually overkill at this scale — but note it as a deliberate scope decision, not an oversight. |
| `BAN`/`SUSPEND` have no automated session invalidation | A banned user's existing session/JWT may remain valid until natural expiry. Add a check in `requireAdmin`-style middleware (and ideally a lightweight check on *every* authenticated route) that rejects requests if `user.status !== ACTIVE`. |
| No pagination UI for audit logs beyond API support | Add "Load more" / page controls in `AuditLogFeed.tsx` — the API already supports `page`. |
| No CSV/export function for admin stats | Add as a "nice to have" — investors/internal reporting will want this. |
| No confirmation modal component (uses raw `confirm()`) | Replace with a proper accessible modal — `confirm()` is blocking, ugly, and inconsistent across browsers; also genuinely bad UX for an accessibility-focused product to have *any* inaccessible UI pattern. |
| First-admin bootstrap has no UI path | Documented as a manual SQL step — acceptable for launch, but write this down in a `DEPLOYMENT.md` runbook so it isn't forgotten or done insecurely under pressure later. |

---

## 4. Code Quality & Robustness

### 4.1 Error Handling
**Finding:** No global error boundary strategy described for the Next.js app, and FastAPI error handling for malformed input/model failures is unspecified.

**Required additions:**
- Next.js `error.tsx` and `not-found.tsx` files at the app root and for key segments (`/jobs`, `/interview`, `/admin`).
- A global API error response shape: `{ error: string, code?: string }` consistently across every route — right now error shapes are ad hoc per route, which makes frontend error handling brittle.
- FastAPI: wrap model inference in try/except, return a structured error (`422` for bad input, `500` with a generic message for model failures — never leak stack traces to the client in production, `app.debug = False`).

### 4.2 WebSocket Reconnection
**Finding:** Not addressed anywhere in the current design. Real-world Wi-Fi/network drops during an interview will silently break translation with no recovery.

**Required additions:**
- Client-side exponential backoff reconnect logic on the `/interview` page.
- Visible UI state: "Reconnecting to translation service..." rather than silently showing stale/no captions.
- Server-side: clean up stale connections (heartbeat/ping-pong) so dead sockets don't accumulate as memory/resource leaks on the FastAPI service.

### 4.3 MediaPipe Loading Strategy
**Finding:** Lazy CDN loading with a disabled "Join" button until scripts inject is a reasonable stopgap, but fragile.

**Required improvements:**
- Add a timeout + error state: if the CDN fails to load (network issue, ad-blocker, CDN outage), the button should not stay disabled forever with no explanation — show a retry option and an error message.
- Consider self-hosting MediaPipe's WASM/model assets instead of CDN dependency, for both reliability and (modest) privacy benefit — fewer third-party requests from a page handling sensitive interactions.

### 4.4 Testing — currently absent entirely
**Finding:** No unit, integration, or end-to-end tests are mentioned anywhere in the project.

**Required additions (minimum viable testing for launch):**
- **Unit tests** (Vitest/Jest): Prisma query helpers, admin action logic, zod schemas.
- **Integration tests**: at least the auth → onboarding → role-gated route flow, and the admin action → audit log write transaction.
- **E2E** (Playwright): the critical path — sign in → post a job (recruiter) → apply (candidate) → schedule interview → join interview room and confirm WebSocket connects.
- **Load test the WebSocket service** specifically (e.g., with `locust` or a simple concurrent-connection script) before launch — this is the component most likely to fall over first under real traffic and the one with zero current safety margin (no rate limit, no connection caps).

### 4.5 Accessibility (ironic miss if absent, given the product's purpose)
**Finding:** Not explicitly addressed in the handoff doc despite this being an accessibility product.

**Required additions:**
- Full keyboard navigability and screen-reader labeling across the Next.js app (the candidate-facing side especially — some DHH users may also have other accessibility needs, and even those who don't deserve a well-built product from a company whose whole premise is accessibility).
- Captions UI (the ISL→text output) needs sufficient contrast, resizable text, and should not rely on color alone for any status indication.
- Run an automated audit (axe-core / Lighthouse accessibility score) as a CI gate, not a one-time check.

---

## 5. Performance & Scalability

| Area | Finding | Required change |
|---|---|---|
| DB connection handling | No pooling config confirmed | Pooled connection string for runtime, direct for migrations (see §2.3) |
| ML inference | Single model instance, no batching/queueing mentioned | Fine at low scale; if concurrent interviews scale up, evaluate moving inference to a queue + worker pool rather than per-connection synchronous inference inside the WebSocket handler |
| Image/asset optimization | Not mentioned | Use `next/image` everywhere; confirm Tailwind purge/JIT is configured (default in modern Tailwind, but verify build output size) |
| Caching | None mentioned for job listings (a read-heavy, low-volatility resource) | Add basic caching (Next.js `revalidate` / ISR) on the public job board — no reason to hit Postgres on every page load for data that changes infrequently |

---

## 6. CI/CD & Operational Readiness

**Currently absent. Required for "industry standard":**
- GitHub Actions (or equivalent) pipeline: lint → typecheck → test → build → `prisma migrate deploy` → deploy.
- Staging environment separate from production, with its own DB and OAuth credentials, used for final QA before every prod deploy.
- Basic uptime/error monitoring: Sentry (errors, both Next.js and FastAPI), and a simple uptime check (UptimeRobot/Better Uptime) on both deployed services.
- A `DEPLOYMENT.md` and `RUNBOOK.md`: how to deploy, how to roll back, how to bootstrap the first admin, how to rotate secrets, who to contact if the ML service goes down during a live interview.

---

## 7. Prioritized Action Plan

**Before any real users touch this (Launch blockers):**
1. WebSocket authentication + origin validation (§3.3)
2. Input validation (zod/Pydantic) across all API routes and the WS payload (§3.2, §3.3)
3. Rate limiting on auth, job posting, applications, admin actions, and WS messages (§3.2, §3.3)
4. Move FastAPI service to a WebSocket-capable host; confirm WSS + CORS in production (§2.2)
5. DB connection pooling configured correctly for serverless (§2.3)
6. IDOR check on all resource-owner-scoped routes (jobs, applications, interviews) (§3.2)
7. Session invalidation on ban/suspend (§3.6)
8. Privacy policy + consent flow for video/biometric data (§3.5)

**Before being comfortable calling this "industry standard" (Should-fix soon after):**
9. Automated test suite (unit + integration + at least one E2E happy path) (§4.4)
10. WebSocket reconnection logic + visible connection state (§4.2)
11. Global error boundaries + consistent API error shape (§4.1)
12. CI/CD pipeline + staging environment (§6)
13. Monitoring/error tracking (Sentry) on both services (§6)
14. Accessibility audit pass (§4.5)

**Polish / scale-readiness (post-launch, ongoing):**
15. Admin UX refinements (modal instead of `confirm()`, audit log pagination, CSV export) (§3.6)
16. Caching on job board (§5)
17. Self-hosted MediaPipe assets (§4.3)
18. Load testing the inference path under concurrent interview load (§4.4)

---

## 8. Closing Notes

None of these findings suggest the project is poorly conceived — the architecture is sound and the feature scope is appropriately ambitious for what the product is trying to do. The gaps are exactly what you'd expect from a project that has been built feature-first (correctly, for the prototyping stage) and has not yet gone through a hardening pass. The list above **is** that hardening pass, organized by what would actually get flagged in a real pre-launch security/QA review.

Recommend treating §7's "Launch blockers" as non-negotiable before any real candidate or recruiter data enters the system, given the sensitivity of the user population this product specifically serves.
