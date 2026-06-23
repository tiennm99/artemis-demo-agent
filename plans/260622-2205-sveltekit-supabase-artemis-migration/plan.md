---
title: "SvelteKit Supabase Artemis Migration"
description: "Migrate Artemis from the static Python/SQLite demo to a SvelteKit + hosted Supabase app while preserving the original space-themed product soul."
status: in-progress
priority: P1
branch: "main"
tags: [refactor, frontend, backend, database, auth, infra]
blockedBy: []
blocks: []
created: "2026-06-22T15:06:01.547Z"
createdBy: "ck:plan"
source: skill
---

# SvelteKit Supabase Artemis Migration

## Overview

Migrate Artemis from the current static `index.html` + `styles.css` + `app.js` + Python/SQLite runtime into a professional SvelteKit application backed by hosted Supabase Auth, Postgres, and Storage.

This plan accepts the updated stack decision:

- One SvelteKit app first.
- Hosted Supabase first. This is a small production app under 5k MAU, not a disposable demo; Free can be used only if quota and recovery expectations are accepted, with a documented Pro upgrade trigger.
- No separate Go API in the first migration unless a later trigger appears.
- Deploy SvelteKit to Vercel.
- Preserve the original visual soul: space vibe, radar moon, rocket, clouds, asteroid accents, care star, trade station, astronaut/galaxy language, playful Vietnamese microcopy, and the current authored Artemis feeling. Current assets are style references; production assets should be recreated with a consistent Artemis style and documented ownership.
- Preserve `/health` and `/invocations`; retire all legacy `/api/*` routes, including `/api/state`, after cutover.
- Move the old static/Python demo code into `legacy/static-python-demo/` as a backup/reference folder after baseline capture and scaffold compatibility are in place. Do not delete the old code during MVP migration.

Primary routes:

```text
/
/vutrudodac
/phienchotrenmay
/vutrudodac/admin
/phienchotrenmay/admin
/account
```

Target data flow:

```text
Browser
  -> SvelteKit pages/actions/+server handlers
  -> Supabase Auth/Postgres/Storage
```

Writes must go through SvelteKit server handlers or carefully scoped Supabase policies. Browser-side privileged table writes are out of scope.

Go is deferred until one of these triggers happens: external clients, background matching/notification jobs, LLM orchestration complexity, or a hard API ownership boundary.

## Scope Challenge

- Existing code: current product behavior, assets, theme, matching heuristics, marketplace wizard, admin flows, and demo copy already exist in `index.html`, `styles.css`, `app.js`, `server.py`, and `assets/`.
- Minimum change: scaffold SvelteKit, model data in Supabase, port current flows into route groups, preserve theme/assets, add real authz, deploy to Vercel.
- Complexity: this touches most files because it replaces the runtime. Keep complexity controlled by deferring Go, Supabase Realtime, direct-to-storage upload intents, payments, vector search, and self-hosted Supabase.
- Selected scope: hold scope. Professional migration, no product redesign.

## 5k MAU Scope Calibration

Keep the hard safety boundaries for small production:

- Supabase Auth with SSR cookies, Google OAuth only, and server-side role checks.
- Require verified Google OAuth email; no password, magic link, anonymous, localStorage, or arbitrary domain username auth.
- Admin roles keyed to immutable `auth.users.id`, not domain text.
- RLS/privacy boundaries for owner, counterparty, recipient, and approved marketplace reads.
- Namespaced Supabase schema/storage so this app can share one Supabase project with other Vercel apps.
- Clean-start data policy: drop existing SQLite demo data; seed production-safe starter data only.
- Server-mediated image upload with MIME, size, count, and path validation.
- Private Supabase Storage buckets only; render through signed/server URL resolver.
- Idempotent match, notification, and marketplace interest writes.
- No unsafe user HTML rendering, no wildcard CORS, and explicit origin checks for JSON mutations.
- Account-spam controls: Google OAuth only, verified email required, per-user submission caps, dedupe constraints, and admin visibility into suspicious activity.
- Targeted polling freshness within 15-30 seconds for notifications and admin queues.

Defer platform-grade features until public production pressure proves need:

- Separate Go API.
- Self-hosted Supabase.
- Supabase Realtime.
- Browser direct-upload intent/finalize pipeline.
- Rich lost/found moderation state machine beyond MVP triage.
- Multi-admin management UI.
- Deep audit export/retention and quota dashboards.
- Broad legacy `/api/*` compatibility wrappers.
- Enterprise-sized test matrix.

