---
name: XDM67X — The Lantern-Lit Quest
description: A portfolio staged as a lantern-lit adventure — one continuous WebGL shader world, arcade pixel chrome, gold guide-light accents on deep night indigo.
colors:
  lantern-gold: "#f2c14e"
  lantern-brass: "#b98e35"
  crystal-cyan: "#7de3e3"
  cave-violet: "#d966ff"
  aurora-green: "#7ef29d"
  dawn-rose: "#ff9d5c"
  night-ground: "#05060f"
  starlight-ink: "#d6dbf0"
  dusk-ink: "#9aa3c4"
  dialogue-panel: "rgba(9, 11, 24, 0.88)"
typography:
  display:
    fontFamily: "'Press Start 2P', monospace"
    fontSize: "64px"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0.02em"
  headline:
    fontFamily: "'Press Start 2P', monospace"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "'Press Start 2P', monospace"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0.06em"
  body:
    fontFamily: "'Chakra Petch', system-ui, sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  none: "0px"
spacing:
  sm: "10px"
  md: "16px"
  lg: "22px"
  xl: "34px"
components:
  button-primary:
    backgroundColor: "rgba(7, 8, 26, 0.82)"
    textColor: "{colors.lantern-gold}"
    padding: "18px 30px"
  button-primary-hover:
    backgroundColor: "{colors.lantern-gold}"
    textColor: "{colors.night-ground}"
  chip-quest-type:
    backgroundColor: "rgba(242, 193, 78, 0.08)"
    textColor: "{colors.lantern-gold}"
    padding: "6px 8px"
  panel-dialogue:
    backgroundColor: "{colors.dialogue-panel}"
    padding: "28px 30px 24px"
  hud-level-active:
    backgroundColor: "rgba(242, 193, 78, 0.07)"
    textColor: "{colors.lantern-gold}"
---

# Design System: XDM67X — The Lantern-Lit Quest

## Overview

**Creative North Star: "The Lantern-Lit Quest"**

The portfolio is one continuous night world the visitor travels by scrolling: a
WebGL2 shader sky whose palette and weather shift through five biomes (night
hub, dawn ridge, crystal cave, aurora fields, starfield arena), over which
arcade chrome floats — a pixel-font HUD with a scroll-driven HP bar, level
chips, and a secrets counter. Everything a visitor reads sits inside square
RPG dialogue panels with gold hairline borders and corner ticks; everything
that moves belongs to the world behind them.

The palette is disciplined to a single guide-light: Lantern Gold carries every
action, border, and instrument; Crystal Cyan marks the technical and the
playable; three biome accents (Cave Violet, Aurora Green, Dawn Rose) appear
only as chip tints and world colors. Gold never floods fields — the shader sky
owns the big color.

The register is playful but honest: game vocabulary (quests, inventory, stats,
CONTINUE?) frames factual career content. Nothing in the chrome is allowed to
invent claims; nothing in the content is allowed to break the world.

**Key Characteristics:**

- One continuous shader world (fBm nebula, parallax ridgelines, stars, moon,
  aurora, GPU motes) that blends palettes per section — never a hard cut.
- Arcade pixel chrome (Press Start 2P) strictly for logotype, banners, HUD,
  chips, and labels; Chakra Petch carries every sentence.
- Square geometry: zero radii, 1px gold hairlines, 14×2px corner ticks,
  rotated-square diamonds as trail nodes.
- Motion grammar: exponential ease-out entrances (rise + blur clear), blinking
  chrome, scroll-and-pointer parallax; everything freezes honestly under
  `prefers-reduced-motion`, and the site works with no WebGL at all.

## Colors

One guide-light, five weather systems. The UI owns six hues; the sky owns
everything else.

### Primary

