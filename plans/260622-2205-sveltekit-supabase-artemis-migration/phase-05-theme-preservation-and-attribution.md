---
phase: 5
title: "Theme Preservation And Attribution"
status: pending
priority: P1
dependencies: [1, 2]
effort: "high"
---

# Phase 5: Theme Preservation And Attribution

## Context Links

- Current style system: `styles.css`
- Current markup: `index.html`
- Current assets: `assets/`
- User requirement: keep original author soul; space vibe with rocket, cloud, moon, astronaut motif, and footer attribution.

## Overview

Recreate the original Artemis visual identity in SvelteKit without flattening it into a generic dashboard. Start this phase immediately after scaffold and continue it alongside route work. Current assets are references for tone/style; production should use recreated, ownership-clear assets.

## Requirements

- Functional: analyze current moon/radar/rocket/cloud/asteroid/beacon/trade-station assets and animations to define the production style guide.
- Functional: recreate all production visual assets in that style.
- Functional: compare against `assets/expected layout-01.jpg` and baseline screenshots.
- Functional: preserve the playful Vietnamese Artemis copy tone.
- Functional: add footer attribution on public pages.
- Functional: ensure both products feel related but clearly distinct.
- Functional: create a style-matched astronaut motif as part of the recreated asset set.
- Non-functional: responsive layout must not overlap text or controls.
- Non-functional: accessibility must improve while preserving the space theme.

## Architecture

Analyze first, recreate second, extract third. Start by extracting the current visual language into `docs/design-guidelines.md`, then recreate production assets and screenshot-check parity. Only `AttributionFooter` is mandatory in v1. Extract `MoonRadar`, `CloudCard`, and `RocketBrandMark` only after repeated UI shapes prove the need.

Optional final theme system:

```text
src/lib/ui/artemis-theme/
  artemis-theme.css
  tokens.css
  motion.css
  layout.css
  attribution-footer.svelte
  moon-radar.svelte
  cloud-card.svelte
  rocket-brand-mark.svelte
```

Keep theme tokens close to current CSS, but do not depend on old asset files as production source:

```css
:root {
  --cookie: "SVN Cookies", "Arial Rounded MT Bold", system-ui, sans-serif;
  --space-bg: ...;
  --moon-glow: ...;
  --cloud-surface: ...;
}
```

Footer copy:

```text
Made by miti99 (miti99.com) from artemis (iamminhnguyet.com) idea, with <3
```

Use links:

```text
miti99 -> https://miti99.com
artemis -> https://iamminhnguyet.com
```

## Related Code Files

- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/ui/artemis-theme/tokens.css`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/ui/artemis-theme/artemis-theme.css`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/ui/artemis-theme/AttributionFooter.svelte`
- Optional create after parity: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/ui/artemis-theme/motion.css`
- Optional create after duplication appears: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/ui/artemis-theme/MoonRadar.svelte`
- Optional create after duplication appears: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/ui/artemis-theme/CloudCard.svelte`
- Optional create after duplication appears: `/config/workspace/tiennm99/artemis-demo-agent/src/lib/ui/artemis-theme/RocketBrandMark.svelte`
- Modify: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/+layout.svelte`
- Modify: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/+page.svelte`
- Modify: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/vutrudodac/+page.svelte`
- Modify: `/config/workspace/tiennm99/artemis-demo-agent/src/routes/phienchotrenmay/+page.svelte`
- Create or update: `/config/workspace/tiennm99/artemis-demo-agent/docs/design-guidelines.md`
- Create: `/config/workspace/tiennm99/artemis-demo-agent/assets/generated/artemis/` for source/generated production assets.
- Create: `/config/workspace/tiennm99/artemis-demo-agent/static/assets/artemis/generated/` for app-served optimized assets.
- Read/port: `/config/workspace/tiennm99/artemis-demo-agent/styles.css`
- Read/port: `/config/workspace/tiennm99/artemis-demo-agent/index.html`
- Analyze as references: `/config/workspace/tiennm99/artemis-demo-agent/assets/moon.png`
- Analyze as references: `/config/workspace/tiennm99/artemis-demo-agent/assets/rocket.png`
- Analyze as references: `/config/workspace/tiennm99/artemis-demo-agent/assets/cloud.png`
- Analyze as references: `/config/workspace/tiennm99/artemis-demo-agent/assets/SVN-Cookies.ttf`
- Analyze as references: `/config/workspace/tiennm99/artemis-demo-agent/assets/background-full.jpg`
- Analyze as references: `/config/workspace/tiennm99/artemis-demo-agent/assets/asteroid-left.png`
- Analyze as references: `/config/workspace/tiennm99/artemis-demo-agent/assets/asteroid-right.png`
- Analyze as references: `/config/workspace/tiennm99/artemis-demo-agent/assets/found-beacon.png`
- Analyze as references: `/config/workspace/tiennm99/artemis-demo-agent/assets/lost-signal.png`
- Analyze as references: `/config/workspace/tiennm99/artemis-demo-agent/assets/care-star.png`
- Analyze as references: `/config/workspace/tiennm99/artemis-demo-agent/assets/trade-station.png`

## Implementation Steps

1. Analyze current CSS/assets and record the production art direction:
   - palette
   - line weight
   - glow/shadow language
   - paper/cutout/illustration texture
   - moon/radar composition
   - cloud card shape
   - rocket/asteroid/trade-station proportions
   - motion language
   - Vietnamese display typography.
2. Capture baseline and migrated screenshots for:
   - login/account
   - first viewport
   - moon/radar area
   - marketplace cloud cards
   - listing wizard
   - notification panel
   - public footer
   - admin panel density
   - `/vutrudodac/admin`
   - `/phienchotrenmay/admin`
   - mobile viewports at 375px and 768px.
3. Recreate production assets before final route styling:
   - moon/radar
   - rocket
   - cloud/card surfaces
   - asteroids
   - lost signal/found beacon
   - care star
   - trade station
   - astronaut motif
   - galaxy/background assets.
4. Optimize recreated assets for web delivery:
   - stable dimensions
   - alt/decorative metadata
   - responsive variants if needed
   - source/generated files retained separately from app-served optimized files.
5. Extract current design tokens from `styles.css` only after screenshot parity is close:
   - fonts
   - background colors
   - moon/radar sizing
   - cloud card surface
   - accent colors
   - animation timings.
6. Copy recreated required assets to `static/assets/artemis/generated/` with stable paths.
7. Build `AttributionFooter` for the public routes.
8. Build shared visual components only where duplication appears:
   - `MoonRadar`
   - `CloudCard`
   - `RocketBrandMark`.
9. Use recreated supporting assets where they improve the route:
   - background galaxy images
   - asteroid-left/right
   - lost signal / found beacon
   - care star
   - trade station
   - astronaut.
10. Apply theme to `/`:
   - main intro/router should make the brand/product visible in first viewport
   - include moon/radar/rocket/cloud visual cues
   - avoid a generic marketing landing page.
11. Apply theme to `/vutrudodac`:
   - radar/moon remains primary metaphor
   - lost/found actions should feel like sending/receiving signals.
12. Apply theme to `/phienchotrenmay`:
   - cloud cards remain marketplace metaphor
   - item cards keep airy/cloud styling without nested card clutter.
13. Keep admin themed but dense:
   - simple tables/action rows
   - clear counts and statuses
   - restrained Artemis skin
   - no cloud-card metaphor for every admin row.
14. Add footer to public route layout or per-page layout:
   - visible on `/`, `/vutrudodac`, `/phienchotrenmay`
   - may be present on account/admin if it does not hurt workflow density.
15. Improve accessibility:
   - meaningful alt text where images carry meaning
   - decorative images `alt=""`
   - keyboard focus states
   - reduced-motion support.
   - form labels
   - stable image dimensions.
16. Validate mobile:
   - no text overlaps moon
   - buttons do not overflow
   - footer remains readable.
   - Vietnamese diacritics do not clip in buttons, cloud cards, moon text, or footer.
17. Capture `docs/design-guidelines.md` as the living Artemis theme contract:
   - required assets
   - asset recreation notes and ownership/licensing notes
   - copy lexicon
   - typography
   - admin density rules
   - accessibility and motion rules.

## Todo List

- [ ] Current CSS/assets analyzed for tone/style.
- [ ] Production-owned assets recreated.
- [ ] Baseline vs migrated screenshots captured.
- [ ] Current visual tokens extracted after parity check.
- [ ] Recreated assets copied to SvelteKit static path.
- [ ] `AttributionFooter` created.
- [ ] Shared theme components created only where duplication justifies them.
- [ ] Astronaut motif recreated in the Artemis style.
- [ ] `docs/design-guidelines.md` created or updated.
- [ ] Public pages use Artemis theme.
- [ ] Footer attribution added with links.
- [ ] Mobile/responsive states checked.
- [ ] Reduced-motion and focus states added.

## Success Criteria

- [ ] A user familiar with the current demo recognizes Artemis immediately.
- [ ] First viewport, moon/radar, and cloud card screenshots are intentionally equivalent in spirit or differences are documented.
- [ ] Screenshot set covers login/account, first viewport, moon/radar, marketplace cloud cards, listing wizard, notification panel, footer, mobile, and both admin routes.
- [ ] Recreated moon, radar, rocket, cloud, asteroid, care star, trade station, astronaut, and space vibe remain core UI signals.
- [ ] Public footer shows the exact requested attribution text with valid links.
- [ ] UI does not become generic SaaS, plain CRUD, or unrelated marketplace styling.
- [ ] Text and controls do not overlap on mobile or desktop.
- [ ] Vietnamese text and diacritics do not clip or overflow at 375px, 768px, and 1280px widths.
- [ ] Admin views are scannable and action-oriented while keeping a light Artemis skin.
- [ ] Accessibility is better than current demo without losing the theme.

## Risk Assessment

- Risk: recreated assets lose author intent. Mitigation: analyze current assets first, document style traits, and compare screenshots before accepting replacements.
- Risk: redesign loses author intent. Mitigation: compare screenshots before/after for first viewport and core flows.
- Risk: decorative visuals harm usability. Mitigation: keep forms and admin screens dense enough for repeated work.

## Security Considerations

- Footer links must use normal HTTPS anchors and should not expose tracking scripts.
- Uploaded marketplace images are user content; theme must not bypass image sanitization/storage rules.
- Recreated assets must have clear ownership/licensing suitable for production.
