---
phase: 7
title: "Validation And Cutover"
status: pending
priority: P1
dependencies: [1, 2, 3, 4, 5, 6]
effort: "high"
---

# Phase 7: Validation And Cutover

## Context Links

- Phase 1 baseline: `phase-01-migration-baseline.md`
- Phase 5 theme preservation: `phase-05-theme-preservation-and-attribution.md`
- Current README deploy notes: `README.md`

## Overview

Validate the migrated SvelteKit/Supabase app against current Artemis behavior, security expectations, recreated visual identity, clean-start data policy, and deploy readiness. Cut over only after the focused MVP smoke gates pass and the old demo is archived safely.

## Requirements

- Functional: test all public and admin routes.
- Functional: verify auth and admin authorization boundaries.
- Functional: verify image upload/storage behavior.
- Functional: verify footer attribution and original visual identity.
- Functional: seed clean starter data intentionally; do not migrate SQLite demo data.
- Functional: verify retained compatibility endpoints and any explicitly retired legacy routes.
- Non-functional: old Python/SQLite runtime remains recoverable until new app is accepted.
- Non-functional: final README reflects the active stack.

## Architecture

Validation layers:

```text
Focused unit tests
  matching, ranking, idempotency helpers, storage URL resolver

Focused integration tests
  Google OAuth, verified email, admin seed, create flows, scoped admin actions, authz, owner spoofing, origin checks, namespace access

E2E smoke
  /, /account, /vutrudodac, /phienchotrenmay, both admin routes

Visual smoke
  login/account, first viewport, moon/radar, cloud cards, listing wizard, notifications, footer, mobile layout, both admin routes

Compatibility smoke
  /health, /invocations, retired legacy /api/* routes

Clean-start verification
  no SQLite import, seed rows only, legacy runtime archived, rollback known
```

Cutover path:

```text
Current demo remains available
  -> new SvelteKit app passes validation
  -> README/deployment docs updated
  -> old root files archived or removed by explicit implementation decision
```

## Related Code Files

- Create: `/config/workspace/tiennm99/artemis-demo-agent/tests/e2e/public-routes.spec.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/tests/e2e/auth-admin.spec.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/tests/e2e/visual-theme.spec.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/tests/e2e/compatibility-endpoints.spec.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/tests/e2e/two-browser-freshness.spec.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/domain/lost-found/matching.test.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/domain/marketplace/ranking.test.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/docs/cutover-checklist.md`
- Modify: `/config/workspace/tiennm99/artemis-demo-agent/README.md`
- Modify or archive: `/config/workspace/tiennm99/artemis-demo-agent/index.html`
- Modify or archive: `/config/workspace/tiennm99/artemis-demo-agent/styles.css`
- Modify or archive: `/config/workspace/tiennm99/artemis-demo-agent/app.js`
- Modify or archive: `/config/workspace/tiennm99/artemis-demo-agent/server.py`
- Modify or archive: `/config/workspace/tiennm99/artemis-demo-agent/Dockerfile`

## Implementation Steps

1. Add unit tests:
   - lost/found match scoring
   - marketplace ranking
   - marketplace interest atomicity
   - notification delivery/read state
   - storage URL resolver behavior.
2. Add integration checks:
   - create lost report
   - create found report
   - create listing
   - approve/reject listing
   - Google OAuth user with verified email can enter
   - user without verified Google email is rejected
   - `minhtienit99@gmail.com` and `minhnguyetawf@gmail.com` have seeded admin access
   - `vutrudodac` admin overview/triage visibility
   - `admin_actions` row written for admin action
   - match candidate + notification idempotency
   - malicious payload cannot set another owner/admin/recipient
   - XSS payloads render as text
   - external links are allowlisted/safe
   - JSON handlers reject wrong origin
   - wildcard CORS is absent on cookie-authenticated routes
   - admin roles key to auth user ID, not claimed domain.
   - repositories query the Artemis namespace, not unqualified shared tables.
3. Add Playwright smoke tests:
   - `/` renders intro/router
   - `/vutrudodac` renders radar/lost-found flow
   - `/phienchotrenmay` renders marketplace flow
   - admin routes reject non-admin user
   - admin routes allow scoped admin user.
4. Add compatibility endpoint tests:
   - `GET /health`
   - `POST /invocations`
   - `/api/state` is absent or returns intentional retired response
   - other legacy `/api/*` routes are absent or return intentional retired responses.
