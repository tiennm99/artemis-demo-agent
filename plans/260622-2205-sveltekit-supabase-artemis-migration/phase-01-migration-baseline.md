---
phase: 1
title: "Migration Baseline"
status: in-progress
priority: P1
dependencies: []
effort: "medium"
---

# Phase 1: Migration Baseline

## Context Links

- Current README: `README.md`
- Current workflow doc: `docs/project-workflow-tech-stack.md`
- Current frontend shell: `index.html`
- Current style system: `styles.css`
- Current app logic: `app.js`
- Current persistence/API: `server.py`
- Current assets: `assets/`

## Overview

Freeze the current Artemis behavior before replacing the runtime. Capture the product flows, visual identity, data contracts, and demo quirks so the SvelteKit migration preserves what users already feel while intentionally starting production data clean.

This phase is read-heavy. Implementation should avoid moving/deleting current files until snapshots and parity expectations exist.

## Requirements

- Functional: document current lost item, found item, match, notification, marketplace, and admin flows.
- Functional: identify current API/data fields that need Supabase table columns or clean-start seed values.
- Functional: document every current HTTP/runtime contract: `/health`, `/invocations`, `/api/state`, `/api/auth/login`, `/api/lost-items`, `/api/found-items`, `/api/marketplace-items`, `/api/notifications`, `/api/matches/:id`, and admin patch routes.
- Functional: capture visual invariants: moon radar, rocket, cloud cards, asteroid accents, care star, trade station, dark galaxy surface, custom font, Vietnamese tone, footer attribution, and the astronaut motif decision.
- Non-functional: define the migration as behavior-preserving first, architectural cleanup second.
- Non-functional: explicitly drop existing SQLite demo data for production; preserve behavior/style knowledge and back up old demo code under `legacy/static-python-demo/` for easy later reference.

## Architecture

Current state:

```text
Browser SPA
  -> app.js dataService
  -> server.py
  -> SQLite JSON payload tables
```

Migration target after later phases:

```text
SvelteKit route groups
  -> server actions/+server handlers
  -> Supabase Auth/Postgres/Storage
```

Phase 1 creates the bridge between both worlds: behavior inventory, table mapping, visual/style inventory, clean-start seed decision, and test checklist.

Clean-start data rule:

