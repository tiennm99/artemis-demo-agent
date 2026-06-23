## Finding 1: Auth bridge is unresolved while schema assumes Supabase user identity
- **Severity:** Critical
- **Location:** Phase 3, section "Implementation Steps / Example migration sketch"
- **Flaw:** The plan leaves v1 login mode open, but Phase 3 already anchors `profiles.id` to `auth.users(id)` and Phase 4 assumes Supabase login/profile redirects. Current identity is domain/password plus browser fallback, not Supabase auth.
- **Failure scenario:** Existing users log in as `nguyetntm5` today. After migration, their old lost/found rows, notifications, marketplace ownership, and admin scope cannot attach to `auth.users.id` unless a domain-to-auth-user provisioning/backfill path exists. RLS "own records" then blocks legitimate users or forces unsafe domain matching.
- **Evidence:** `plan.md:123`, `phase-03-supabase-data-auth-storage.md:117-123`, `phase-04-domain-routes-and-server-actions.md:100-103`, `README.md:158`, `app.js:1556-1592`, `server.py:147-165`
- **Suggested fix:** Decide auth mode before schema work. Add explicit domain ownership/provisioning, old user migration, uniqueness rules, admin bootstrap, and rollback for failed auth linking.

## Finding 2: Data loss prevention is asserted, not planned
- **Severity:** Critical
- **Location:** Phase 1, section "Requirements / Implementation Steps"
- **Flaw:** The plan says avoid data loss while SQLite and Supabase coexist, but only asks for a mapping draft. There is no export/import procedure, write freeze, dual-write window, delta migration, ID mapping, count validation, or rollback.
- **Failure scenario:** Phase 1 captures a baseline. The Python demo remains live. A Starter submits a lost report or marketplace item after baseline and before cutover. Phase 7 "migrate or seed" runs without a delta source, so that record, its base64 image, notifications, and match state vanish from Supabase.
- **Evidence:** `phase-01-migration-baseline.md:34`, `phase-01-migration-baseline.md:81-86`, `phase-07-validation-and-cutover.md:28`, `README.md:44`, `app.js:437-451`, `app.js:469-475`, `server.py:509-525`, `server.py:513-519`
- **Suggested fix:** Add a dedicated migration phase: freeze writes or dual-write, export SQLite JSON tables, transform payloads and base64 images, backfill Supabase IDs, validate source/target counts, run a delta pass, and define rollback.

## Finding 3: RLS policy blocks matching, or matching leaks private reports
- **Severity:** Critical
- **Location:** Phase 3, section "Implementation Steps"
- **Flaw:** Phase 3 says users can read only their own private records, while Phase 4 requires match computation on submitted lost/found reports. The current algorithm needs to scan all opposite-side reports. The plan never defines a server-only matching boundary that can see private rows without exposing them to the browser.
- **Failure scenario:** User A creates a found report. If the SvelteKit action uses the user's RLS-scoped Supabase client, it cannot see User B's lost report, so no match/notification fires. If the browser or public policy can read all reports to preserve matching, contacts and item details leak across users.
- **Evidence:** `phase-03-supabase-data-auth-storage.md:101-106`, `phase-04-domain-routes-and-server-actions.md:104-110`, `app.js:642-673`, `server.py:168-177`
- **Suggested fix:** Define matching as a server-only service or Postgres RPC using service role/minimal column access. It should write `match_candidates` and recipient notifications while keeping report reads scoped for normal users.

## Finding 4: Notification read state has no durable model
- **Severity:** High
- **Location:** Phase 4, section "Implementation Steps"
- **Flaw:** The plan creates notifications and optional badge polling, but does not model per-recipient read/unread state, broadcast recipients, or a mark-read action. Current read state is an in-payload `readBy` array mutated in browser memory.
- **Failure scenario:** A migrated user opens notifications. Without a `read_at`/delivery row or mark-read server action, the badge either never clears, clears for every recipient by mutating a shared row, or loses broadcast `recipientDomain="*"` behavior.
- **Evidence:** `phase-03-supabase-data-auth-storage.md:95-98`, `phase-04-domain-routes-and-server-actions.md:127-130`, `app.js:1281-1327`, `server.py:345-362`, `server.py:501-503`
- **Suggested fix:** Add `notification_deliveries` or `notification_recipients` with `recipient_profile_id`, `read_at`, broadcast semantics, unique delivery keys, and explicit mark-read action.

