---
phase: 6
title: "Deployment And Operations"
status: pending
priority: P2
dependencies: [2, 3, 4, 5]
effort: "medium"
---

# Phase 6: Deployment And Operations

## Context Links

- Vercel SvelteKit guide: https://vercel.com/docs/frameworks/full-stack/sveltekit
- SvelteKit adapter Vercel: https://svelte.dev/docs/kit/adapter-vercel
- Supabase hosted project docs: https://supabase.com/docs

## Overview

Prepare the SvelteKit + Supabase app for Vercel preview and small-production deployment. For under 5k MAU, keep this phase focused on deployability, env docs, basic enforced caps, private storage, namespace isolation, and rollback notes. Keep self-hosting possible later, but do not take on self-hosted operations in this migration.

## Requirements

- Functional: configure Vercel build/deploy for SvelteKit.
- Functional: document Supabase env vars and deployment setup.
- Functional: define and enforce basic storage/image limits for small production.
- Functional: add health/readiness checks where useful.
- Functional: define `/health` and `/invocations` deployment behavior.
- Functional: enforce cheap production abuse limits, not a full abuse platform.
- Functional: document Google OAuth setup and verified-email enforcement.
- Functional: document Supabase Artemis namespace and private bucket setup.
- Non-functional: avoid secrets in git, logs, screenshots, or docs.
- Non-functional: maintain an exit path to self-hosted Supabase or a Go service later.

## Architecture

Deployment shape:

```text
Vercel
  SvelteKit SSR app
  form actions
  route handlers

Supabase hosted
  Auth
  Postgres
  Storage
```

Operational rule:

```text
Vercel owns web runtime.
Supabase owns durable data and images.
No Vercel filesystem persistence.
No SQLite in production.
Compatibility endpoints either live in SvelteKit or are explicitly retired. Production keeps `/health` and `/invocations`; all legacy `/api/*` routes are retired.
```

## Related Code Files

- Create: `/config/workspace/tiennm99/artemis-demo-agent/vercel.json` if needed.
- Create: `/config/workspace/tiennm99/artemis-demo-agent/docs/deployment-guide.md`
- Modify: `/config/workspace/tiennm99/artemis-demo-agent/svelte.config.js`
- Modify: `/config/workspace/tiennm99/artemis-demo-agent/package.json`
- Modify: `/config/workspace/tiennm99/artemis-demo-agent/README.md`
- Modify: `/config/workspace/tiennm99/artemis-demo-agent/.gitignore`
- Read: `/config/workspace/tiennm99/artemis-demo-agent/Dockerfile`

## Implementation Steps

1. Confirm `@sveltejs/adapter-vercel` is configured.
2. Add build scripts:

   ```json
   {
     "scripts": {
       "dev": "vite dev",
       "build": "vite build",
       "preview": "vite preview",
       "check": "svelte-kit sync && svelte-check",
       "test": "vitest run",
       "test:e2e": "playwright test"
     }
   }
   ```

3. Document required Vercel env vars:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ARTEMIS_ENV=production|preview`
   - `ARTEMIS_SUPABASE_SCHEMA=artemis` for production, `artemis_preview` for preview
   - `ARTEMIS_AUTH_PROVIDER=google`
   - `ARTEMIS_ADMIN_EMAILS=minhtienit99@gmail.com,minhnguyetawf@gmail.com`
   - `ARTEMIS_STORAGE_BUCKET_PREFIX=artemis` for production, `artemis_preview` for preview
4. Document Supabase setup:
   - project creation
   - `artemis` production schema creation
   - `artemis_preview` preview schema creation
   - migrations
   - private environment-specific Artemis storage buckets
   - Google OAuth provider setup
   - verified Google email enforcement
   - admin seed users/roles for `minhtienit99@gmail.com` and `minhnguyetawf@gmail.com`
   - RLS verification.
5. Define and enforce small-production limits:
   - max image count per record
   - max image size before upload
   - allowed image MIME types
   - private bucket signed URL lifetime
   - simple cleanup policy for test data and abandoned uploads
   - per-user daily report/listing/interest caps
   - domain/profile signup constraints for privileged names
   - dedupe constraints for repeated submissions.
6. Add deployment guide:
   - local setup
   - preview deployment
   - production deployment
   - rollback
   - Supabase Free only if small-production quota/recovery expectations are accepted
   - Supabase Pro trigger: recovery expectations, usage limits, uptime needs, or internal launch risk become real.
7. Add compatibility deployment checks:
   - `GET /health`
   - `POST /invocations`
   - legacy `/api/*` routes are absent or return intentional retired responses.
8. Decide Docker fate:
   - keep Dockerfile only for legacy AgentBase demo until cutover, or
   - replace with SvelteKit container only if self-host preview needed.

## Todo List

- [ ] Vercel adapter verified.
- [ ] Build/check/test scripts added.
- [ ] Vercel env vars documented.
- [ ] Supabase setup documented.
- [ ] Google OAuth and verified-email enforcement documented.
- [ ] Artemis Supabase namespace and private buckets documented.
- [ ] Small-production image/storage limits documented.
- [ ] Small-production abuse controls enforced in code/schema or explicitly deferred with risk accepted.
- [ ] Deployment guide created.
- [ ] Compatibility endpoints included in deployment smoke checks.
- [ ] Legacy Docker path documented or archived.

## Success Criteria

- [ ] `pnpm build` produces a Vercel-compatible SvelteKit build.
- [ ] A preview deployment can connect to Supabase without secrets leaking.
- [ ] `docs/deployment-guide.md` explains local, preview, production, and rollback.
- [ ] `docs/deployment-guide.md` tells maintainers when to upgrade Supabase Free to Pro.
- [ ] No production flow depends on local disk persistence.
- [ ] Vercel deployment returns expected `/health` and `/invocations` behavior unless AgentBase is explicitly retired.
- [ ] No production image URL requires public Supabase Storage.
- [ ] Legacy `/api/*` routes are not part of production deployment.

## Risk Assessment

- Risk: Vercel Hobby terms mismatch for business/internal use. Mitigation: document the required Vercel plan before production cutover.
- Risk: Supabase Free storage/egress hit early. Mitigation: image limits and Pro upgrade trigger.
- Risk: service role key leak. Mitigation: server-only import boundaries and env docs.
- Risk: attackers exhaust free-tier quotas. Mitigation: enforce Google auth-required mutations, image caps, daily caps, and dedupe constraints before production; defer quota dashboards until hardening.
- Risk: shared Supabase project cross-project leakage. Mitigation: document namespace, private buckets, RLS checks, and schema-qualified repository access.

## Security Considerations

- Never print env values in deployment docs.
- Use Vercel project env vars, not committed env files.
- `.env.example` and `*.example` env files are committed; real `.env*` values are ignored.
- Keep Supabase service role server-only.
- Use least-privilege RLS policies even if SvelteKit server actions own writes.
- Remove legacy wildcard CORS behavior from cookie-authenticated JSON handlers.
- Configure Google OAuth in Supabase and enforce verified email server-side as defense-in-depth. OAuth reduces spam but still requires quotas and dedupe controls.