## Red-Team Blockers To Resolve Before Implementation

- Auth/admin bootstrap: use Supabase Google OAuth only. Domain-style profile names may remain display/business metadata, but admin roles must key to immutable `auth.users.id`, not mutable domain text.
- Admin bootstrap: seed `minhtienit99@gmail.com` and `minhnguyetawf@gmail.com` as admins. Default both to both product scopes unless implementation explicitly scopes them differently.
- Legacy runtime safety: existing SQLite demo data is intentionally dropped. Do not expose legacy `/api/state` in production.
- Legacy code backup: move old root demo files into `legacy/static-python-demo/` for easy reference and rollback context after baseline capture; keep the backup out of the production path.
- Data cutover: seed clean production-safe data; do not migrate legacy SQLite rows or base64 images.
- API compatibility: keep `/health` and `/invocations`; retire all legacy `/api/*` routes after cutover.
- Privacy boundary: matching can use server-only/service-role access to minimal columns, but normal user reads must remain owner/counterparty/recipient scoped.
- Freshness: replace whole-state polling with targeted polling first; Supabase Realtime is hardening, not MVP.

## Architecture Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Web runtime | SvelteKit | Routes, SSR, forms/actions, server endpoints, Vercel support. |
| Backend boundary | SvelteKit server handlers first | Less deploy surface than SvelteKit + Go for under 5k MAU. |
| Database | Supabase Postgres in `artemis` prod and `artemis_preview` preview schemas | Avoid collisions because the Supabase project may be shared with other Vercel apps. |
| Auth | Supabase Auth with Google OAuth only | Avoid localStorage-only auth; verified Google accounts reduce account spam; support server authz checks. |
| Storage | Private Supabase Storage with environment-specific Artemis buckets | Store image files as private objects, not base64 payloads. |
| Deployment | Vercel + Supabase hosted | Fast small-production path; self-host later if compliance/ops require. |
| UI direction | Recreate assets from Artemis reference style | Original author soul is a hard requirement, but production assets need clear ownership/licensing. |
| Compatibility | Keep `/health` and `/invocations`; retire all legacy APIs | AgentBase compatibility remains only where needed. |

## Non-Goals

- No self-hosted Supabase in v1.
- No Firebase migration.
- No separate Go API in v1.
- No microservices.
- No payment/checkout system for `phienchotrenmay`.
- No AI/vector matching as source of truth.
- No generic SaaS redesign.
- No Supabase Realtime in MVP unless targeted polling fails the accepted freshness target.
- No legacy SQLite data migration.
- No public image buckets.
- No auth providers other than Google in v1.
- No anonymous account access in v1.

## External References

- Supabase SSR auth client: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase standard uploads: https://supabase.com/docs/guides/storage/uploads/standard-uploads
- SvelteKit adapter for Vercel: https://svelte.dev/docs/kit/adapter-vercel
- Vercel SvelteKit guide: https://vercel.com/docs/frameworks/full-stack/sveltekit
- Existing stack report: ../reports/research-260622-artemis-professional-stack.md
- Existing workflow doc: ../../docs/project-workflow-tech-stack.md

## Execution Waves

The detailed phase files stay separate for execution detail, but the MVP should run as five practical waves:

| Wave | Goal | Phase Files | Status |
|------|------|-------------|--------|
| 1 | Baseline decisions, compatibility retirement, visual/style inventory, clean-start cutover | [Phase 1](./phase-01-migration-baseline.md) | In Progress |
| 2 | SvelteKit scaffold, legacy backup folder, early Artemis theme/assets/footer shell | [Phase 2](./phase-02-project-scaffold.md), start [Phase 5](./phase-05-theme-preservation-and-attribution.md) | In Progress |
| 3 | Supabase auth/data/storage namespace, private image foundation, seed data | [Phase 3](./phase-03-supabase-data-auth-storage.md) | Pending |
| 4 | Product routes, server actions, compatibility endpoints, scoped admin pages | [Phase 4](./phase-04-domain-routes-and-server-actions.md), continue [Phase 5](./phase-05-theme-preservation-and-attribution.md) | Pending |
| 5 | Preview deploy, focused validation, cutover, legacy backup verification | [Phase 6](./phase-06-deployment-and-operations.md), [Phase 7](./phase-07-validation-and-cutover.md) | Pending |

