## Finding 1: Legacy state import can wipe and poison data during coexistence
- **Severity:** Critical
- **Location:** Phase 1, section "Requirements"
- **Flaw:** The plan says to avoid data loss while SQLite and Supabase coexist, and to keep the old runtime recoverable, but it never requires disabling or locking the legacy `POST /api/state` import route before migration/cutover.
- **Failure scenario:** During migration, the legacy Python runtime remains live. An attacker sends a cross-origin `POST /api/state` with attacker-controlled JSON. The old backend deletes all lost/found/marketplace/admin/notification rows, imports poisoned records, and that polluted state can then be used as migration/seed input.
- **Evidence:** `phase-01-migration-baseline.md:34` requires avoiding data loss during SQLite/Supabase coexistence; `phase-02-project-scaffold.md:29` requires keeping the current demo runnable; `phase-07-validation-and-cutover.md:52` to `phase-07-validation-and-cutover.md:57` keeps current demo available until validation; `server.py:509` to `server.py:531` implements import by deleting all core tables; `server.py:592` to `server.py:593` exposes it as `POST /api/state`; `server.py:673` to `server.py:676` allows wildcard CORS and unsafe methods.
- **Suggested fix:** Make legacy runtime read-only before coexistence, or protect `/api/state` behind admin-only same-origin auth plus an import secret. Snapshot SQLite before migration. Do not migrate from an unauthenticated state endpoint.

## Finding 2: Admin identity bootstrap is undefined and vulnerable to domain takeover
- **Severity:** Critical
- **Location:** Phase 3, section "Implementation Steps"
- **Flaw:** The plan designs `profiles.domain` and admin role seeding before deciding the actual auth model. Current admin authority is the mutable domain string `artemis_8920`; if the migration keeps domain as authority or lets users edit it, admin can be claimed.
- **Failure scenario:** Attacker signs up first with domain `artemis_8920`, or edits their profile/domain to it after account creation. If `admin_roles` seeding or checks bridge from domain to Supabase profile, the attacker gains marketplace/lost-found moderation.
- **Evidence:** `plan.md:121` to `plan.md:124` leaves login/admin sharing unresolved; `phase-03-supabase-data-auth-storage.md:118` to `phase-03-supabase-data-auth-storage.md:122` sketches `profiles.domain text unique`; `phase-03-supabase-data-auth-storage.md:113` calls for demo admin seed data; `phase-04-domain-routes-and-server-actions.md:100` to `phase-04-domain-routes-and-server-actions.md:103` adds a profile/domain field; `server.py:147` to `server.py:165` auto-creates users by submitted domain; `app.js:299` to `app.js:301` and `app.js:541` to `app.js:542` gate admin by `userMemory.domain === "artemis_8920"`.
- **Suggested fix:** Decide auth before schema. Key `admin_roles` only to immutable `auth.users.id`; seed by explicit UUID/email out of band. Reserve admin domains, block self-service domain changes to privileged values, and test domain-takeover attempts.

## Finding 3: Service-role repository plan can bypass RLS with client-supplied owners
- **Severity:** High
- **Location:** Phase 3, section "Implementation Steps"
- **Flaw:** The plan puts writes through server repositories and treats RLS as defense-in-depth, but it does not require repositories to derive ownership, recipient, and actor from the server session instead of client payloads. With a service-role client, RLS will not save this.
- **Failure scenario:** Attacker submits a lost report, listing, or notification payload with another user's owner/profile/recipient fields. A server action passes that payload into a service-role repository. The row is written as the victim or notification target because the repository trusted the submitted owner fields.
- **Evidence:** `plan.md:48` says writes go through server handlers or scoped policies; `phase-03-supabase-data-auth-storage.md:111` to `phase-03-supabase-data-auth-storage.md:112` adds server-only repositories; `phase-03-supabase-data-auth-storage.md:148` says RLS is defense-in-depth because server handlers own writes; `phase-04-domain-routes-and-server-actions.md:105` to `phase-04-domain-routes-and-server-actions.md:116` creates user mutation actions; `server.py:201` to `server.py:211`, `server.py:227` to `server.py:237`, and `server.py:350` to `server.py:356` currently store domain/contact/recipient directly from request payloads.
- **Suggested fix:** Repository APIs must accept `actorUserId` from the validated server session and strip all owner/admin/recipient identity fields from request bodies. Use a non-service-role user client where possible. Add malicious-owner tests for every mutation.

