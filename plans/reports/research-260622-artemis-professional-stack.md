# Research Report: Artemis Professional Stack

Date: 2026-06-22
Scope: Evaluate Go + SvelteKit + self-hosted Supabase for splitting Artemis into `vũ trụ đồ đạc`, `phiên chợ trên mây`, and an intro/router page.

## Executive Summary

Your preferred stack is technically sound: SvelteKit for the user-facing app, Go for explicit backend/domain logic, Supabase for Postgres/Auth/Storage. It also matches your ownership constraint because SvelteKit, Go services, Postgres, Supabase Auth, and Supabase Storage can be self-hosted.

The brutal truth: self-hosted Supabase is a product infrastructure choice, not just a database choice. You own OS updates, service config, Postgres maintenance, HA, backups, monitoring, uptime, and security hardening. If you do not want that ops load, use managed Supabase first and keep an exit path.

Recommendation: use a modular monolith first, not microservices. One SvelteKit frontend, one Go API, one Supabase stack, two product modules behind a main landing/router. Split code and DB schemas by domain now; split deployment later only if traffic/team boundaries justify it.

## Sources

- SvelteKit adapter-node: https://svelte.dev/docs/kit/adapter-node
- Supabase self-hosting: https://supabase.com/docs/guides/self-hosting
- Supabase Docker self-hosting: https://supabase.com/docs/guides/self-hosting/docker
- Supabase SSR auth: https://supabase.com/docs/guides/auth/server-side
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase self-hosted S3 storage: https://supabase.com/docs/guides/self-hosting/self-hosted-s3
- Supabase Storage self-hosting reference: https://supabase.com/docs/reference/self-hosting-storage/introduction
- Supabase Auth self-hosting config: https://supabase.com/docs/guides/self-hosting/auth/config
- Supabase custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase Database Webhooks: https://supabase.com/docs/guides/database/webhooks
- Firebase pricing: https://firebase.google.com/pricing
- Firebase pricing plans: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Firebase Firestore quotas: https://firebase.google.com/docs/firestore/quotas
- Firebase Cloud Storage start guide: https://firebase.google.com/docs/storage/web/start
- Google Identity Platform pricing: https://cloud.google.com/identity-platform/pricing

## Current Codebase Context

- Current app is a single static SPA: `index.html`, `styles.css`, `app.js`.
- Backend is Python stdlib HTTP server plus SQLite JSON payload tables in `server.py`.
- Existing product domains are mixed: lost/found radar, marketplace, notifications, admin.
- Existing docs: `docs/project-workflow-tech-stack.md`.
- No SvelteKit, Go, Supabase, tests, or plans exist yet.

## Proposed Product Split

```text
/
├─ Main intro/router page
│  ├─ explains product choices
│  ├─ routes to /vutrudodac
│  └─ routes to /phienchotrenmay
├─ /vutrudodac
│  ├─ lost item report
│  ├─ found item report
│  ├─ matching/radar
│  ├─ notifications
│  └─ /vutrudodac/admin
└─ /phienchotrenmay
   ├─ browse/search items
   ├─ create listing
   ├─ listing approval/moderation
   ├─ interest/contact flow
   └─ /phienchotrenmay/admin
```

## Recommended Architecture

```text
Browser
  |
  v
SvelteKit app
  - landing/router
  - lost-found module
  - marketplace module
  - SSR auth cookies
  |
  v
Go API
  - domain services
  - auth/session verification
  - item matching
  - moderation workflows
  - LLM provider adapter if needed
  |
  v
Self-hosted Supabase
  - Postgres
  - Auth / GoTrue
  - Storage
  - Realtime optional
  - Database webhooks optional
```

## Tech Stack Verdict

| Layer | Proposed | Verdict | Notes |
| --- | --- | --- | --- |
| Frontend | SvelteKit | Good | Use `adapter-node` for self-hosted SSR. Build creates a Node server runnable with `node build`. |
| Backend | Go | Good | Best for explicit APIs, background workers, image policies, matching logic. Avoid hiding domain rules in SvelteKit endpoints. |
| DB | Supabase Postgres | Good | Use real relational schema, migrations, indexes, RLS. Do not keep JSON blob persistence. |
| Auth | Supabase Auth | Good with work | Self-host config is env/docker-compose driven; OAuth/email config not just dashboard clicks. |
| Image storage | Supabase Storage | Good | For serious durability, configure S3-compatible backend such as RustFS/MinIO-compatible storage. |
| LLM | External API | Fine | Keep as provider adapter; do not couple product logic to one vendor. |

## Missing Production Parts

### 1. Domain Boundaries

Create explicit modules:

- `identity`: users, profiles, roles.
- `lost_found`: lost reports, found reports, matches, handoff status.
- `marketplace`: listings, listing images, approvals, interests, sold/pass state.
- `notifications`: in-app, email hooks, read state.
- `admin`: moderation, audit logs, role checks.

