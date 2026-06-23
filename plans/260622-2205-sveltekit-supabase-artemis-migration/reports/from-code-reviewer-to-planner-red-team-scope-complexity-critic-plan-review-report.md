## Finding 1: New SvelteKit pages drop existing HTTP and AgentBase contracts
- **Severity:** Critical
- **Location:** Phase 4, section "Domain Routes And Server Actions"
- **Flaw:** The plan replaces the runtime with page routes/server actions but never defines a compatibility matrix for the existing API, health, and AgentBase endpoints.
- **Failure scenario:** The migrated app renders `/vutrudodac`, passes planned smoke tests, then AgentBase calls `POST /invocations` and gets 404. Existing browser/API consumers calling `/api/state`, `/api/auth/login`, `/api/notifications`, or marketplace patch routes also fail because the plan only validates the new pages.
- **Evidence:** `plan.md:29-38` lists only page routes; `phase-04-domain-routes-and-server-actions.md:105-130` defines form actions, not legacy API routes; `README.md:48-65` documents `/health`, `/invocations`, and `/api/*`; `app.js:119-166` calls `/api/state`, `/api/auth/login`, `/api/lost-items`, `/api/found-items`, `/api/marketplace-items`, admin patch routes, and `/api/notifications`; `server.py:552-570`, `server.py:592-612`, and `server.py:616-628` implement those contracts.
- **Suggested fix:** Add an explicit API compatibility table. Either implement SvelteKit `+server.ts` handlers for every current route through cutover, or state which consumers are retired and add tests for `/health` and `/invocations`.

## Finding 2: Auth model is unresolved but planned as a foundation
- **Severity:** Critical
- **Location:** Phase 3, section "Risk Assessment"
- **Flaw:** The plan admits the login model is unclear, but Phase 3/4 still build Supabase Auth, roles, and account flows on top of that unknown.
- **Failure scenario:** Implementation picks email/password or magic links. Current Starter users who enter `nguyetntm5` style domains cannot sign in, report ownership no longer matches `domain`/`contact`, and the hardcoded `artemis_8920` admin cannot access moderation unless someone invents a migration after the fact.
- **Evidence:** `plan.md:123` leaves "email/password, magic link, OAuth, or domain-style username" open; `phase-03-supabase-data-auth-storage.md:27` requires Supabase Auth; `phase-03-supabase-data-auth-storage.md:150` still says the auth model is unclear; `phase-04-domain-routes-and-server-actions.md:100-103` rebuilds account flow; current product says domain login in `README.md:29` and `README.md:158`; current app stores domain auth/admin in `app.js:289-301` and `app.js:541-543`; current backend auto-creates domain users in `server.py:147-165`.
- **Suggested fix:** Block Phase 2/3 until auth is decided. For MVP, bridge domain-style login to Supabase profiles, seed `artemis_8920`, and preserve `domain`/`contact` as product identifiers.

## Finding 3: Normalized Supabase schema is premature and misses the payload contract
- **Severity:** High
- **Location:** Phase 3, section "Architecture"
- **Flaw:** The plan jumps from SQLite JSON payloads to many relational tables, enums, indexes, RLS policies, repositories, audit logs, and storage before proving every current payload field has a home.
- **Failure scenario:** The new DB stores a clean `marketplace_listings` row but drops behavior fields like `quantity`, `ownerDomain`, `stockStatus`, `careCount`, `caredBy`, `editCount`, `edited`, `link`, `_autoApproved`, match alternatives, and notification details. Cards render wrong, care counts reset, owner edit limits disappear, and notifications cannot round-trip.
- **Evidence:** Phase 3 proposes schema groups in `phase-03-supabase-data-auth-storage.md:35-52` and enums/indexes in `phase-03-supabase-data-auth-storage.md:88-99`; Phase 1 only sketches three mappings in `phase-01-migration-baseline.md:78-86`; current normalization depends on dynamic payload fields in `app.js:490-505`, marketplace submission fields in `app.js:1735-1758`, notification payloads in `app.js:1278-1394`, and backend JSON payload storage in `server.py:45-53` plus `server.py:248-277`.
- **Suggested fix:** MVP schema should mirror current contracts with JSONB payload plus indexed columns. Normalize after parity is proven and after field inventory is exhaustive.

## Finding 4: Data migration is hand-waved despite explicit data-loss risk
- **Severity:** High
- **Location:** Phase 7, section "Validation And Cutover"
- **Flaw:** The plan says avoid data loss and "migrate or seed demo data intentionally" but provides no export/import script, ID mapping, dual-write, count verification, or rollback data procedure.
- **Failure scenario:** Supabase launches empty or with seed-only data. Existing SQLite lost/found reports, pending listings, notifications, match suggestions, and `readBy` state remain in the old DB. Cutover archives Python files and users lose the shared demo state.
- **Evidence:** Phase 1 requires avoiding data loss in `phase-01-migration-baseline.md:34`; Phase 7 only says "migrate or seed" in `phase-07-validation-and-cutover.md:28` and then jumps to validation/archive in `phase-07-validation-and-cutover.md:106-118`; current backend already exposes full state import/export in `server.py:499-531`; current README documents SQLite persistence and routes in `README.md:54-65`.
- **Suggested fix:** Add a migration phase: export `/api/state` or SQLite JSON, transform to Supabase, preserve or map IDs, verify record counts/status buckets, and keep rollback data until acceptance.

