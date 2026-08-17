# Artemis Cutover Checklist

## Before Preview

- [ ] Supabase project exists.
- [ ] `artemis_preview` schema migrated.
- [ ] Preview private buckets exist.
- [ ] Google OAuth redirect URL points to preview `/account`.
- [ ] Vercel preview env vars configured.
- [ ] `npm run check` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.

## Before Production

- [ ] `artemis` schema migrated.
- [ ] Production private buckets exist.
- [ ] Google OAuth redirect URL points to production `/account`.
- [ ] `minhtienit99@gmail.com` signed in once.
- [ ] `minhnguyetawf@gmail.com` signed in once.
- [ ] `supabase/seed.sql` ran for admin roles.
- [ ] `/health` returns ok.
- [ ] `/invocations` returns compatible JSON.
- [ ] `/api/state` returns retired `410`.
- [ ] Lost report action works.
- [ ] Found report action works.
- [ ] Match notification appears within 15-30 seconds after refresh/poll.
- [ ] Marketplace listing enters pending queue.
- [ ] Marketplace admin can approve/reject/hide/show.
- [ ] Non-admin cannot access admin routes.
- [ ] Image upload stores only private storage metadata in DB.
- [ ] Footer attribution visible.
- [ ] Mobile 375px layout has no overlap.

## Clean Start

- [ ] No SQLite rows imported.
- [ ] No base64 legacy images imported.
- [ ] Seed data limited to approved admin/profile/bootstrap rows.
- [ ] Legacy Python/SQLite runtime backed up under `legacy/static-python-demo/`.
- [ ] Root production path uses SvelteKit only.

## Unresolved Questions

- Who owns final production recreation of current reference assets?
- Which Vercel plan will production use?
- When should daily abuse caps become database-enforced quota checks instead of MVP constants?
