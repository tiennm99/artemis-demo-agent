---
phase: 3
title: "Supabase Data Auth Storage"
status: pending
priority: P1
dependencies: [1, 2]
effort: "high"
---

# Phase 3: Supabase Data Auth Storage

## Context Links

- Research report: `../reports/research-260622-artemis-professional-stack.md`
- Supabase SSR auth client: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase standard uploads: https://supabase.com/docs/guides/storage/uploads/standard-uploads

## Overview

Replace SQLite JSON payload storage with namespaced Supabase schemas, Google OAuth session handling, scoped admin roles, lightweight admin action logging, private object storage for images, and clean seed data.

## Requirements

- Functional: define Postgres migrations for identity, lost/found, marketplace, notifications, admin roles, and admin actions.
- Functional: configure Supabase Google OAuth integration for SvelteKit SSR.
- Functional: reject authenticated users without a verified Google email.
- Functional: create private Storage buckets and policies for report/listing images.
- Functional: enable RLS on exposed tables and write policies for user/admin access.
- Functional: preserve current UI payload flexibility through JSONB plus indexed columns until parity is verified.
- Functional: define server-only matching access so RLS does not force public report reads.
- Functional: isolate all Artemis tables/functions/buckets from other projects sharing the same Supabase project.
- Non-functional: keep schema portable for future Supabase self-hosting.
- Non-functional: avoid base64 image storage in DB.

## Architecture

Recommended namespace:

```text
production schema: artemis
preview schema: artemis_preview
production storage bucket prefix: artemis
preview storage bucket prefix: artemis_preview
server helper schema selection: explicit, never implicit public schema
```

Recommended schema groups:

```text
artemis or artemis_preview schema
  profiles
  lost_items
  found_items
  match_candidates
  marketplace_listings
  marketplace_listing_images
  marketplace_interests
  notifications
  admin_roles
  admin_actions
```

MVP parity rule:

```text
Use typed/indexed columns for core query fields.
Use `payload jsonb` for current-flow parity fields until Phase 7 proves parity.
Normalize or drop payload fields only after tests prove no UI/workflow depends on them.
```

Required constraints and keys:

```text
admin_roles(profile_id, scope) unique
match_candidates(lost_item_id, found_item_id) unique
notifications/deliveries unique delivery key
marketplace_interests(listing_id, profile_id) unique
```

Storage buckets:

```text
artemis-report-images private
artemis-marketplace-images private
```

Upload model:

```text
SvelteKit server checks session
  -> validates image MIME, size, count, and record ownership
  -> writes small image to Supabase Storage through a server-only helper
  -> stores canonical object path + metadata on the related record
  -> resolves display URLs through one helper
```

Use private buckets. Use signed URLs or server-mediated reads for private images. Store canonical object path and resolve URLs through one helper so render/match behavior does not depend on raw signed URL lifetime. Direct browser signed uploads and cleanup jobs are hardening, not MVP.

Auth/admin bootstrap:

```text
profiles.id = auth.users.id
profiles.email = verified Google email
profiles.auth_provider = google
profiles.domain = unique display/business identifier, not authority
admin_roles.profile_id = immutable auth user id
reserved domains like artemis_8920 cannot be self-claimed
seed admin roles for minhtienit99@gmail.com and minhnguyetawf@gmail.com after auth user exists
```

## Related Code Files

- Create: `/config/workspace/tiennm99/artemis-demo-agent/supabase/migrations/`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/supabase/seed.sql`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/supabase/client.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/auth/session.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/auth/admin-roles.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/repositories/lost-found.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/repositories/marketplace.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/repositories/notifications.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/repositories/admin-actions.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/storage/image-storage.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/server/domain/lost-found/server-only-matching.ts`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/shared/types/database.ts`
- Modify: `/config/workspace/tiennm99/artemis-demo-agent/.env.example`

## Implementation Steps

1. Design enums:
   - report status: `open`, `matched`, `returned`, `closed`, `hidden`
   - listing status: `pending`, `approved`, `rejected`, `hidden`, `passed`
   - notification type: `radar`, `match`, `marketplace`, `admin`
   - admin scope: `vutrudodac`, `phienchotrenmay`, `global`
2. Configure and document auth UX before creating schema:
   - Supabase Google OAuth only
   - verified email required
   - no email/password, magic link, localStorage fallback, or arbitrary domain username login.
3. Create namespace migration:
   - create `artemis` schema for production
   - create `artemis_preview` schema for preview
   - ensure helpers query the configured schema, not `public.*`
   - set grants/RLS only for Artemis objects
   - avoid table/function/bucket collisions with other projects in the shared Supabase instance.
4. Create migrations for core tables with UUID PKs, owner profile IDs, verified email/profile metadata, timestamps, soft visibility fields, foreign keys, and `payload jsonb` for parity fields.
5. Add indexes:
   - lost/found owner/status/date
   - listing status/category/owner
   - notifications recipient/read/type
   - admin role profile/scope
6. Add constraints:
   - unique admin role per profile/scope
   - unique marketplace interest per listing/profile
   - unique match candidate per lost/found pair
   - unique notification delivery key.
7. Add lightweight `admin_actions` rows for admin moderation and sensitive state transitions. Defer separate audit schema/export retention until hardening.
8. Enable RLS on every exposed table.
9. Add policies:
   - users can read their own private records
   - users can create their own reports/listings
   - authenticated Google users can read approved marketplace listings
   - admins can moderate only their scoped domain
   - admin action logs are server/admin read only
   - notifications are recipient-only unless explicitly broadcast
   - matched counterparties see only the contact/detail projection required for handoff.
10. Define server-only matching:
   - matching service can scan minimal opposite-side report columns with service role/RPC
   - normal user reads cannot enumerate all reports or contacts
   - match candidates and notifications are written in one idempotent workflow.
11. Create private Storage buckets and server-mediated upload helpers:
   - size limits in app validation
   - image MIME allowlist
   - owner path convention like `{profile_id}/{record_id}/{file_name}`
   - bucket names use the configured namespace/prefix
   - server-generated canonical object path
   - signed/private URL resolver only
   - manual cleanup note for abandoned uploads.
12. Add SvelteKit Supabase SSR client creation with cookies.
13. Add server-only repository functions that wrap Supabase queries and normalize errors. Repository APIs must:
   - accept `actorUserId` from server session
   - read verified email from session/profile
   - enforce verified Google OAuth before mutations
   - select the configured Artemis schema explicitly
   - strip owner/admin/recipient fields from client payloads.
14. Add notification delivery/read model:
   - recipient profile
   - optional broadcast scope
   - `read_at`
   - mark-read action support.
15. Add clean seed data:
   - seed admin role records for `minhtienit99@gmail.com` and `minhnguyetawf@gmail.com` once matching auth users exist
   - default both admin emails to `global` or both product scopes
   - production-safe sample categories/statuses only if needed for smoke tests
   - no imported SQLite rows
   - no legacy base64 images.

Example migration sketch:

```sql
create schema if not exists artemis;
create schema if not exists artemis_preview;