## Finding 5: Marketplace interest state will race and drift
- **Severity:** High
- **Location:** Phase 3, section "Architecture / Implementation Steps"
- **Flaw:** The plan names `marketplace_interests`, but never requires a unique constraint, atomic toggle, denormalized counter policy, or idempotent owner notification. Current care state is duplicated as `caredBy[]`, `careCount`, and `userMemory.interests`, then persisted via full-item PATCH.
- **Failure scenario:** Same user double-clicks care from two tabs. One request inserts interest and one removes or overwrites stale payload. The UI count, interest row, and owner notifications disagree. Admin sees wrong demand signal; owner gets duplicate "interest" notes.
- **Evidence:** `phase-03-supabase-data-auth-storage.md:43-45`, `phase-03-supabase-data-auth-storage.md:94-98`, `phase-04-domain-routes-and-server-actions.md:111-116`, `app.js:1903-1917`, `server.py:280-311`
- **Suggested fix:** Require `unique(listing_id, profile_id)`, transactional toggle/upsert/delete, derived count via query/view/trigger, and notification dedupe keyed by listing/user/action.

## Finding 6: Private Storage upload flow is underspecified and will fail closed or open
- **Severity:** High
- **Location:** Phase 3, section "Architecture / Implementation Steps"
- **Flaw:** Phase 3 says use private buckets and has the browser upload directly after a server session check, but it does not define signed upload URLs, upload intents, path authorization, finalize semantics, or orphan cleanup. Current app stores image data URLs in DB payloads.
- **Failure scenario:** With private buckets and strict policies, browser upload returns 401. If policies are loosened so authenticated users can upload, a user can write arbitrary paths or overwrite another record's object. If upload succeeds and DB insert fails, orphaned images remain with no cleanup path.
- **Evidence:** `phase-03-supabase-data-auth-storage.md:61-70`, `phase-03-supabase-data-auth-storage.md:107-110`, `phase-04-domain-routes-and-server-actions.md:108`, `phase-04-domain-routes-and-server-actions.md:113`, `app.js:1399-1428`, `server.py:201-211`, `server.py:260-270`
- **Suggested fix:** Specify upload intent flow: server creates draft row and signed path, Storage policy enforces `auth.uid()/record_id`, finalize action stores metadata, failed drafts clean objects, and old base64 images get migrated or explicitly dropped.

## Finding 7: Preserving legacy files does not preserve the legacy runtime
- **Severity:** High
- **Location:** Phase 2, section "Requirements / Related Code Files"
- **Flaw:** Phase 2 says keep the current demo runnable and preserve `index.html`, `styles.css`, `app.js`, and `server.py`. That is not enough. The current demo depends on Python routes such as `/api/state`, `/api/auth/login`, `/health`, and `/invocations`; a SvelteKit/Vercel scaffold at root will not serve those unless explicitly ported or isolated.
- **Failure scenario:** After scaffolding, `pnpm dev` serves SvelteKit. Someone opens the preserved static demo for rollback. Its `fetch("/api/state")` and `fetch("/api/auth/login")` calls fail, AgentBase `/health`/`/invocations` compatibility is gone, and the "legacy demo remains recoverable" acceptance criterion is false.
- **Evidence:** `phase-02-project-scaffold.md:29`, `phase-02-project-scaffold.md:84-87`, `README.md:42-50`, `README.md:65`, `app.js:119-126`, `server.py:553-609`
- **Suggested fix:** Define a real legacy mode: separate branch/worktree, `legacy/static-python-demo/` with its own run command and Python API, or explicit SvelteKit compatibility endpoints until cutover.

## Finding 8: Planned env example will be ignored by git
- **Severity:** Medium
- **Location:** Phase 2, section "Implementation Steps"
- **Flaw:** Phase 2 requires `.env.example`, and Phase 6 requires documenting Supabase env vars, but current `.gitignore` ignores `.env.*`. Without an explicit negation, `.env.example` will be untracked and absent from the repo.
- **Failure scenario:** Implementer creates `.env.example` with `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Git silently ignores it. Vercel setup docs claim env examples exist, but a fresh checkout has none, so deployment setup fails or relies on tribal knowledge.
- **Evidence:** `phase-02-project-scaffold.md:111-117`, `phase-02-project-scaffold.md:128`, `phase-02-project-scaffold.md:141-142`, `phase-06-deployment-and-operations.md:85-88`, `.gitignore:10-11`
- **Suggested fix:** Make the `.gitignore` change explicit: keep `.env` and `.env.*` ignored, then add `!.env.example` and any required `!.env.*.example` pattern. Add `.env.example` to Phase 2 related files.

Status: DONE_WITH_CONCERNS
Summary: Plan has blocking assumptions around identity, data migration, RLS matching, notifications, interest state, storage, and legacy runtime lifecycle. It should not proceed to implementation until these are converted into explicit phases, schema constraints, and cutover checks.
Concerns/Blockers: Auth mode and data migration are unresolved blockers.