```text
For production cutover:
  1. Do not migrate `.artemis-data/artemis.db`.
  2. Do not expose legacy `POST /api/state`.
  3. Retire all legacy `/api/*` routes.
  4. Seed only production-safe starter rows required for smoke tests.
  5. Move old runtime files into `legacy/static-python-demo/` as a backup/reference folder after baseline capture and scaffold compatibility are in place.
```

## Related Code Files

- Modify: `/config/workspace/tiennm99/artemis-demo-agent/docs/project-workflow-tech-stack.md` if migration notes need to update existing docs.
- Read: `/config/workspace/tiennm99/artemis-demo-agent/index.html`
- Read: `/config/workspace/tiennm99/artemis-demo-agent/styles.css`
- Read: `/config/workspace/tiennm99/artemis-demo-agent/app.js`
- Read: `/config/workspace/tiennm99/artemis-demo-agent/server.py`
- Read: `/config/workspace/tiennm99/artemis-demo-agent/assets/`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/docs/migration-behavior-baseline.md`

## Implementation Steps

1. Inventory current user flows:
   - login/domain memory
   - lost report wizard
   - found report wizard
   - matching/radar notifications
   - marketplace browse/search
   - marketplace listing wizard
   - care/interest behavior
   - admin approval/edit/hide/show/reject paths
2. Inventory current data fields from `server.py` tables and `app.js` object shapes.
3. Inventory current API/runtime contracts and apply the accepted compatibility decision:
   - keep `GET /health`
   - keep `POST /invocations`
   - retire all legacy `/api/*` routes, including `/api/state`, after cutover.
4. Create a data mapping draft:

   ```text
   Current JSON payload shape -> Supabase namespaced tables
   lost_items.payload.description -> lost_items.description
   marketplace_items.payload.image -> storage object + listing_images.path
   notifications.payload.domain -> notifications.recipient_profile_id/domain
   ```

5. Extend the mapping to include every payload field that currently drives UI/behavior:
   - marketplace `quantity`, `stockStatus`, `careCount`, `caredBy`, `editCount`, `edited`, `link`, `_autoApproved`
   - notification recipient/broadcast/read metadata
   - timestamps needed for production flow
   - image data URL references.
6. Inventory visual identity and asset style references:
   - `assets/moon.png`
   - `assets/rocket.png`
   - `assets/cloud.png`
   - `assets/asteroid-left.png`
   - `assets/asteroid-right.png`
   - `assets/care-star.png`
   - `assets/trade-station.png`
   - `assets/lost-signal.png`
   - `assets/found-beacon.png`
   - `assets/expected layout-01.jpg`
   - `assets/SVN-Cookies.ttf`
   - key CSS variables and animations
   - Artemis/radar/moon/cloud/rocket microcopy
   - current footer attribution expectation
   - line style, texture, color, depth, cutout style, glow, shadows, and motion language needed to recreate all production assets.
7. Define parity smoke paths that must pass after migration, including two-browser freshness for match notifications and admin pending queues.
8. Set the temporary legacy strategy:
   - move old root demo files into `legacy/static-python-demo/` after baseline capture and after SvelteKit routes plus compatibility handlers pass
   - keep the folder readable as backup/reference material until cutover is accepted
   - keep it out of the production route/runtime path.
9. Document known demo-only behaviors that must not survive as production behavior:
   - localStorage auth fallback
   - hardcoded admin domain only
   - base64 image persistence
   - unprotected mutation routes
   - whole-state polling.
10. Add the auth/admin decision gate:
    - Supabase Google OAuth selected
    - verified Google email required
    - domain-style profile names are metadata only
    - `minhtienit99@gmail.com` and `minhnguyetawf@gmail.com` mapped to explicit auth user UUID/email after first sign-in or admin bootstrap
    - privileged domains reserved and not self-claimable.
11. Add the namespace decision gate:
    - production Supabase schema selected: `artemis`
    - preview Supabase schema selected: `artemis_preview`
    - storage bucket prefixes selected per environment
    - no table/bucket names collide with other projects in the shared Supabase instance.

## Todo List

- [x] Current flow inventory completed.
- [x] Current data shape mapped to proposed tables.
- [x] Current HTTP/runtime compatibility matrix completed.
- [x] Clean-start data/drop policy documented.
- [x] Visual identity inventory completed.
- [x] Auth/admin bootstrap decision gate documented.
- [x] Supabase namespace decision documented.
- [x] Legacy backup folder decision documented: old demo code moves to `legacy/static-python-demo/` for reference.
- [x] Migration baseline doc created.
- [ ] Parity smoke checklist approved.

## Success Criteria

- [x] Baseline doc exists and lists all current user/admin flows.
- [x] Every current API object maps to a target Supabase table, seed value, or explicit deprecated field.
- [x] Every current runtime contract is marked keep or retire.
- [ ] Legacy `/api/state` import cannot exist in production.
- [x] Visual preservation checklist names required motifs, recreated assets, font decision, animation, copy tone, and footer attribution.
- [ ] Baseline screenshots exist for login/account, first viewport, moon/radar, marketplace cloud cards, listing wizard, notification panel, footer, mobile, and both admin routes.
- [x] Legacy backup path is explicit, with old static/Python demo files planned for `legacy/static-python-demo/` rather than deletion.
- [x] Implementation can proceed without guessing which current behaviors matter.

## Risk Assessment

- Risk: rewrite accidentally removes charm and becomes generic. Mitigation: visual inventory becomes acceptance criteria in Phase 5.
- Risk: current data shape hidden in large `app.js`. Mitigation: map both frontend object fields and backend table payloads.
- Risk: `/api/state` can overwrite SQLite during coexistence. Mitigation: do not implement it in the new production app; move legacy runtime into `legacy/static-python-demo/` only after baseline capture and scaffold compatibility are ready.
- Risk: too much legacy behavior preserved. Mitigation: label security/demo shortcuts as deprecated.

## Security Considerations

- Current admin gating and localStorage auth are demo-only. The migration must replace them with Supabase Auth and server-side role checks.