## MVP vs Hardening

MVP must include:

- `/`, `/account`, `/vutrudodac`, `/phienchotrenmay`, `/vutrudodac/admin`, `/phienchotrenmay/admin`.
- SvelteKit server actions and `+server` handlers with Supabase SSR Auth.
- Hosted Supabase Auth/Postgres/Storage with `artemis` production and `artemis_preview` preview namespaces.
- Google OAuth with verified email.
- JSONB-first schema with indexed columns for core queries.
- Server-mediated small image uploads.
- Private `artemis-*` image buckets with signed/server URL resolver.
- `/health` and `/invocations`; all legacy `/api/*` routes retired.
- Separate admin routes with shared scoped admin primitives; `minhtienit99@gmail.com` and `minhnguyetawf@gmail.com` seed as admins with both scopes by default.
- Targeted polling for notifications/admin queues.
- Clean-start seed data; no legacy SQLite migration.
- Old static/Python demo code backed up under `legacy/static-python-demo/` for reference; no old runtime code remains in the production path.
- Focused unit/integration/Playwright smoke coverage.
- Recreated production assets based on current Artemis tone/style analysis.

Hardening backlog:

- Direct signed upload intents and orphan cleanup jobs.
- Supabase Realtime.
- Rich lost/found moderation status workflow.
- Role-management UI for multiple admins.
- Advanced rate limiting, abuse dashboards, audit export/retention beyond MVP caps/dedupe.
- Self-hosting, Go service, or separate API ownership boundary.

## Dependencies

- No unfinished overlapping implementation plan detected in `plans/`.
- Earlier research report is advisory input, not a blocker: `plans/reports/research-260622-artemis-professional-stack.md`.

## Acceptance Criteria

- Routes exist and work: `/`, `/vutrudodac`, `/phienchotrenmay`, `/vutrudodac/admin`, `/phienchotrenmay/admin`, `/account`.
- Original Artemis visual identity remains recognizable: moon/radar/rocket/cloud/asteroid/care-star/trade-station/space motifs, playful Vietnamese copy, and dark cosmic styling are preserved through recreated production-owned assets.
- Visual parity is checked against baseline screenshots and `assets/expected layout-01.jpg`, including login/account, first viewport, moon/radar, marketplace cloud cards, listing wizard, notification panel, footer, mobile, and both admin routes.
- Footer exists on public pages: `Made by miti99 (miti99.com) from artemis (iamminhnguyet.com) idea, with <3`.
- Auth is Google OAuth only; users must have a verified Google email.
- Auth is no longer localStorage-only; server-side auth/session checks protect admin routes.
- Supabase schema replaces SQLite JSON blob persistence.
- Supabase tables live under `artemis` for production and `artemis_preview` for preview; storage buckets are private and environment-specific.
- Images are uploaded to private Supabase Storage; DB stores paths/metadata, not base64 image payloads.
- Separate admin surfaces exist for `vutrudodac` and `phienchotrenmay`.
- Admin pages are usable for repeated work: counts visible, pending queues scannable, approve/reject/hide/show actions clear, useful empty states, and destructive actions confirmed or recoverable.
- Vercel deployment config and required Supabase env var docs exist.
- Smoke tests cover public routes, auth boundaries, item submission, marketplace listing, admin moderation, and footer attribution.
- Existing compatibility endpoints are tested: `/health` and `/invocations`.
- Legacy `/api/*` routes, including `/api/state`, are absent or return an intentional retired response.
- Clean-start cutover is documented; legacy SQLite data is intentionally dropped.
- Old root demo files are moved into `legacy/static-python-demo/` as a readable backup/reference folder once the new app owns the root runtime.

## Decisions From User - 2026-06-23

- Auth UX: Supabase Google OAuth only.
- Access policy: verified Google email required; anti-spam relies on OAuth identity plus per-account caps/dedupe, not anonymous signup.
- Existing SQLite data: drop; start clean with seed data.
- Legacy API choice: keep only `/health` and `/invocations`; retire all legacy `/api/*` routes.
- Image storage: private buckets only, with signed/server URL resolver.
- Assets: analyze current assets for tone/style, then recreate all production assets.
- Scope: small production app under 5k MAU, not an overbuilt enterprise platform.
- Admin seed emails: `minhtienit99@gmail.com` and `minhnguyetawf@gmail.com`.
- Supabase isolation: use `artemis` namespace for production and `artemis_preview` for preview because the Supabase project may be shared with other Vercel apps.
- Legacy code backup: old static/Python demo files should move into `legacy/static-python-demo/` for easy reference, not be deleted during MVP migration.

