# Migration Behavior Baseline

## Context

Artemis currently runs as one static browser app served by `server.py`. The migration target is one SvelteKit app with Supabase Auth, Postgres, and private Storage.

Baseline intent:

- Preserve product behavior, visual identity, and Vietnamese Artemis voice.
- Start production data clean. Do not migrate `.artemis-data/artemis.db`.
- Keep `/health` and `/invocations`.
- Retire legacy `/api/*` routes, including `/api/state`.
- Move old static/Python demo code to `legacy/static-python-demo/` after baseline capture and scaffold compatibility checks.

## Current Runtime

```text
Browser SPA
  index.html
  styles.css
  app.js
  localStorage fallback
  -> server.py
  -> SQLite tables with JSON payload columns
```

Runtime facts:

- `server.py` uses Python stdlib `ThreadingHTTPServer`.
- `ARTEMIS_DB` defaults to `.artemis-data/artemis.db`.
- Frontend syncs shared state on boot, every 15 seconds, after submissions, and before notification/admin panels.
- Browser caches fallback state in `starterGalaxyAuth`, `starterGalaxyRadar`, and `starterGalaxyMarket`.
- Static paths fall back to `index.html`.
- Existing CORS is wildcard and demo-only.

## User Flow Inventory

### Login

- User enters domain and password in `#loginForm`.
- Frontend calls `POST /api/auth/login`.
- Backend creates/validates a demo user keyed by normalized domain and SHA-256 password hash with salt.
- If backend fails, browser falls back to `starterGalaxyAuth`.
- Admin UI is shown only when `domain === "artemis_8920"`.

Target:

- Replace with Supabase Google OAuth only.
- Require verified Google email.
- Keep domain-style names as profile metadata only.
- Admin roles key to immutable Supabase auth user ID.

### Lost Item

- `startLostFlow()` asks for item description.
- `handleLostFlow()` asks for lost date.
- Optional image comes from `#chatImage` and is compressed through `readImageAsDataUrl()`.
- Frontend creates a lost report with `type: "lost"`, `domain`, `description`, `date`, optional `image`, `createdAt`, and local pending flags.
- Report is pushed to local radar memory and persisted through `POST /api/lost-items`.
- Frontend reloads shared state, renders signal stats, and searches matching found reports.
- If matched, Artemis shows contact on the moon and writes match notifications. Else user can enable a waiting radar notification.

Target:

- SvelteKit action creates `lost_items`.
- Server sets owner from session, not client payload.
- Images become private storage objects plus metadata, not base64 payload.

### Found Item

- `startReturnFlow()` asks for item description.
- `handleReturnFlow()` asks for found date, then found location.
- Optional image uses the same data URL compression path.
- Frontend creates a found report with `type: "found"`, `contact`, `description`, `date`, `location`, optional `image`, `createdAt`, and local pending flags.
- Report is persisted through `POST /api/found-items`.
- Frontend searches matching lost reports, then shows owner contact or waits for future matches.

Target:

- SvelteKit action creates `found_items`.
- Server sets finder profile from session.
- Matching remains server-owned/idempotent.

### Matching And Radar

- Frontend matching uses `tokenize()`, `scoreDescription()`, `scoreReportMatch()`, `getSortedReportMatches()`, and `withAlternatives()`.
- Strong match: enough token overlap and exact date.
- Near match: enough overlap, date-related signal, or image signal.
- Backend also computes `match_suggestions` on insert with `score_match()`.
- Frontend creates owner/finder match notifications through `addMatchNotification()`.
- Duplicate match notification check uses owner domain, finder domain, and normalized descriptions.

Target:

- Port matching helper semantics into server/domain code.
- Use transactional/idempotent match candidate and notification writes.
- Normal user reads stay owner/counterparty/recipient scoped.

### Notifications

- Notifications live in `radarMemory.notifications` and SQLite `notifications`.
- Visible when `recipientDomain` equals current domain or `*`.
- Grouped by `match`, `market`, and `radar`.
- Read state is stored as `readBy` array.
- `enableNotification()` creates waiting radar notes.
- `addMatchNotification()` creates owner and finder notes.
- Marketplace care creates owner notes.