- **Lantern Gold** (#f2c14e): the guide-light. Logotype, banners, borders,
  HP fill, start button, link arrows, quest trail diamonds. Used on ≤10% of
  any viewport — its rarity is the point.
- **Lantern Brass** (#b98e35): the lantern's darker shade — HP bar border,
  inventory slot borders, banner flanking diamonds, scrollbar thumb.

### Secondary

- **Crystal Cyan** (#7de3e3): the technical accent — tagline, SIDE QUEST
  chips, PLAY links, `hud-level` hover.

### Tertiary

- **Cave Violet** (#d966ff): achievements and the crystal-cave biome's moon
  glow.
- **Aurora Green** (#7ef29d): TUTORIAL chips and the aurora biome.
- **Dawn Rose** (#ff9d5c): the dawn biome's celestial body and horizon warmth.

### Neutral

- **Night Ground** (#05060f): the world's ground — page background and the
  darkest biome skies.
- **Dialogue Panel** (rgba(9, 11, 24, 0.88)): near-opaque indigo-black panels
  every sentence sits on.
- **Starlight Ink** (#d6dbf0): primary body text, ~13:1 on the panel.
- **Dusk Ink** (#9aa3c4): secondary text, tags, dates (~7:1 on the panel).

### Named Rules

**The One Lantern Rule.** Gold is the guide-light, never a field. If a screen
needs more gold to read as this world, the shader is broken, not the accent
budget.

**The Solid Panel Rule.** Body copy never floats on the animated sky. Reading
text lives on Dialogue Panel surfaces; only display chrome (logotype,
tagline) may sit directly on the world, and only on the title screen.

## Typography

**Display Font:** Press Start 2P (fallback: monospace)
**Body Font:** Chakra Petch (fallback: system-ui)

**Character:** A pixel arcade face as the world's voice of authority — every
chip, HUD readout, and headline is an instrument — with a warm technical sans
that keeps sentences human and fast to read. The pairing works because each
face never borrows the other's job.

### Hierarchy

- **Display** (400, 64px, 1.15, 0.02em): the logotype on the title screen
  only (44px ≤900px, 32px ≤640px, 24px ≤560px).
- **Headline** (400, 22px): section banners — LEVEL titles in pixel gold
  (20px ≤900px, 16px ≤560px).
- **Title** (600, 22px, Chakra Petch): quest and project card headings;
  featured project 26px.
- **Body** (400, 15.5–17px, 1.65): all reading copy; measure capped at
  65–75ch inside cards.
- **Label** (400, 12px, 0.06em, uppercase): all pixel chrome — chips, dates,
  rewards, HUD readouts, footer. 12px is the floor; nothing renders smaller.

### Named Rules

**The Pixel Chrome Rule.** Press Start 2P appears only as chrome — logotype,
banners, chips, HUD, controls, labels — never for sentences. Chakra Petch
carries anything a visitor reads for meaning.

**The 12-Pixel Floor Rule.** No text below 12px anywhere, pixel or body. The
smallest labels stay legible over the night world.

## Layout

Full-viewport stages stacked vertically, each with generous travel space
(18vh top padding, 12vh bottom on desktop; 14vh/10vh ≤900px). Content max
widths keep one comfortable reading column: quest log 880px on a dashed
trail spine (padding-left 46px, nodes at the spine), projects 1140px in an
auto-fill grid of ≥320px columns with the featured card spanning full width,
stats 1080px in two equal panels, contact 620px centered. HUD is a fixed top
bar: nameplate left, four level chips center, HP bar + secrets right; level
names collapse at <900px, nameplate text at <560px. The title screen is a
100svh centered stage with the logotype as its only mass.

## Elevation & Depth

No CSS shadow system. Depth is declared twice only: the shader paints real
atmospheric depth (three parallax ridgelines with haze pooling, nebula
layers, vignette), and panels declare themselves with a 1px gold hairline
border plus 14×2px corner ticks. The single sanctioned shadow is the pixel
press: `0 0.06em 0 rgba(3,4,10,.85)` under pixel type for arcade-press depth.
Anything else sits flat.

### Named Rules

**The Hairline Rule.** A panel states its elevation once, as a border — never
border plus soft shadow. Hover raises border color, not box-shadow.

## Shapes

Square everything. Panels, chips, buttons, inventory slots: 0px radius.
Corner brackets are drawn as paired 14×2px / 2×14px gold bars inset 4px.
Diamonds (10px squares rotated 45°) mark trail nodes; a dashed 2px gold trail
connects quest cards. Authored icons are pixel-grid SVG on a 2px unit
(carets, crests, coins, arrows) — no rounded iconography, no emoji, no
unicode glyphs standing in for icons.

## Components

### Buttons

- **Shape:** square (0px radius), 2px solid border
- **Primary (PRESS START):** Lantern Gold text on rgba(7,8,26,.82), gold
  border, Press Start 2P 14px, padding 18px 30px, blinking pixel caret
- **Hover / Focus:** background fills Lantern Gold, text flips to Night
  Ground; `:active` presses down 2px. Focus-visible: 2px gold outline,
  3px offset
- **HUD level chips:** transparent, Dusk Ink text; active: gold text, gold
  hairline border, gold 7% tint background

### Chips

- **Quest type chips** (MAIN / SIDE / TUTORIAL): pixel font 12px, 1px border
  and 7–8% tint in the type's hue (gold / cyan / green), padding 6px 8px
- **Project tags:** Dusk Ink text on Starlight 16% border, pixel 12px

### Cards / Containers

- **Dialogue panel (quest card, continue panel):** Dialogue Panel surface,
  1px Lantern Gold 32% hairline, corner ticks at 55% gold opacity, padding
  28px 30px 24px (18px–22px on mobile)
- **Project card:** same panel language, hover border shifts to the card's
  project color (70% mix), 3D pointer tilt (≤6°) with a radial shine
  following the cursor, no shadows

### Inputs / Fields

None on this surface. Focus visibility is the only input concern: gold
outline on every interactive element.

### Navigation

Fixed pixel HUD: nameplate with pixel crest, four level chips that scroll to
sections and light gold when their section is active, HP bar (110px, gold
scaleX fill on brass border) tracking scroll progress, secrets counter
(coin icon, `n/9`) counting revealed project cards.

### Inventory Slot

Signature stat unit: a 46px square slot (1px brass border, gold 6% tint)
holding a pixel-font abbreviation (Rs, Py, TS, Go), name label underneath in
Dusk Ink 11px. Slots render lists as equipment — never as invented stat bars.

## Do's and Don'ts

### Do:

- **Do** keep every sentence on a near-opaque Dialogue Panel; only display
  chrome sits on the sky, and only on the title screen.
- **Do** blend biome palettes continuously through scroll; the world is one
  journey, not five decorated sections.
- **Do** use authored pixel-grid SVG icons on a 2px unit for every icon need.
- **Do** keep motion exponential ease-out (cubic-bezier(.16,1,.3,1)) and
  reach past transform/opacity (blur clear, clip-path banner wipes) where it
  stays smooth.
- **Do** respect `prefers-reduced-motion` everywhere: static world frame, no
  boot typing, no tilt, instant reveals — and keep the CSS-gradient fallback
  world for no-WebGL browsers.

### Don't:

- **Don't** put radii on panels or controls; the world is square.
- **Don't** invent stat numbers or proficiency bars — lists render as
  inventory slots and traits, honestly.
- **Don't** use Press Start 2P for sentences or body copy.
- **Don't** add a seventh UI accent; new color arrives through the shader's
  biome palettes, not the chrome.
- **Don't** place text below 12px.
