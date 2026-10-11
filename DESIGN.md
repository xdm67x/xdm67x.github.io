---
name: Mehmet Ozkan — Portfolio
description: A professional portfolio tracing a path through one continuous WebGL shader world — Source Serif 4 and Manrope on deep night, with a single trail-gold accent.
colors:
  trail-gold: "#e5b96b"
  gold-bright: "#f2d494"
  gold-brass: "#b98e35"
  night-ground: "#05060f"
  night-horizon: "#12153a"
  panel: "rgba(10, 13, 24, 0.74)"
  ink: "#e8ecf6"
  dusk: "#a8b2cc"
typography:
  display:
    fontFamily: "'Source Serif 4', Georgia, serif"
    fontSize: "clamp(2.6rem, 6vw, 4.4rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Source Serif 4', Georgia, serif"
    fontSize: "clamp(1.5rem, 2.6vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Manrope', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.4
  title-large:
    fontFamily: "'Manrope', system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "'Manrope', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  small:
    fontFamily: "'Manrope', system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.7
  button:
    fontFamily: "'Manrope', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
  label:
    fontFamily: "'Manrope', system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.5
  micro:
    fontFamily: "'Manrope', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  card: "14px"
  pill: "999px"
components:
  button-primary:
    backgroundColor: "rgba(7, 8, 26, 0.55)"
    textColor: "{colors.trail-gold}"
    rounded: "{rounded.card}"
    padding: "13px 22px"
  button-primary-hover:
    backgroundColor: "{colors.trail-gold}"
    textColor: "{colors.night-ground}"
  chip-tag:
    textColor: "{colors.dusk}"
    rounded: "{rounded.pill}"
    padding: "4px 11px"
  card-project:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.card}"
    padding: "24px 26px"
  rail-stop-active:
    backgroundColor: "{colors.trail-gold}"
---

# Design System: Mehmet Ozkan — Portfolio

## Overview

**Creative North Star: "The Traverse"**

A professional portfolio that traces a path. The page is one continuous
journey through a WebGL shader world — indigo night at the hero, dawn behind
the experience timeline, dusk violet over the projects, and a quiet aurora
at the contact — with a slim waypoint rail on the right edge filling with
gold as the visitor descends. The world provides all the atmosphere; the
content stays quiet, factual, and typographically calm.

Typography carries the professionalism: Source Serif 4 gives the name and
section headings an editorial, confident voice; Manrope keeps every sentence
and control precise and unpretentious. One accent — Trail Gold — marks the
path itself: waypoint dots, timeline markers, actions, and the rail fill.
Nothing shouts, nothing blinks, nothing games.

**Key Characteristics:**

- One evolving shader world — a living domain-warped fBm silk field with a
  breathing glow and GPU motes, blending through four biomes and quickening
  with scroll velocity; never a hard cut, never decoration bolted onto a
  section.
- A single warm accent. Trail Gold appears only on the path's markers and
  actions; the sky owns the big color.
- Content in near-opaque dark panels with 14px radii and 1px hairline
  borders; depth is declared once, as a border.
- Motion is restrained but alive: exponential ease-out entrances (rise +
  blur clear), a clip-path wipe for section headings, the hero drifting and
  fading as the journey begins, the timeline trail filling as it is
  traversed, and the silk quickening while you scroll. Everything freezes
  under `prefers-reduced-motion`; the site works with no WebGL at all.

## Colors

A night palette disciplined by one warm accent. The shader supplies the
chromatic range; the UI supplies restraint.

### Primary

