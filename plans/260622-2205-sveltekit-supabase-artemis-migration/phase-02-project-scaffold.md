---
phase: 2
title: "Project Scaffold"
status: pending
priority: P1
dependencies: [1]
effort: "medium"
---

# Phase 2: Project Scaffold

## Context Links

- Phase 1 baseline: `phase-01-migration-baseline.md`
- SvelteKit Vercel adapter: https://svelte.dev/docs/kit/adapter-vercel
- Vercel SvelteKit guide: https://vercel.com/docs/frameworks/full-stack/sveltekit

## Overview

Create the SvelteKit application structure in this repo without losing the existing demo artifacts. The scaffold should support SSR/session auth, route groups for both product surfaces, Vercel deployment, and an early Artemis visual shell so theme preservation starts before route work.

## Requirements

- Functional: initialize SvelteKit with TypeScript.
- Functional: configure Vercel adapter.
- Functional: create route structure for intro, both apps, both admin areas, and account/auth pages.
- Functional: preserve current static assets as style references; ship recreated production assets under a SvelteKit-compatible static path.
- Functional: port the global Artemis font/CSS shell and public footer placeholder early, before feature routes are fully rebuilt.
- Functional: add `/health` and `/invocations` handlers or stubs early so deployment compatibility can be tested throughout migration.
- Functional: define legacy runtime mode so current Python API, `/health`, and `/invocations` remain recoverable until cutover.
- Non-functional: keep implementation modular; no new Go service in this phase.
- Non-functional: keep current demo runnable until cutover or archive point.

## Architecture

Target folder shape:

```text
src/
  app.html
  hooks.server.ts
  lib/
    server/
      supabase/
      auth/
      repositories/
    shared/
      constants/
      types/
    ui/
      artemis-theme/
      components/
  routes/
    +layout.server.ts
    +layout.svelte
    +page.svelte
    account/
    vutrudodac/
      +page.svelte
      admin/
    phienchotrenmay/
      +page.svelte
      admin/
    health/
      +server.ts
    invocations/
      +server.ts
static/
  assets/
    artemis/
      generated/
      reference-notes/
supabase/
  migrations/
  seed.sql
tests/
  e2e/
```

SvelteKit owns routing and server actions. Supabase client helpers are centralized in `src/lib/server/supabase`.

## Related Code Files

- Create: `/config/workspace/tiennm99/artemis-demo-agent/package.json`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/pnpm-lock.yaml`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/svelte.config.js`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/vite.config.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/tsconfig.json`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/static/assets/artemis/`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/ui/artemis-theme/`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/health/+server.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/invocations/+server.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/supabase/`
- Modify: `/config/workspace/tiennm99/artemis-demo-agent/.gitignore`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/.env.example`
- Modify: `/config/workspace/tiennm99/artemis-demo-agent/README.md`
- Preserve until cutover: `/config/workspace/tiennm99/artemis-demo-agent/index.html`
- Preserve until cutover: `/config/workspace/tiennm99/artemis-demo-agent/styles.css`
- Preserve until cutover: `/config/workspace/tiennm99/artemis-demo-agent/app.js`
- Preserve until cutover: `/config/workspace/tiennm99/artemis-demo-agent/server.py`

## Implementation Steps

1. Choose package manager. Prefer `pnpm` unless repo already standardizes another Node package manager during implementation.
2. Scaffold SvelteKit with TypeScript.
3. Install required runtime packages:

   ```bash
   pnpm add @supabase/supabase-js @supabase/ssr
   pnpm add -D @sveltejs/adapter-vercel svelte-check vitest @playwright/test
   ```

4. Configure `svelte.config.js` with `@sveltejs/adapter-vercel`.
5. Add route placeholders:
   - `/`
   - `/account`
   - `/vutrudodac`
   - `/vutrudodac/admin`
   - `/phienchotrenmay`
   - `/phienchotrenmay/admin`
6. Add early compatibility handlers:
   - `GET /health`
   - `POST /invocations` with the legacy response shape or a documented temporary placeholder.
7. Do not blindly ship current `assets/` as production art. Keep them as reference inputs until Phase 5 recreates production-owned assets.
8. Port the global CSS/font/background shell with minimum transformation:
   - font decision: keep `SVN-Cookies.ttf` only if license is production-safe, otherwise replace with a Vietnamese-safe display font matching the current tone
   - galaxy background style
   - moon/rocket/cloud asset slots using recreated assets when available
   - footer placeholder for public routes.
9. Add `src/lib/shared/types` for domain DTOs.
10. Add `src/lib/server/supabase` helpers for SSR cookies and service-role-only server operations.
11. Add `.env.example` with names and non-secret defaults only:

   ```text
   PUBLIC_SUPABASE_URL=
   PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ARTEMIS_ENV=preview
   ARTEMIS_SUPABASE_SCHEMA=artemis_preview
   ARTEMIS_AUTH_PROVIDER=google
   ARTEMIS_ADMIN_EMAILS=minhtienit99@gmail.com,minhnguyetawf@gmail.com
   ARTEMIS_STORAGE_BUCKET_PREFIX=artemis_preview
   ```

12. Update `.gitignore` so examples are committed while real env files stay ignored:

   ```text
   .env
   .env.*
   !.env.example
   !.env.*.example
   ```

13. Define legacy mode in README:
   - how to run current Python/SQLite demo
   - whether legacy files live at repo root during migration or move to `legacy/static-python-demo/`
   - how `/health` and `/invocations` are preserved
   - that all legacy `/api/*` routes, including `/api/state`, are retired in the production app.
14. Update README with new local dev commands while keeping legacy demo commands until cutover.

## Todo List

- [ ] SvelteKit scaffold created.
- [ ] Vercel adapter configured.
- [ ] Supabase SSR packages installed.
- [ ] Route placeholders created.
- [ ] `/health` and `/invocations` handlers or stubs created.
- [ ] Recreated asset folder structure available in SvelteKit static path.
- [ ] Global Artemis CSS/font/footer shell available in SvelteKit.
- [ ] Google OAuth, admin email, and Supabase namespace env names documented.
- [ ] `.env.example` added without secrets.
- [ ] `.gitignore` allows env examples but ignores real env values.
- [ ] Legacy runtime mode documented.
- [ ] Legacy demo path preserved or explicitly archived after approval.

## Success Criteria

- [ ] `pnpm dev` starts the SvelteKit app locally.
- [ ] `pnpm build` succeeds.
- [ ] All planned routes render placeholder pages.
- [ ] `/health` and `/invocations` are reachable in local SvelteKit dev mode.
- [ ] Original assets remain available as references until recreated production assets are accepted.
- [ ] First viewport uses the original Artemis theme assets rather than a generic placeholder.
- [ ] Existing legacy demo remains recoverable until Phase 7.
- [ ] Fresh checkout includes `.env.example`.

## Risk Assessment

- Risk: root-level `index.html` conflicts with Vite/SvelteKit expectations. Mitigation: scaffold carefully and archive legacy files only after baseline capture.
- Risk: env vars accidentally committed. Mitigation: commit `.env.example`, ignore `.env*` except examples.
- Risk: mixed old/new code confuses maintainers. Mitigation: README states migration state and active dev commands.

## Security Considerations

- `SUPABASE_SERVICE_ROLE_KEY` must only be used in server-only modules.
- Public env vars must be limited to Supabase URL and anon key.
