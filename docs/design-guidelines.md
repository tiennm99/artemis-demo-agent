# Artemis Design Guidelines

## Visual Contract

Artemis must still read as the original space-themed internal tool, not a generic CRUD dashboard.

- Palette: deep violet/indigo base, moon cream, radar cyan, launch orange.
- Typography: `SVN Cookies` for display labels/headings; system Vietnamese-friendly sans for dense text.
- Core motifs: moon radar, asteroid accents, lost signal, found beacon, rocket, cloud cards, trade station, care star.
- Surfaces: dark translucent panels for tools/admin; light cloud cards only for marketplace listings.
- Shape: 8px radius for tool/admin panels. Cloud cards may use the asymmetric rounded cloud silhouette.
- Motion: optional and subtle; respect reduced motion.
- Copy: Vietnamese, playful but concise. Keep terms like `tín hiệu`, `radar`, `beacon`, `Dò mây`, `Phóng vật phẩm`.

## Current Asset Status

The SvelteKit MVP serves reference assets from `static/assets/artemis/reference/` to preserve the authored Artemis soul during migration.

Production asset recreation remains a design handoff item:

- recreate moon/radar, rocket, cloud, asteroid, lost/found beacons, trade station, care star, astronaut motif
- keep generated source files separate from app-served optimized files
- document ownership/licensing before production cutover

## Layout Rules

- Public pages may be more expressive; admin pages stay dense and scannable.
- Do not nest cards inside cards.
- Forms use labels; user content renders as text only.
- Mobile width target starts at 375px. Buttons wrap instead of overflowing.
- Footer attribution remains visible and uses links to `miti99.com` and `iamminhnguyet.com`.

## Accessibility

- Decorative assets use empty alt text.
- Form controls have visible labels.
- Focus states are visible on links, buttons, and form inputs.
- Color is not the only status signal; status words remain visible.