- **Trail Gold** (#e5b96b): the path's voice — hero role line, waypoint
  dots and rail fill, timeline markers, CTA borders and text, link hovers.
  Used on ≤10% of any viewport.
- **Gold Bright** (#f2d494): the gold's hover state on links.
- **Gold Brass** (#b98e35): scrollbar thumb; the darker gold for platform
  surfaces.

### Neutral

- **Night Ground** (#05060f): the world's ground and page background.
- **Night Horizon** (#12153a): the body's fallback gradient midpoint
  (no-WebGL world).
- **Ink** (#e8ecf6): primary text, ~14:1 on panels.
- **Dusk** (#a8b2cc): secondary text — descriptions, dates, destinations,
  ~7:1 on panels.
- **Panel** (rgba(10, 13, 24, 0.74)): the near-opaque indigo surface every
  card sits on.

### Named Rules

**The Single Accent Rule.** Trail Gold is the only UI accent. If a screen
needs a second accent color, the request is really for the shader's biome
palette — add it there, not to the chrome.

**The Solid Panel Rule.** Body copy never floats on the animated sky. Reading
text lives on Panel surfaces; only the hero's name, role, and bio sit
directly on the world, and only on the night hero where the sky is calmest.

## Typography

**Display Font:** Source Serif 4 (fallback: Georgia)
**Body Font:** Manrope (fallback: system-ui)

**Character:** An editorial serif for authority — the name and section
headings read like the opening lines of a travel journal — paired with a
precise, slightly humanist sans that keeps controls and copy professional.
Neither face borrows the other's job.

### Hierarchy

- **Display** (600, clamp(2.6rem–4.4rem), 1.08, -0.02em): the hero name,
  once per page.
- **Headline** (600, clamp(1.5rem–2rem), 1.2): section headings — Experience,
  Projects, Contact — each flanked by a gold waypoint dot.
- **Title** (700, 1.0625rem, Manrope): timeline roles and project titles;
  the featured project scales to 1.375rem.
- **Body** (400, 1rem, 1.7): timeline bullets and contact copy; measure
  capped at 68–70ch.
- **Small** (400–700, 0.9375rem): descriptions, email action, link rows.
- **Label** (600, 0.8125rem): timeline date lines and rail labels; normal
  case, no letterspacing games.
- **Micro** (600, 0.75rem): project tags and footer. The type floor; nothing
  renders smaller.

### Named Rules

**The Serif-For-Headings Rule.** Source Serif 4 appears only on h1/h2 and
one italic publication note. Every control, label, and sentence is Manrope.

**The 0.75rem Floor Rule.** No text below 12px. The smallest labels (tags,
footer) still clear contrast over the night world.

## Layout

Full-viewport stages stacked vertically with generous travel space (16vh
top padding desktop, 12vh ≤900px). One reading column per section: hero
640px left-aligned and vertically centered; experience timeline 760px with
a 1px trail line at left (40px node offset); projects 1080px in an
auto-fill grid of ≥320px columns, featured card spanning full width;
contact 640px centered. A fixed waypoint rail sits 34px from the right
edge on ≥1000px viewports: four dots, labels on hover/focus, a gold fill
line tracking scroll; hidden below 1000px, where the page's own trail
carries the metaphor.

## Elevation & Depth

No shadow system. Depth comes from the world itself — the silk field's
layered domain warping and breathing glow do the atmospheric work — and
from one hairline (1px,
rgba(232,236,246,.1)) declaring each panel. Hover brightens the border and
lifts cards 3px; nothing glows, nothing halos.

### Named Rules

**The Hairline Rule.** A panel states its elevation once, as a border —
never border plus shadow. Hover changes border color, not box-shadow.

## Shapes

Calm geometry: 14px radii on cards and buttons, 999px pills only for the
small tag chips, perfectly round 9–11px dots for waypoints and timeline
nodes. The only drawn icon is a geometric arrow (SVG rects), used on CTAs
and links. The favicon carries the trail mark: a gold path curving to a
terminal dot.

## Components

### Buttons

- **Shape:** 14px radius, 1px solid Trail Gold border
- **Primary (hero CTA, email action):** Trail Gold text on translucent night
  (rgba(7,8,26,.55) or panel), Manrope 700 at 0.875–0.9375rem, padding
  13–14px 22–24px
- **Hover / Focus:** fills Trail Gold, text flips to Night Ground; `:active`
  presses down 2px. Focus-visible: 2px gold outline, 3px offset

### Chips

- **Tag chips:** Dusk text on a 1px hairline, 999px pill, 0.75rem/600,
  padding 4px 11px. No selected states — they are metadata, not controls.

### Cards / Containers

- **Project card:** Panel surface, 1px hairline, 14px radius, 24px 26px
  padding; title, description, insight line, tags, Source/Live links.
  Hover: hairline brightens, card lifts 3px, and a faint Trail Gold wash
  (0.07 alpha radial) follows the cursor across the face.
- **Contact card:** same language, 40px 42px padding, a hairline separating
  the email action from the link rows.
- **Timeline entry:** not a card — typography on the world, anchored by a
  1px trail line and a gold ringed node at 11px; the trail fills with gold
  as the section is traversed, and topic chips (pill, hairline) tag each
  entry.

### Navigation

- **Waypoint rail (≥1000px):** fixed right, four stops (Intro, Experience,
  Projects, Contact); 9px dots on a 1px track, gold fill scaling with scroll
  progress, active dot solid gold; labels fade in on hover/focus 22px left of
  the dot. Anchor links, keyboard-focusable.

## Do's and Don'ts

### Do:

- **Do** keep every sentence on a near-opaque Panel; only the hero sits
  directly on the sky.
- **Do** blend biome palettes continuously through scroll — the world is one
  traverse, not four decorated sections.
- **Do** keep motion exponential ease-out and restrained: rise + blur
  entrances, one heading wipe, no blinking.
- **Do** respect `prefers-reduced-motion` (static world, instant reveals)
  and keep the CSS-gradient fallback world for no-WebGL browsers.

### Don't:

- **Don't** reintroduce gaming vocabulary, pixel fonts, boot sequences, or
  arcade chrome — the world is professional (user decision, 2026-10-11).
- **Don't** add a second UI accent; new color arrives through the shader's
  biome palettes.
- **Don't** put text below 0.75rem or animate layout properties.
- **Don't** use Source Serif 4 for controls or sentences — serif is for
  headings and the one italic note.
- **Don't** add a stats/skills section — removed by user decision.
