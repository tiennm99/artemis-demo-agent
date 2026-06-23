---
phase: 4
title: "Domain Routes And Server Actions"
status: pending
priority: P1
dependencies: [2, 3]
effort: "high"
---

# Phase 4: Domain Routes And Server Actions

## Context Links

- Current app logic: `app.js`
- Current backend routes: `server.py`
- Phase 3 repositories: `phase-03-supabase-data-auth-storage.md`

## Overview

Rebuild the current Artemis user flows as SvelteKit route groups and server actions. Keep the product split clear: `vutrudodac` owns lost/found/radar, `phienchotrenmay` owns marketplace.

## Requirements

- Functional: `/` introduces both apps and routes users to the exact product they want.
- Functional: `/vutrudodac` supports lost item, found item, matching, and notifications.
- Functional: `/phienchotrenmay` supports marketplace browse/search, create listing, care/interest, and item status.
- Functional: `/vutrudodac/admin` and `/phienchotrenmay/admin` are separate admin surfaces.
- Functional: `/account` owns Google OAuth sign in/out and profile basics.
- Functional: preserve `/health` and `/invocations`; retire every current `/api/*` route, including `/api/state`.
- Non-functional: no full-state polling; use server loads plus targeted polling for notifications/admin freshness. Supabase Realtime is hardening.
- Non-functional: keep domain logic testable and out of Svelte components when possible.

## Architecture

Route ownership:

```text
src/routes/+page.svelte
  main intro/router

src/routes/vutrudodac/+page.svelte
src/routes/vutrudodac/+page.server.ts
  lost/found forms
  radar summary
  match suggestions
  user notifications

src/routes/vutrudodac/admin/+page.svelte
src/routes/vutrudodac/admin/+page.server.ts
  separate scoped admin surface for lost/found overview, match review, and MVP triage

src/routes/phienchotrenmay/+page.svelte
src/routes/phienchotrenmay/+page.server.ts
  marketplace listing, search, create, interest

src/routes/phienchotrenmay/admin/+page.svelte
src/routes/phienchotrenmay/admin/+page.server.ts
  scoped listing approval/reject/hide/show

src/routes/health/+server.ts or src/routes/health/+server.js equivalent route file
  runtime health response

src/routes/invocations/+server.ts
  AgentBase-compatible POST response, unless explicitly retired
```

Domain services:

```text
src/lib/server/domain/lost-found/
  matching.ts
  report-actions.ts

src/lib/server/domain/marketplace/
  listing-actions.ts
  ranking.ts

src/lib/server/domain/notifications/
  create-notification.ts
```

Compatibility matrix:

| Current route | New route/handler | Decision |
| --- | --- | --- |
| `GET /health` | SvelteKit `GET /health` handler | Keep |
| `POST /invocations` | SvelteKit `POST /invocations` handler | Keep unless AgentBase retired |
| `GET/POST /api/state` | none | Retire; production app starts clean |
| `POST /api/auth/login` | `/account` OAuth action | Retire legacy username login |
| Lost/found/listing APIs | SvelteKit actions | Retire legacy APIs |
| Admin marketplace PATCH routes | scoped admin actions | Retire legacy APIs |

## Related Code Files

- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/+page.svelte`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/account/+page.svelte`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/account/+page.server.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/vutrudodac/+page.svelte`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/vutrudodac/+page.server.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/vutrudodac/admin/+page.svelte`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/vutrudodac/admin/+page.server.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/phienchotrenmay/+page.svelte`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/phienchotrenmay/+page.server.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/phienchotrenmay/admin/+page.svelte`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/phienchotrenmay/admin/+page.server.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/health/+server.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/invocations/+server.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/domain/lost-found/matching.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/domain/marketplace/ranking.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/domain/marketplace/interests.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/domain/notifications/create-notification.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/ui/admin/scoped-admin-shell.svelte`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/security/origin-check.ts`
- Port logic from: `/config/workspace/tiennm99/artemis-demo-agent/app.js`
- Port only kept runtime behavior from: `/config/workspace/tiennm99/artemis-demo-agent/server.py`

## Implementation Steps

1. Build `/` as a product router:
   - first viewport clearly says Artemis / Vũ trụ đồ đạc / Phiên chợ trên mây
   - two action paths route to `/vutrudodac` and `/phienchotrenmay`
   - use existing visual language, not a marketing SaaS hero.
   - preserve Vietnamese action labels and copy tone such as `Bay vào vũ trụ`, `Dò mây`, `Phóng vật phẩm lên chợ`, `tín hiệu`, and `radar`.
2. Rebuild account flow:
   - Supabase Google OAuth login/logout
   - reject or sign out users with missing/unverified email
   - profile display/domain field as metadata only
   - domain reservation for privileged names like `artemis_8920`
   - redirect back to intended app after auth.