## Finding 4: Lost/found and notification privacy contract is missing
- **Severity:** High
- **Location:** Phase 3, section "Implementation Steps"
- **Flaw:** The plan says users can read their own private records and public users can read approved marketplace listings, but it never defines the read contract for lost/found reports, match candidates, or notifications. Current behavior exposes all of them through global state.
- **Failure scenario:** Implementer ports the current global state model into SvelteKit server loads or broad RLS `SELECT` policies. Any signed-in user can enumerate lost/found descriptions, dates, locations, image references, contacts, pending marketplace items, and notifications meant for other users.
- **Evidence:** `phase-03-supabase-data-auth-storage.md:101` to `phase-03-supabase-data-auth-storage.md:106` lists generic RLS policies without per-field/per-route privacy rules; `phase-04-domain-routes-and-server-actions.md:104` to `phase-04-domain-routes-and-server-actions.md:110` ports matching and notifications; `server.py:499` to `server.py:505` builds state with all lost reports, found reports, notifications, approved items, and pending items; `server.py:555` to `server.py:571` exposes global read APIs; `app.js:437` to `app.js:451` merges all shared state into local browser storage.
- **Suggested fix:** Define exact read surfaces before implementation: owner-only records, matched-counterparty projections, admin-only moderation lists, and recipient-only notifications. Run matching server-side and return redacted projections, not whole tables.

## Finding 5: Storage upload security is only a path convention
- **Severity:** High
- **Location:** Phase 3, section "Architecture"
- **Flaw:** The upload model lets the browser upload to Supabase Storage and relies on app validation plus a `{profile_id}/{record_id}/{file_name}` convention. The plan does not require signed upload tokens, storage RLS tied to `auth.uid()`, server-side object verification, or enforceable quotas.
- **Failure scenario:** Authenticated attacker uses the public anon key to upload files directly to Supabase Storage under another user's path, attach an object to someone else's listing/report, or exhaust the Free-tier storage/egress budget with oversized files if policies are broad.
- **Evidence:** `phase-03-supabase-data-auth-storage.md:61` to `phase-03-supabase-data-auth-storage.md:70` sends upload control back to the browser; `phase-03-supabase-data-auth-storage.md:107` to `phase-03-supabase-data-auth-storage.md:110` only names size/MIME validation and a path convention; `phase-06-deployment-and-operations.md:95` to `phase-06-deployment-and-operations.md:99` makes limits a documentation task; `index.html:43` to `index.html:47` and `index.html:116` to `index.html:119` only hint `accept="image/*"`; `app.js:1399` to `app.js:1427` trusts `file.type` and falls back to raw data URLs; `server.py:201` to `server.py:211` and `server.py:227` to `server.py:237` persist submitted image payloads unchecked.
- **Suggested fix:** Use private buckets, short-lived signed upload URLs tied to a DB draft row and `auth.uid()`, storage policies that enforce path owner equality, bucket-level object size limits, server-side metadata/content-type verification, and per-user storage quotas.

## Finding 6: XSS risk is not explicitly killed before porting raw templates
- **Severity:** High
- **Location:** Phase 4, section "Implementation Steps"
- **Flaw:** The plan says to port existing flows and add Vietnamese error/empty states, but it never calls out the legacy raw HTML rendering pattern or bans unsafe rendering of user content. Current listing fields are stored unchecked and interpolated into `innerHTML`.
- **Failure scenario:** Attacker submits a marketplace item name/contact/description such as an HTML event payload. If migration copies legacy templates, uses Svelte `{@html}`, or allows arbitrary image/link URLs, a viewing user/admin executes attacker script and leaks session data or performs admin mutations.
- **Evidence:** `phase-04-domain-routes-and-server-actions.md:104` to `phase-04-domain-routes-and-server-actions.md:116` ports lost/found and marketplace flows; `phase-04-domain-routes-and-server-actions.md:131` and `phase-04-domain-routes-and-server-actions.md:164` only say generic input validation; `phase-05-theme-preservation-and-attribution.md:101` to `phase-05-theme-preservation-and-attribution.md:113` ports visual components; `app.js:1100` to `app.js:1110` interpolates `item.image`, `item.name`, `item.price`, and `item.contact` into `innerHTML`; `app.js:1262` to `app.js:1270` interpolates pending item content into admin HTML; `server.py:248` to `server.py:277` stores listing payloads without content validation.
- **Suggested fix:** Add a hard output-encoding rule: no `{@html}` for user fields, text bindings only, URL/path allowlists, length/character validation schemas, and a CSP. Add tests with HTML/script payloads against public and admin views.