## Open Questions

- None before implementation.

## Red Team Review

### Session - 2026-06-22

**Findings:** 15 capped findings from 31 raw reviewer findings; 14 accepted, 1 rejected.
**Severity breakdown:** 4 Critical, 9 High, 2 Medium.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Data migration and legacy `/api/state` can lose or poison data | Critical | Accept as clean-start retirement | Phase 1, Phase 7 |
| 2 | Auth/admin bootstrap unresolved while schema assumes Supabase users | Critical | Accept | Plan, Phase 3, Phase 4 |
| 3 | Runtime/API compatibility can drop `/health`, `/invocations`, and `/api/*` | Critical | Accept | Plan, Phase 4, Phase 6, Phase 7 |
| 4 | RLS can block matching or leak private reports | Critical | Accept | Phase 3, Phase 4 |
| 5 | Service-role writes can trust client-supplied owners/actors | High | Accept | Phase 3, Phase 4, Phase 7 |
| 6 | Storage upload flow permits orphan files, forged paths, or broken rendering | High | Accept | Phase 3, Phase 4, Phase 7 |
| 7 | Match candidates and notifications are not transactional/idempotent | High | Accept | Phase 3, Phase 4, Phase 7 |
| 8 | Marketplace interests can race and drift | High | Accept | Phase 3, Phase 4, Phase 7 |
| 9 | Notification delivery/read state and freshness are underspecified | High | Accept | Phase 3, Phase 4, Phase 7 |
| 10 | Lost/found admin status transitions are not backed or tested | High | Accept as hardening | Phase 4, Phase 7 |
| 11 | Legacy template port can preserve XSS patterns | High | Accept | Phase 4, Phase 7 |
| 12 | Cookie-authenticated mutations need concrete origin/CSRF/CORS rules | High | Accept | Phase 4, Phase 6, Phase 7 |
| 13 | Fully normalized schema may drop current-flow payload fields | High | Accept | Phase 1, Phase 3 |
| 14 | Deployment hygiene lacks `.env.example` git exception and abuse controls | Medium | Accept | Phase 2, Phase 6 |
| 15 | Remove split admin scopes as over-scope | Medium | Reject | User explicitly requested separate admin per product; plan keeps split but hardens roles and seed path. |

### Whole-Plan Consistency Sweep

- Files reread: `plan.md`, `phase-01-migration-baseline.md`, `phase-02-project-scaffold.md`, `phase-03-supabase-data-auth-storage.md`, `phase-04-domain-routes-and-server-actions.md`, `phase-05-theme-preservation-and-attribution.md`, `phase-06-deployment-and-operations.md`, `phase-07-validation-and-cutover.md`.
- Decision deltas checked: 14 accepted findings plus 1 rejected admin-scope reversal.
- Reconciled stale references: auth/admin bootstrap, API compatibility, storage upload lifecycle, schema parity, legacy runtime safety, targeted freshness, validation gates.
- Unresolved contradictions: 0.

### Scope Calibration Review - 2026-06-23

**Agents:** scope/YAGNI reviewer, security reviewer, sequencing planner, UI/theme reviewer.

**Consensus applied:**

- Keep core safety: Supabase Auth, server authz, RLS/privacy, clean-start data decision, legacy `/api/state` retirement, idempotent writes, XSS/CSRF/origin controls.
- Simplify MVP: targeted polling before Realtime, server-mediated image uploads before direct upload intents, `admin_actions` before full audit architecture, focused smoke tests before enterprise-sized suites.
- Run as five execution waves, not seven heavyweight gates.
- Move theme preservation into scaffold/route work so the original Artemis soul is not repaired late.
- Move data decisions into the data phase; after user decision, legacy migration scripts are unnecessary because production starts clean.
- Keep separate admin routes, but share scoped admin primitives; one seeded admin may hold both scopes by default.
- Default to hosted Supabase with small-production controls; Free is acceptable only when quotas/recovery expectations are accepted, otherwise upgrade to Pro before production cutover.