Target:

- Store notifications with `recipient_profile_id` or legacy display domain.
- Preserve grouping and unread behavior.
- Replace whole-state polling with targeted 15-30 second polling.

### Marketplace Browse And Search

- `renderMarket()` renders approved `marketItems`.
- Hidden items do not render.
- Passed items sort lower.
- Search uses `scoreMarketItem()` across name, description, link, and contact; matches move to top.
- Cloud cards show product image, name, price, contact, stock status, detail, care, pass/reopen, and edit actions.

Target:

- `/phienchotrenmay` lists approved visible listings.
- Server queries only approved/visible listings for normal users.
- Search/ranking preserved or explicitly accepted as changed.

### Marketplace Listing Wizard

- `openLaunchFormForCreate()` opens chat-style wizard.
- `launchWizardSteps` collect `name`, `quantity`, `description`, `price`, `contact`, and `image`.
- Validation:
  - name under 6 words
  - description under 100 words
  - image required for new listing
  - price normalized with trailing `đ`
- New listing fields include `ownerDomain`, `stockStatus`, `status`, `careCount`, `caredBy`, `editCount`, `edited`, `hidden`, `createdAt`.
- Auto-approval happens when required fields exist, image exists, and sensitive terms are absent.

Target:

- `/phienchotrenmay` server action creates listing.
- Server validates MIME, size, count, path, owner, and status.
- Admin approval remains available, but production auto-approval should be deliberate.

### Marketplace Care, Edit, Pass

- Care toggles current domain in `caredBy`, increments/decrements `careCount`, and notifies owner.
- Owner can edit a listing once if not passed.
- Admin can edit listings.
- Owner can mark `Đã pass` or reopen to `Còn hàng`.
- Backend update route accepts full payload and trusts client state.

Target:

- Model care as idempotent interest rows with unique `(listing_id, profile_id)`.
- Derive or transactionally maintain care count.
- Enforce edit/pass permissions server-side.

### Admin

- Current admin gate is `domain === "artemis_8920"`.
- Admin panel shows:
  - unique lost Starter count
  - unique found Starter count
  - pending marketplace count
  - approved marketplace count
  - recent lost/found rows
  - approved marketplace rows with edit and hide/show
  - pending marketplace rows with approve
- Backend has a reject route but current UI has no visible reject button.

Target:

- Split admin routes: `/vutrudodac/admin` and `/phienchotrenmay/admin`.
- Share scoped admin primitives.
- Seed `minhtienit99@gmail.com` and `minhnguyetawf@gmail.com` as admins with both scopes by default.
- Add server-side role checks and `admin_actions`.

## Data Shape Mapping

| Current shape | Current fields | Target mapping |
| --- | --- | --- |
| `radar.lostReports[]` / `lost_items.payload` | `id`, `type`, `domain`, `description`, `date`, `image`, `createdAt`, `_localPending`, `_localCreatedAt`, optional `category`, `location` | `artemis.lost_items`, owner profile FK, description/date/category/location columns, JSONB metadata for compatibility-only fields, storage image rows. Local pending fields deprecated. |
| `radar.foundReports[]` / `found_items.payload` | `id`, `type`, `contact`, `description`, `date`, `location`, `image`, `createdAt`, `_localPending`, `_localCreatedAt`, optional `category` | `artemis.found_items`, finder profile FK, description/date/location/category columns, JSONB metadata, storage image rows. Local pending fields deprecated. |
| `market.marketItems[]` / `marketplace_items.payload` | `id`, `name`, `quantity`, `description`, `link`, `price`, `contact`, `ownerDomain`, `stockStatus`, `image`, `status`, `careCount`, `caredBy`, `editCount`, `edited`, `hidden`, `createdAt`, `_autoApproved`, local pending fields | `artemis.marketplace_listings`, owner profile FK, indexed name/status/stock/hidden/price/contact fields, JSONB metadata, listing images, marketplace interests. `careCount` derived. Local pending fields deprecated. |
| `market.pendingItems[]` | Same as marketplace item with pending status | Same listing table with `status = pending`; normal users cannot read pending rows except owner if allowed. |
| `notifications.payload` | `id`, `recipientDomain`, `type`, `message`, `ownerDomain`, `finderDomain`, `lostDescription`, `foundDescription`, `foundDate`, `location`, `image`, `itemName`, `interestedDomain`, `readBy`, `createdAt` | `artemis.notifications`, recipient profile FK/display domain, type, message, source IDs, read state rows or JSONB, image reference. |
| `match_suggestions.payload` | `itemId`, `itemType`, `matchedItemId`, `matchedItemType`, `score`, `level`, `item`, `match` | `artemis.match_candidates` with item/candidate FKs, score, level, unique key for idempotency. |
| `users` | `domain`, `password_hash`, `salt` | Deprecated. Use Supabase Auth and `artemis.profiles`. |
| `admin_actions` | `item_id`, `action`, `actor`, payload | Keep as `artemis.admin_actions`, actor from auth user ID. |