### 2. Database Design

Need real tables:

- `profiles`
- `lost_items`
- `found_items`
- `match_candidates`
- `match_events`
- `marketplace_listings`
- `marketplace_listing_images`
- `marketplace_interests`
- `notifications`
- `admin_actions`
- `audit_logs`

Use UUID primary keys, timestamps, owner IDs, status enums, foreign keys, indexes, and soft-delete/visibility flags where needed.

### 3. Auth And Authorization

Supabase RLS must be enabled on exposed schemas. Official docs say RLS should always be enabled for tables in exposed schemas, especially `public`.

Decision needed:

- Browser talks directly to Supabase for simple reads/writes with RLS.
- Go API owns all writes and uses service credentials.
- Hybrid: frontend uses Supabase auth/session, Go API owns domain writes, Supabase direct reads only where safe.

Recommendation: hybrid. Easier UX than pure backend auth, safer domain rules than direct browser writes.

### 4. Self-Hosting Ops

Supabase self-hosted lacks several managed-platform comforts: advanced metrics beyond logs, managed backups/PITR, branching, analytics/vector buckets, ETL, platform management API. You own:

- backups and restore drills
- Postgres upgrades
- secrets rotation
- TLS/reverse proxy
- monitoring and uptime
- service updates
- disk growth and storage lifecycle
- SMTP deliverability

### 5. Storage Plan

Do not store uploaded images as base64 in DB.

Use:

- private bucket for item/report images
- signed URLs or proxied image access
- file size limits
- MIME allowlist
- image moderation if user-submitted content becomes public
- S3-compatible backend for durability

Supabase self-hosted Storage supports S3 protocol endpoint and S3 backend separately. Default local filesystem storage is not enough for a production product unless backed by durable volumes and backups.

### 6. Email And Notification Delivery

Supabase Auth production email needs custom SMTP. Default service is for demos/testing and has tight limits/no SLA.

Need:

- SMTP provider or self-hosted mail service
- email templates
- bounce handling
- rate limits
- in-app notifications table
- optional realtime push

### 7. Observability

Need from day one:

- structured Go logs
- request IDs
- error tracking
- metrics endpoint
- uptime checks
- Postgres slow-query visibility
- backup success alerts
- storage usage alerts

Self-hosted Supabase does not include Logs & Analytics in default Docker Compose.

### 8. Testing And Migration

Current repo has no automated tests.

Need:

- Go unit tests for matching, permissions, status transitions
- API integration tests with test Postgres/Supabase
- SvelteKit component/form tests
- Playwright smoke tests for landing, lost/found, marketplace
- SQL migration tests
- seed data for local demo

### 9. Deployment Topology

Recommended self-hostable stack:

```text
reverse proxy: Caddy or Traefik
frontend: SvelteKit node server
backend: Go API
data: Supabase docker compose
object backend: Supabase Storage local durable volume or S3-compatible backend
jobs: Go worker process
monitoring: Prometheus/Grafana/Loki or equivalent
backups: pgBackRest/WAL-G or scheduled pg_dump + restore test
```

### 10. LLM Boundary

If LLM used for matching, descriptions, safety, or chat UX:

- never make LLM source of truth
- persist deterministic match scores separately
- store prompt/version/model metadata
- make provider interface replaceable
- add manual override/admin review
- do not send sensitive user data unless needed

## Architecture Options

### Option A: SvelteKit + Supabase Direct

Frontend uses Supabase JS for auth, DB, storage. Minimal Go or no Go.

Pros:
- fastest rewrite
- least backend code
- good for MVP

Cons:
- domain logic leaks into frontend/RLS
- harder to audit workflows
- Go preference mostly unused
- complex RLS required for every write path

Verdict: too thin for "senior/professional" if product grows.

### Option B: SvelteKit + Go API + Supabase

SvelteKit handles UI/SSR; Go owns domain APIs; Supabase provides auth, Postgres, storage.

Pros:
- clean ownership
- testable domain logic
- strong self-host path
- avoids premature microservices
- easier future mobile/API clients

Cons:
- more code than pure Supabase
- need JWT/session integration carefully
- duplicate auth context between frontend and API if sloppy

Verdict: recommended.

### Option C: Split Into Two Apps/Services Immediately

Separate lost-found frontend/API and marketplace frontend/API.

Pros:
- hard domain isolation
- independent deploys

Cons:
- overkill now
- shared auth/notifications/admin become awkward
- more DevOps before product is stable

Verdict: not yet.

## Recommended First Professional Version

- One repo, modular monolith.
- SvelteKit routes:
  - `/`
  - `/vutrudodac`
  - `/phienchotrenmay`
  - `/vutrudodac/admin`
  - `/phienchotrenmay/admin`
  - `/account`
