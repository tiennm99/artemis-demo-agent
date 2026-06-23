# Artemis

Artemis is a SvelteKit + Supabase app for two internal Starter flows:

- `Vũ trụ đồ đạc`: lost/found signals, radar matching, notifications.
- `Phiên chợ trên mây`: marketplace listings, care stars, scoped moderation.

The old static Python/SQLite demo is kept only as backup/reference under `legacy/static-python-demo/`.

## Stack

- SvelteKit on Vercel
- Supabase Auth with Google OAuth only
- Supabase Postgres schemas: `artemis` and `artemis_preview`
- Private Supabase Storage buckets for report/listing images
- Server-side SvelteKit actions for mutations

## Routes

```text
/
/account
/vutrudodac
/phienchotrenmay
/vutrudodac/admin
/phienchotrenmay/admin
/health
/invocations
```

Legacy `/api/*`, including `/api/state`, is intentionally retired and returns `410`.

## Local

```bash
pnpm install
pnpm dev
```

Open:

```text
http://127.0.0.1:5173/
```

Without Supabase env vars, the app uses a local in-memory dev fallback. This is only for development.

## Environment

Copy `.env.example` to local env if using Supabase:

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

## Supabase

Apply:

```text
supabase/migrations/202606230001_artemis_core.sql
supabase/seed.sql
```

Run `seed.sql` only after the two admin Google accounts signed in once.

## Validate

```bash
pnpm check
pnpm test
pnpm build
```

`pnpm test:e2e` is available for Playwright smoke coverage, but the current migration pass does not require running it.

## Docs

- `docs/deployment-guide.md`
- `docs/cutover-checklist.md`
- `docs/design-guidelines.md`
- `docs/migration-behavior-baseline.md`

## Attribution

Footer must keep:

```text
Made by miti99 (miti99.com) from artemis (iamminhnguyet.com) idea, with <3
```
