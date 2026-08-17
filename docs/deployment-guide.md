# Artemis Deployment Guide

## Runtime

- Web: SvelteKit on Vercel
- Data/Auth/Storage: hosted Supabase
- Production schema: `artemis`
- Preview schema: `artemis_preview`
- Production buckets: `artemis-report-images`, `artemis-marketplace-images`
- Preview buckets: `artemis_preview-report-images`, `artemis_preview-marketplace-images`

No production flow uses SQLite or local filesystem persistence.

## Required Env Vars

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

Use Vercel project env vars. Do not commit real `.env` files.

## Supabase Setup

1. Create hosted Supabase project.
2. Enable Google OAuth provider in Supabase Auth.
3. Configure OAuth redirect URLs for local, preview, and production:
   - `http://127.0.0.1:5173/account`
   - Vercel preview `/account`
   - production `/account`
4. Apply `supabase/migrations/202606230001_artemis_core.sql`.
5. Ask both admin emails to sign in once.
6. Run `supabase/seed.sql`.
7. Confirm RLS is enabled on Artemis tables.
8. Confirm storage buckets are private.

## Local

```bash
npm install
npm run dev
```

Without Supabase env vars, Artemis uses a local in-memory fallback user for development only.

## Preview

Set preview env vars:

```text
ARTEMIS_ENV=preview
ARTEMIS_SUPABASE_SCHEMA=artemis_preview
ARTEMIS_STORAGE_BUCKET_PREFIX=artemis_preview
```

Run smoke:

```bash
npm run check
npm test
npm run build
```

Check:

- `GET /health`
- `POST /invocations`
- `/api/state` returns retired `410`
- Google sign-in redirects correctly
- private image upload succeeds

## Production

Set production env vars:

```text
ARTEMIS_ENV=production
ARTEMIS_SUPABASE_SCHEMA=artemis
ARTEMIS_STORAGE_BUCKET_PREFIX=artemis
```

Cut over only after preview smoke passes and admin seed roles are present.

## Limits

- One image per record
- Max image size: 2MB
- MIME allowlist: JPEG, PNG, WebP, GIF
- Signed URL TTL: 10 minutes
- Daily caps are documented in code constants and enforced at schema/repository hardening stage

## Supabase Pro Trigger

Upgrade from Free when any becomes real:

- recovery expectations matter
- storage/egress approaches free-tier limits
- uptime needs become business-critical
- launch risk makes project pausing unacceptable

## Rollback

Old static/Python demo code remains under `legacy/static-python-demo/` for reference. Rollback means redeploying that legacy runtime separately; do not re-enable legacy `/api/*` in the SvelteKit production app.