## Finding 5: Removing whole-state polling breaks current cross-user notifications
- **Severity:** High
- **Location:** Phase 4, section "Requirements"
- **Flaw:** The plan bans full-state polling but does not replace it with realtime, targeted polling, or a bounded freshness contract for reports, matches, pending items, and notifications.
- **Failure scenario:** User A submits a found report. User B already has a lost report open and never sees the match notification until manual refresh because the new app only uses server loads and optional badge polling. Admin pending listings also go stale.
- **Evidence:** Phase 4 says no full-state polling in `phase-04-domain-routes-and-server-actions.md:29` and replaces it with focused invalidation/optional badge polling in `phase-04-domain-routes-and-server-actions.md:127-130`; current app reconciles shared state in `app.js:437-455`, loads after submissions in `app.js:941` and `app.js:999`, refreshes before notification/admin panels in `app.js:1645-1657`, and polls every 15 seconds in `app.js:2013-2015`; backend state/match data comes from `server.py:442-487` and `server.py:499-505`.
- **Suggested fix:** Define a minimal freshness SLA. Keep targeted polling for reports/notifications/admin lists or use Supabase Realtime; test two-browser match and pending-list updates.

## Finding 6: Storage design is gold-plated and not tied to render/match behavior
- **Severity:** High
- **Location:** Phase 3, section "Architecture"
- **Flaw:** The plan introduces draft rows, upload intents, direct browser uploads, private buckets, signed URLs, and metadata persistence without defining how current `image` fields continue to render and drive match heuristics.
- **Failure scenario:** A listing stores `artemis-marketplace-images/profile/record/file.jpg` but the card and notification need a browser-readable `src`. If the bucket is private or a signed URL expires, images disappear. If image metadata is not copied into report records, `imageSignal` matching changes.
- **Evidence:** Upload model is in `phase-03-supabase-data-auth-storage.md:61-70`; Phase 4 only says upload/link image in `phase-04-domain-routes-and-server-actions.md:105-116`; current match code uses `imageSignal` in `app.js:625`; marketplace and notification rendering use direct image sources in `app.js:1100-1103` and `app.js:1310-1312`; current compression produces a data URL in `app.js:1399-1428`; backend stores `image` and payload values in `server.py:201-212` and `server.py:227-237`.
- **Suggested fix:** For MVP, use a single server action upload path, store canonical object path plus a deterministic URL resolver, and specify signed/public URL lifetime before choosing private buckets.

## Finding 7: Split admin scopes are new product, not migration
- **Severity:** Medium
- **Location:** Phase 4, section "Requirements"
- **Flaw:** The plan invents separate product admins, scoped roles, lost/found moderation, and audit transitions. Current contract is one domain-gated admin dashboard with visible marketplace moderation and read-only lost/found overview.
- **Failure scenario:** Implementation burns time on `vutrudodac` roles, `returned/closed/hidden` report states, audit logs, and duplicated admin surfaces while the current `artemis_8920` admin workflow is not preserved. The shipped app is larger and less familiar with no user-proven need.
- **Evidence:** Phase 4 requires separate admin surfaces in `phase-04-domain-routes-and-server-actions.md:27`, lost/found moderation in `phase-04-domain-routes-and-server-actions.md:117-126`, and scoped admin success criteria in `phase-04-domain-routes-and-server-actions.md:146-149`; Phase 3 adds admin scope/roles/audit in `phase-03-supabase-data-auth-storage.md:47-48`, `phase-03-supabase-data-auth-storage.md:92`, and `phase-03-supabase-data-auth-storage.md:99`; current docs describe one admin rule in `docs/project-workflow-tech-stack.md:79-85` and `docs/project-workflow-tech-stack.md:170`; current admin dashboard/mutations live in `app.js:1135-1274` and `app.js:1807-1850`.
- **Suggested fix:** Preserve one MVP admin route with current marketplace operations and lost/found visibility. Defer scoped role split and lost/found moderation until required.

## Finding 8: Theme component system is abstraction before parity
- **Severity:** Medium
- **Location:** Phase 5, section "Architecture"
- **Flaw:** The plan mandates a theme system and named Svelte components before proving the existing visual output can be preserved. That is scope creep for a migration whose acceptance is visual parity.
- **Failure scenario:** Implementers rewrite the moon/radar/cloud visuals into `MoonRadar`, `CloudCard`, and token files, miss exact layout/motion details, and spend Phase 5 on architecture instead of screenshots matching the current first viewport and marketplace.
- **Evidence:** Phase 5 proposes component/theme files in `phase-05-theme-preservation-and-attribution.md:34-46` and implementation steps in `phase-05-theme-preservation-and-attribution.md:101-113`; current first viewport and marketplace shell are direct markup in `index.html:21-79`; the current visual system depends on `@font-face` in `styles.css:1-3`, moon/radar styles in `styles.css:265-322`, and cloud-card background in `styles.css:713-719`.
- **Suggested fix:** First port existing CSS/assets into SvelteKit global styles and verify screenshot parity. Extract components only where repetition or route reuse proves it is needed.

Status: DONE_WITH_CONCERNS
Summary: Plan overreaches into a full product/platform rewrite while leaving current route, auth, data, sync, storage, and deployment contracts under-specified.
Concerns/Blockers: Resolve auth, API compatibility, data migration, and freshness strategy before any scaffold or schema work.