5. Add two-browser freshness tests:
   - User A submits found report
   - User B receives match/notification within freshness target
   - admin pending queue updates within freshness target.
6. Add visual smoke checks:
   - compare baseline and migrated screenshots
   - login/account keeps the Artemis voice
   - first viewport aligns with `assets/expected layout-01.jpg` or accepted differences
   - recreated moon/radar present
   - recreated rocket/cloud assets render
   - recreated marketplace cloud cards render
   - recreated astronaut motif appears where planned
   - listing wizard and notification panel retain tone
   - footer attribution present
   - both admin routes are scannable
   - mobile viewport has no critical overlap
   - Vietnamese diacritics do not clip.
7. Verify clean-start cutover:
   - no SQLite export/import script is required
   - no legacy rows or base64 images are imported
   - seed only the approved admin/profile rows needed for smoke tests
   - legacy `/api/state` is not deployed
   - old runtime files remain archived/recoverable until acceptance
   - rollback path is documented.
8. Run validation gates:

   ```bash
   pnpm check
   pnpm test
   pnpm test:e2e
   pnpm build
   ```

9. Compare against Phase 1 baseline and list accepted differences.
10. Update README to make the SvelteKit/Supabase stack the primary path.
11. Create `docs/cutover-checklist.md`:
   - Supabase project ready
   - `artemis` production namespace ready
   - `artemis_preview` preview namespace ready
   - migrations applied
   - admin user seeded
   - env vars configured
   - Google OAuth and verified-email enforcement checked
   - private storage buckets checked
   - preview deployment checked
   - compatibility endpoints checked
   - clean-start data decision recorded
   - old demo archived/recoverable
   - rollback path known.
12. Archive or remove legacy files only after validation:
   - preferred: move to `legacy/static-python-demo/` if useful for provenance
   - acceptable: delete after git history and docs preserve context.

## Todo List

- [ ] Unit tests added.
- [ ] Integration checks added.
- [ ] E2E smoke tests added.
- [ ] Compatibility endpoint tests added.
- [ ] Two-browser freshness tests added.
- [ ] Security checks covered in focused integration/e2e specs.
- [ ] Clean-start data policy verified.
- [ ] Google OAuth verified-email enforcement verified.
- [ ] Seed admin emails verified.
- [ ] Supabase namespace/private bucket isolation verified.
- [ ] Visual smoke tests added.
- [ ] Build/check/test commands pass.
- [ ] README updated to new stack.
- [ ] Cutover checklist created.
- [ ] Legacy runtime archived or intentionally removed.

## Success Criteria

- [ ] New app passes `pnpm check`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`.
- [ ] User can complete lost/found and marketplace flows in the new app.
- [ ] Admin boundaries are enforced by server-side checks.
- [ ] Only verified Google OAuth users can access protected app surfaces.
- [ ] Users cannot spoof owner/admin/recipient IDs in payloads.
- [ ] Match/notification, interest, and admin workflows are idempotent under double submit.
- [ ] Footer attribution is visible and correct.
- [ ] Recreated Artemis assets preserve the original theme in screenshots, or differences are explicitly accepted before cutover.
- [ ] Deployment docs and rollback path are clear.
- [ ] No SQLite/Python runtime remains in the production path.
- [ ] Legacy data is intentionally dropped with explicit acceptance and rollback documented.

## Risk Assessment

- Risk: tests depend on external Supabase state. Mitigation: use isolated test project, seed data, or local Supabase for repeatable runs.
- Risk: visual acceptance is subjective. Mitigation: compare baseline screenshots and require explicit acceptance of intentional changes.
- Risk: old runtime removed too early. Mitigation: archive after new deployment passes and README points to active stack.
- Risk: clean-start accidentally loses needed demo knowledge. Mitigation: preserve behavior/style baseline docs and archive legacy runtime until acceptance.
- Risk: shared Supabase namespace leaks data across projects. Mitigation: schema-qualified queries, private buckets, RLS negative tests, and no public image URLs.

## Security Considerations

- E2E tests must not hardcode real production credentials.
- Test seed users should be test-only and documented.
- Verify admin routes on server, not only hidden UI controls.
- Include XSS, CSRF/origin, owner spoofing, and scoped-admin negative tests before cutover.
- Include Google verified-email, seeded-admin, private storage URL, and namespace isolation tests before cutover.