- Go packages:
  - `cmd/api`
  - `cmd/worker`
  - `internal/auth`
  - `internal/lostfound`
  - `internal/marketplace`
  - `internal/notifications`
  - `internal/storage`
  - `internal/llm`
- Supabase schemas:
  - `public` for safe exposed views only, if needed
  - `app` for core domain tables
  - `audit` for immutable audit logs

## Direct Answer

Your tech stack is OK. Better than current app by a lot.

But "Go + SvelteKit + Supabase" is not enough. Missing parts are domain model, auth/RLS policy, image lifecycle, migrations, test strategy, ops/backup plan, observability, and LLM boundary.

## Hosted Supabase Free Tier Decision

For demo and MAU under 10k, hosted Supabase Free is acceptable and preferable to self-hosting first.

Current official free-plan limits checked on 2026-06-22:

- 50,000 monthly active users.
- 500 MB database size per project.
- 1 GB storage.
- 5 GB egress plus 5 GB cached egress.
- 500,000 Edge Function invocations.
- 2 million Realtime messages.
- 200 Realtime peak connections.

Key caveats:

- Free projects can be paused for low activity.
- Free does not provide the production backup posture expected for a real product.
- Image-heavy marketplace usage can hit storage/egress before MAU.
- No custom domains on Free.
- SSO is unavailable on Free.

Recommendation:

- Use hosted Supabase Free for demo/MVP.
- Keep migrations, schema, RLS, and storage layout portable.
- Budget upgrade to Pro once demo becomes user-facing production, data matters, custom domain needed, or images/egress grow.
- Do not self-host until you have a real ops reason and time for backups, monitoring, upgrades, and incident handling.

## Separate Admin Decision

Admin should be split by product surface:

- `/vutrudodac/admin`: lost reports, found reports, match candidates, handoff status, lost/found notifications.
- `/phienchotrenmay/admin`: listings, listing images, approvals, rejections, hide/show, reported listings, marketplace notifications.

Shared admin concerns still exist behind the scenes:

- shared identity and role system
- shared audit log table
- shared admin action model
- shared notification delivery

Do not build one visual admin dashboard first. It will recreate the current monolith. Build two admin route groups with shared primitives.

## Firebase Free Tier Comparison

Firebase is not clearly better for this product.

Current official free/no-cost facts checked on 2026-06-22:

- Firestore no-cost quota: 1 GiB stored data, 50k reads/day, 20k writes/day, 20k deletes/day, 10 GiB/month outbound transfer.
- Firebase Hosting: 10 GB storage and 360 MB/day transfer on no-cost quota.
- Firebase Auth / Identity Platform tier 1: 50k MAU free before paid MAU pricing, but docs have plan-specific caveats.
- Cloud Storage for Firebase requires the pay-as-you-go Blaze plan to create/use Cloud Storage.
- Cloud Storage has no-cost quotas on Blaze: new `firebasestorage.app` buckets in eligible regions get 5 GB-months stored, 100 GB/month downloaded, 5k uploads/month, 50k downloads/month.
- Spark plan shuts off a product for the rest of the month if that product exceeds no-cost quota.
- Blaze needs a billing account. Budget alerts warn only; they do not hard-cap spend.

Where Firebase is better:

- Fastest zero-backend prototype.
- Firestore realtime UX is convenient.
- Auth/social login is mature.
- Image delivery quota on Blaze can be more generous than Supabase Free if you accept billing account risk.
- Hosting includes custom domain/SSL on the no-cost quota.

Where Firebase is worse for Artemis:

- Not self-hostable.
- Firestore is document/NoSQL, weaker fit for relational marketplace + lost/found matching + audit trails.
- Go backend + Firestore is fine, but you lose the clean Postgres schema/RLS/migration path.
- Storage is not truly Spark-only anymore; Cloud Storage requires Blaze.
- Query/read pricing can surprise if UI reads many documents repeatedly.
- Vendor exit path is harder than Postgres.

Recommendation:

- Keep Supabase as default for Artemis because the product wants relational data, Go domain logic, future self-host option, and SQL migrations.
- Use Firebase only if this becomes a very short-lived prototype where speed matters more than ownership and relational correctness.
- If using Firebase anyway, use Blaze with strict budgets, App Check, Firestore security rules, and small image uploads.

## Next Steps

1. Decide whether this is a rewrite or gradual migration.
2. Freeze current demo behavior as acceptance tests before rewrite.
3. Design domain schema before UI scaffolding.
4. Pick auth model: hybrid recommended.
5. Keep separate admin route groups in the plan.
6. Write implementation plan before code.

## Unresolved Questions

- Is production target internal VNG users only, or public users later?
- Should login remain domain-style, email/password, OAuth/SSO, or magic link?
- Do admins overlap between `vũ trụ đồ đạc` and `phiên chợ trên mây`, or can a user manage only one surface?
- Is real-time notification required now, or is polling/email enough?
- Do you want managed Supabase first with later self-host migration, or self-host from day one?