3. Implement compatibility handlers:
   - `GET /health`
   - `POST /invocations`
   - no `/api/state`
   - no broad `/api/*` wrappers.
4. Port lost/found matching logic from `app.js` into pure TypeScript functions.
5. Add `/vutrudodac` server actions:
   - create lost report
   - create found report
   - upload/link report image
   - compute candidate matches via server-only matching
   - upsert match candidates and notifications transactionally/idempotently.
6. Add `/phienchotrenmay` server actions:
   - create listing
   - upload/link listing image
   - browse approved listings
   - search/rank items
   - express interest/care through atomic unique `(listing_id, profile_id)` toggle.
7. Add `/vutrudodac/admin`:
   - list lost/found reports
   - review matches
   - MVP triage only: visibility review, suspicious report review, and match overview
   - defer returned/closed/hidden moderation workflow until hardening unless user confirms it is needed for v1
   - log every admin action.
8. Add `/phienchotrenmay/admin`:
   - list pending listings
   - approve/reject/hide/show listings
   - update item status
   - log every admin action.
9. Replace whole-state sync with focused invalidation:
   - server loads for initial data
   - form actions for mutations
   - targeted 15-30 second polling for notification badges and admin pending queues
   - document Supabase Realtime as a hardening option only if polling fails UX.
10. Add notification read/delivery actions:
    - mark read
    - broadcast handling
    - recipient-only delivery.
11. Add shared error and empty states in Vietnamese.
12. Make both admin pages pass MVP scan/action usability:
    - overview counts visible
    - pending queues scannable
    - approve/reject/hide/show actions clear
    - useful empty states
    - destructive actions confirmed or recoverable.
13. Ban unsafe user-content rendering:
    - no `{@html}` for user fields
    - no raw `innerHTML` porting
    - URL allowlist for external links
    - image paths resolved through storage helper.
14. Add origin/CSRF controls:
    - use SvelteKit form actions for mutations where possible
    - explicit origin checks for JSON handlers
    - no wildcard CORS.

## Todo List

- [ ] Product router page implemented.
- [ ] Account/auth route implemented with Google OAuth and verified email enforcement.
- [ ] `/health`, `/invocations`, and legacy API retirement matrix implemented.
- [ ] Lost/found matching logic ported and unit-testable.
- [ ] `/vutrudodac` user flow implemented.
- [ ] `/phienchotrenmay` user flow implemented.
- [ ] `/vutrudodac/admin` implemented with scoped role checks.
- [ ] `/phienchotrenmay/admin` implemented with scoped role checks.
- [ ] Whole-state polling replaced by targeted freshness strategy.
- [ ] Admin pages pass MVP scan/action usability checks.
- [ ] Unsafe rendering, URL, origin, and CORS rules implemented.

## Success Criteria

- [ ] A signed-in user can create lost/found reports and marketplace listings.
- [ ] A user without verified Google OAuth email cannot access protected app surfaces or mutate data.
- [ ] A non-admin cannot access either admin route.
- [ ] A `vutrudodac` admin cannot moderate marketplace unless also granted that scope.
- [ ] A `phienchotrenmay` admin cannot moderate lost/found unless also granted that scope.
- [ ] Matching and marketplace ranking produce equivalent or better results than current demo for baseline cases.
- [ ] Notifications appear without requiring full shared-state sync.
- [ ] A two-browser test proves match notifications and admin pending queues refresh within the chosen freshness target.
- [ ] `/health` and `/invocations` return compatible responses or have explicit retirement signoff.
- [ ] Legacy `/api/*` routes are absent or return intentional retired responses.
- [ ] Public routes retain original Vietnamese labels and Artemis visual language.

## Risk Assessment

- Risk: domain logic gets buried in components. Mitigation: pure domain modules plus server actions.
- Risk: admin split duplicates code. Mitigation: share primitives for auth, admin-action logging, table controls, and scoped mutations.
- Risk: SvelteKit action payloads become too large. Mitigation: cap image size/count and use server-mediated Storage helpers; direct upload intents are hardening.
- Risk: old clients expect legacy APIs. Mitigation: keep only `/health` and `/invocations`; document legacy API retirement clearly.
- Risk: notification freshness regresses after removing whole-state polling. Mitigation: targeted polling plus E2E two-browser test; add Realtime later only if needed.

## Security Considerations

- Every server action must read the current session server-side.
- Every app load/action must enforce verified Google OAuth session before protected work.
- Admin actions must check product-specific role before mutation.
- Do not trust hidden fields for owner/admin identity.
- Use CSRF-safe SvelteKit form actions and validate all input server-side.
- JSON handlers must verify origin and must not expose wildcard CORS.
- Render user content through text bindings only; do not port legacy `innerHTML` patterns.