## Finding 7: Cookie-authenticated mutations lack an origin/CSRF plan
- **Severity:** High
- **Location:** Phase 4, section "Security Considerations"
- **Flaw:** The plan moves to Supabase SSR cookies and SvelteKit actions/handlers, but only says "CSRF-safe SvelteKit form actions" generically. It does not require origin allowlisting for JSON handlers, cookie SameSite/Secure verification, or removal of wildcard CORS from the legacy surface.
- **Failure scenario:** A user/admin is signed in to the new app. A malicious site submits a cross-origin form or fetch to a mutation route that accepts cookies, causing listing creation, interest spam, or admin approve/reject actions if route handlers are not covered by SvelteKit form-action CSRF behavior.
- **Evidence:** `plan.md:40` to `plan.md:48` allows SvelteKit pages/actions/+server handlers; `phase-04-domain-routes-and-server-actions.md:105` to `phase-04-domain-routes-and-server-actions.md:116` creates mutation actions; `phase-04-domain-routes-and-server-actions.md:161` to `phase-04-domain-routes-and-server-actions.md:164` has only a generic CSRF bullet; `server.py:580` to `server.py:583` handles preflight; `server.py:673` to `server.py:676` allows `Access-Control-Allow-Origin: *`; `app.js:97` to `app.js:170` shows the mutation surface being JSON endpoints today.
- **Suggested fix:** Require SvelteKit form actions for browser mutations where possible, explicit `Origin`/`Sec-Fetch-Site` checks for JSON `+server` handlers, Secure/HttpOnly/SameSite cookies, no wildcard CORS, and negative tests for cross-origin POST/PATCH.

## Finding 8: Abuse controls are documentation-only, not enforcement
- **Severity:** Medium
- **Location:** Phase 6, section "Implementation Steps"
- **Flaw:** The plan recognizes image/storage limits but only documents them. It does not require per-user quotas, signup restrictions, mutation rate limits, notification spam controls, or enforced cleanup. Supabase Free is accepted for a controlled demo without abuse boundaries.
- **Failure scenario:** Attacker signs up or reuses one account to create thousands of lost/found reports, marketplace listings, interests, notifications, and uploads. Storage/egress gets exhausted and admin dashboards become unusable before any operational checklist matters.
- **Evidence:** `plan.md:23` to `plan.md:24` accepts hosted Supabase Free for controlled demos; `phase-03-supabase-data-auth-storage.md:101` to `phase-03-supabase-data-auth-storage.md:107` lists access policies but no quotas; `phase-06-deployment-and-operations.md:95` to `phase-06-deployment-and-operations.md:99` only says to define demo limits and cleanup policy; `server.py:599` to `server.py:609` currently accepts create/report/notification mutations without auth or rate limits; `app.js:1753` to `app.js:1772` has an auto-approval path for marketplace items.
- **Suggested fix:** Add enforced per-user/IP/day quotas, storage object quotas, dedup constraints, Supabase Auth signup/domain allowlists, rate limiting in server actions, and cleanup jobs with measurable enforcement.

Status: DONE_WITH_CONCERNS
Summary: Security adversary review found blocking plan gaps in legacy cutover, admin identity, service-role ownership, data privacy, storage, XSS, CSRF/origin controls, and abuse limits.
Concerns/Blockers: `CLAUDE.md` is referenced by repo instructions but is absent, so project-specific mandatory workflow details could not be verified.