create table artemis.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  auth_provider text not null default 'google' check (auth_provider = 'google'),
  display_name text,
  domain text unique,
  created_at timestamptz not null default now()
);

alter table artemis.profiles enable row level security;
```

## Todo List

- [ ] Supabase migration files created.
- [ ] `artemis` production schema and `artemis_preview` preview schema created and documented.
- [ ] RLS enabled on exposed tables.
- [ ] Google OAuth and verified email enforcement defined.
- [ ] Admin role model supports separate product admins.
- [ ] `minhtienit99@gmail.com` and `minhnguyetawf@gmail.com` admin bootstrap defined.
- [ ] Admin roles key to immutable auth user IDs, not domain strings.
- [ ] Current-flow parity fields retained in JSONB until parity passes.
- [ ] Server-only matching boundary defined.
- [ ] Notification delivery/read model defined.
- [ ] Marketplace interest unique constraint defined.
- [ ] Server-mediated image upload and URL resolver model defined.
- [ ] Private storage buckets and path conventions defined.
- [ ] Clean seed data defined; legacy SQLite import explicitly excluded.
- [ ] SSR Supabase client helper added.
- [ ] Server-only repositories created.
- [ ] Seed data added for production smoke tests.

## Success Criteria

- [ ] Local Supabase migration can apply cleanly.
- [ ] Hosted Supabase project can apply the same migrations.
- [ ] All Artemis tables live under `artemis` or `artemis_preview` and do not collide with shared Supabase projects.
- [ ] No table grants allow anon/authenticated access without RLS policy.
- [ ] Users without verified Google OAuth email are denied before app access or mutation.
- [ ] Images are represented as storage paths and metadata, not base64 DB fields.
- [ ] Small image uploads are mediated by server-only helpers with MIME, size, count, and path validation.
- [ ] Image buckets are private and never require public object URLs.
- [ ] Admin access is scoped for `/vutrudodac/admin` and `/phienchotrenmay/admin`.
- [ ] Matching can find opposite-side reports without exposing private report tables to normal users.
- [ ] Service-role writes never trust owner/admin/recipient IDs from client payloads.
- [ ] Interest toggles, match candidates, and notification deliveries are idempotent.

## Risk Assessment

- Risk: RLS policies become too complex. Mitigation: keep writes in SvelteKit server handlers first, use RLS as defense-in-depth.
- Risk: normalized schema drops current UI behavior. Mitigation: keep `payload jsonb` plus indexed columns until parity tests pass.
- Risk: Free-tier storage/egress limits hit early. Mitigation: cap image size/count, document Supabase Pro upgrade trigger.
- Risk: auth UX changes after schema work starts. Mitigation: complete the Phase 1 auth/admin decision gate first; keep domain as profile metadata and never as admin authority.
- Risk: shared Supabase project object collisions or policy bleed. Mitigation: use explicit schema/bucket namespace and test no queries use unqualified public tables.
- Risk: private storage breaks rendering when signed URLs expire. Mitigation: central URL resolver and refresh on server load.

## Security Considerations

- Never expose service role key to browser.
- Use server-side role checks for admin routes and admin actions.
- Validate Google OAuth identity and verified email server-side before creating profile or accepting mutations.
- Derive owner, actor, recipient, and admin identity from the server session, never from hidden fields or request payloads.
- Log admin mutations to `admin_actions`.
- Validate MIME type and file size before accepting image metadata.