## HTTP And Runtime Contract Matrix

| Contract | Current behavior | Migration decision |
| --- | --- | --- |
| `GET /` | Serves SPA shell; missing static paths fall back to `index.html` | Replace with SvelteKit intro/home route. |
| `GET /health` | Returns `{"status":"ok","service":"artemis-starter-galaxy"}` | Keep as SvelteKit `+server` route. |
| `POST /invocations` | AgentBase-compatible acknowledgement/greeting | Keep as SvelteKit `+server` route. |
| `GET /api/state` | Returns full shared state | Retire; do not expose full-state reads in production. |
| `POST /api/state` | Deletes all core tables, reimports caller payload | Retire; do not expose import path in production. |
| `POST /api/auth/login` | Demo domain/password auth with local fallback | Retire; replace with Supabase Google OAuth. |
| `GET/POST /api/lost-items` | List/create lost payloads | Retire; replace with route loaders/actions under `/vutrudodac`. |
| `GET/POST /api/found-items` | List/create found payloads | Retire; replace with route loaders/actions under `/vutrudodac`. |
| `GET/POST /api/marketplace-items` | List/create marketplace payloads by status | Retire; replace with loaders/actions under `/phienchotrenmay`. |
| `PATCH /api/marketplace-items/:id` | Client-trusted full listing update | Retire; replace with server actions enforcing owner/admin rights. |
| `GET /api/admin/marketplace-items` | Lists marketplace rows by status | Retire; replace with `/phienchotrenmay/admin`. |
| `PATCH /api/admin/marketplace-items/:id/approve` | Sets approved status and writes admin action | Retire legacy API; preserve behavior as admin action. |
| `PATCH /api/admin/marketplace-items/:id/reject` | Sets rejected status and writes admin action; UI lacks button | Retire legacy API; add explicit admin UI if included. |
| `GET /api/matches/:itemId` | Lists backend match suggestions | Retire legacy API; expose scoped route data only if needed. |
| `POST /api/notifications` | Inserts notification payload | Retire legacy API; notifications written by server actions/jobs. |
| `OPTIONS *` | Wildcard CORS for demo API | Remove from cookie-authenticated production JSON handlers. |

## Visual Identity Inventory

Must preserve:

- Dark galaxy background with blue/purple depth, aurora motion, glow, and star-like atmosphere.
- `SVN-Cookies.ttf` display style or a production-safe Vietnamese display font with similar playful rounded tone.
- Moon radar as primary conversation surface.
- Radar word cloud around moon from recent item signals.
- Rocket launch button for marketplace listing flow.
- Cloud cards for marketplace items.
- Asteroid accents framing first viewport.
- Care star for marketplace interest.
- Trade station / lost signal / found beacon assets as product motif references.
- Notification icon with badge.
- Vietnamese microcopy: warm, playful, direct Artemis/radar language.
- Public footer attribution required after migration: `Made by miti99 (miti99.com) from artemis (iamminhnguyet.com) idea, with <3`.

Reference assets:

- `assets/moon.png`
- `assets/rocket.png`
- `assets/cloud.png`
- `assets/asteroid-left.png`
- `assets/asteroid-right.png`
- `assets/care-star.png`
- `assets/trade-station.png`
- `assets/lost-signal.png`
- `assets/found-beacon.png`
- `assets/notification-icon.png`
- `assets/background-full.jpg`
- `assets/expected layout-01.jpg`
- `assets/SVN-Cookies.ttf`
- `assets/demo-product-*.jpg`

Style tokens to preserve or consciously translate:

- Display font: `--cookie`
- Body font: `--body`
- Core colors: `#402093`, `#19006a`, `#ff9f00`, `#fffdf4`, `#441d99`
- Soft blue glow: `rgba(211, 226, 255, 0.67)`
- Rounded pill controls, moon text clipping safeguards, soft card shadows, glowing focus states.

## Demo-Only Behaviors To Drop

- localStorage-only auth fallback.
- Domain/password user table.
- Hardcoded admin domain `artemis_8920`.
- Base64 image persistence in DB payloads.
- Wildcard CORS.
- Client-supplied owner/admin/recipient IDs.
- Full-state import through `POST /api/state`.
- Whole-state polling for every update.
- Raw `innerHTML` rendering of user content.
- Client-trusted care counts, edit counts, and listing status.

## Decision Gates

### Auth And Admin

- Supabase Google OAuth only.
- Verified Google email required.
- Domain-style display names remain metadata only.
- Admin roles seed from `minhtienit99@gmail.com` and `minhnguyetawf@gmail.com`.
- Privileged display domains are reserved and not self-claimable.

### Supabase Namespace

- Production schema: `artemis`.
- Preview schema: `artemis_preview`.
- Private storage bucket prefix: `artemis` for production, `artemis_preview` for preview.
- Queries must be schema-qualified or isolated through configured server helpers.

### Clean Start And Legacy Backup

- Existing SQLite rows are intentionally dropped.
- Seed only production-safe starter rows needed for smoke tests.
- Old root demo files move to `legacy/static-python-demo/` after baseline capture and scaffold compatibility checks.
- Legacy backup stays readable for reference and rollback context.
- Backup is not part of production runtime.

## Parity Smoke Checklist

Capture or verify these during migration:

- Login/account first screen.
- First viewport with title, asteroid accents, moon radar, chat/choice controls.
- Lost item flow: description, date, optional image, no-match notification path.
- Found item flow: description, date, location, optional image, match contact path.
- Moon/radar word cloud refresh after submissions.
- Notification panel with `match`, `market`, and `radar` groups.
- Marketplace cloud cards, search ranking, detail panel.
- Marketplace listing wizard with image step.
- Care star count and owner notification.
- Owner edit once, pass/reopen behavior.
- Admin overview, lost/found rows, approved listing rows, pending queue, approve/hide/show/edit actions.
- Footer attribution on public pages.
- Mobile viewport has no critical overlap and Vietnamese text does not clip.
- `/health` and `/invocations` compatibility.
- Legacy `/api/*` retired responses.

Suggested artifact paths:

- `plans/260622-2205-sveltekit-supabase-artemis-migration/baseline-screenshots/login.png`
- `plans/260622-2205-sveltekit-supabase-artemis-migration/baseline-screenshots/first-viewport.png`
- `plans/260622-2205-sveltekit-supabase-artemis-migration/baseline-screenshots/marketplace.png`
- `plans/260622-2205-sveltekit-supabase-artemis-migration/baseline-screenshots/notification-panel.png`
- `plans/260622-2205-sveltekit-supabase-artemis-migration/baseline-screenshots/admin-panel.png`
- `plans/260622-2205-sveltekit-supabase-artemis-migration/baseline-screenshots/mobile.png`

## Unresolved Questions

- Need confirm whether `SVN-Cookies.ttf` license is production-safe; otherwise replace with a Vietnamese-safe display font.
- Current admin UI has no reject button although backend has `reject`; migration should decide whether reject is MVP or hardening.
