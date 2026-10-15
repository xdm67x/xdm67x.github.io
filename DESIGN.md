---
name: Mehmet Ozkan — Portfolio
description: A portfolio that cuts like a game menu: four full-frame slides of glass over a looping film of a night sea, with one hard transition — torn into bands, pushed through the lens, landed oversized — that plays in the page and in a live WebGPU scene on the same clock.
colors:
  # Four rooms, all cut from the same deep blue. `tint` owns the frame's grade;
  # `accent` owns meaning. Both come from the renderer's table
  # (renderer/src/layout.rs) so the page and the world cannot disagree.
  hero-tint: "#03060f"
  hero-accent: "#6ba6ff"
  experience-tint: "#030b15"
  experience-accent: "#4ddbff"
  projects-tint: "#05071a"
  projects-accent: "#9a8cff"
  contact-tint: "#020c14"
  contact-accent: "#a6d9ff"
  ink: "#eef4ff"
  ink-soft: "#c6d5ef"
  ink-faint: "#8b9dbe"
  glass-body: "rgba(255,255,255,0.055)"
  glass-body-strong: "rgba(255,255,255,0.085)"
  glass-edge: "rgba(255,255,255,0.14)"
  void: "#03060f"
typography:
  # Instrument Serif carries the display voice — filmic, tight, and the only
  # italic in the system. Manrope carries everything readable. The platform
  # monospace carries data: dates, counts, tags, keys, the dock.
  display:
    fontFamily: "'Instrument Serif', 'Iowan Old Style', Georgia, serif"
    fontSize: "clamp(3.1rem, 10.4vw, 8.6rem)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.025em"
  section:
    fontFamily: "'Instrument Serif', serif"
    fontSize: "clamp(1.9rem, 4vw, 3.2rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.02rem, 1.25vw, 1.18rem)"
    fontWeight: 600
    letterSpacing: "-0.015em"
  body:
    fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(0.92rem, 0.98vw, 1.02rem)"
    fontWeight: 400
    lineHeight: 1.6
  lede:
    fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1rem, 1.15vw, 1.19rem)"
    lineHeight: 1.62
  micro:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.6875rem"
    letterSpacing: "0.1em"
scale:
  steps: ["0.5625", "0.625", "0.6875", "0.7813", "0.8125", "0.8438", "0.875", "0.9375", "0.9688", "1", "1.0625", "1.1875"]
  fluid: ["clamp(3.1rem, 10.4vw, 8.6rem)", "clamp(1.9rem, 4vw, 3.2rem)", "clamp(0.92rem, 0.98vw, 1.02rem)"]
  overrides:
    mobile-display: "clamp(3rem, 15vw, 5.5rem)"
    mobile-body: "15px"
    print-body: "1rem"
rounded:
  chip: "0.35rem"
  card: "0.85rem"
  panel: "1rem"
  pill: "999px"
motion:
  # One authored moment. Everything else is 2-4% atmosphere at most.
  cut: "0.92s total: 0.42 to leave, 0.08 of flash, 0.46 to land"
  cut-switch: "0.42 (flash, shockwave, chromatic split peak)"
  stagger: "0.05 out, 0.20 in (0.026 per block)"
  fastest: "0.25s (hover, focus)"
  longest: "1.1s (film resolving from blur at boot)"
---

# Design

<!-- The scene: who is looking, from where, under what light. -->
A recruiter skims this in an office between meetings, or on a phone on a train,
for under two minutes. That decides the light: a night sea, deep navy and
moonlit, with the page as panes of glass in front of it — never a bright
white document, and never so dark that the sea disappears.

## The film

One looping film of a night sea fills the frame, behind everything. It is
generated for this page (`tools/loopgen.rs`, no dependencies): a heightfield of
seven wave components running mostly towards the camera, lit by one low light
off to the right, rows mapped to distance the way a real lens maps a plane, so
the swell opens up towards the viewer. It is seamless because every component
advances by a whole number of cycles per loop, not because it is cross-faded.

It is graded in CSS, not in the file: `brightness(0.98) saturate(1.12)`, a 1.5px
blur, a left-to-right scrim that quiets the side the type sits on, a vignette,
and a wash of the current room's tint. That wash is what makes a slide change
felt across the whole frame. While a cut plays the film scales up 5% and the
grade lifts (`--film-open`), so the sea is part of the movement.

The loop has no audio, is muted, loops, plays inline, and pauses with
`prefers-reduced-motion` (leaving the poster showing).

## The cut

The site has one piece of authored motion, and it is used everywhere. It takes
0.92 s and has three parts:

| When | What the page does | What the world does |
| --- | --- | --- |
| 0 → 0.42 | Blocks converge a little, grow ~25%, blur and burn out; bands of glass rip sideways out of the frame, alternating direction; the type splits into red and cyan copies | Every piece is thrown along its own radial direction by a burst that grows, the plates stretch into streaks, the rings flare, the camera pulls back and widens |
| 0.42 | Flash frame; shockwave ring expands from the centre; the split peaks | The burst peaks: brightest emissive, widest view, most roll |
| 0.42 → 1 | The new page punches in ~18% oversized and snaps back, block by block down the column, behind one wipe of light | Pieces converge past their marks and settle (a small overshoot), the camera pushes back in and the room's colour has changed |

Both halves are driven by one number: the front end owns `progress`, paints its
own blocks with it, and hands it to the renderer as `set_deck(from, to,
progress)`. The world is a pure function of that state, so the two layers cannot
drift apart — and at rest (`from === to`, `progress === 1`) nothing is animating
at all.

## The world

One pool of 176 glass pieces: a core, three hairline rings and 172 plates cut
from a seven-sided shard with a beveled rim so the outline catches a specular
line the way chipped glass does. Each slide is a different arrangement of that
same pool.

| Slide | Arrangement | What it means |
| --- | --- | --- |
| 01 Hero | An oblate cloud of plates orbiting the core, inside three tipped rings | The work, presented in orbit |
| 02 Experience | Three columns rising left to right over a wide field of fallen plates | A record that grows, oldest to newest |
| 03 Projects | A 13×13 lattice of tiles with a larger, deeper layer behind it | The work itself, as objects |
| 04 Contact | Concentric rings of plates around a signal sphere | A landing place: something answered |

**Scale.** At a slide the camera sits about 4.4 m from the arrangement with a
42° view, so one metre is roughly 270 px on a 900 px-tall frame. Arrangements are
built inside a box about 2.0 m wide and 1.5 m tall, and the camera aims left of
that box (`AXIS_X`), which keeps the structure in the right half of the frame and
the document's column of type in the left. On a portrait viewport the camera
moves over the centre line and steps back so the whole arrangement fits.

**Material.** One fragment shader, two pipelines. The core and the rings are
opaque, write depth, and are lit by a cool key light, a hemisphere ambient and a
fresnel rim in the room's accent. The plates are blended, sorted back to front
on the CPU every frame, and deliberately thin (0.09–0.24 alpha at rest): they
add light along their edges rather than darkening the sea behind them. A fake
environment, sampled by reflection direction, gives a stack of panes depth. Fog
is not a colour but a fade: far pieces dissolve back into the film.

The canvas is transparent (premultiplied) and composited over the video, so the
sea is visible through every pane. There is no sky pass and no shadow map: the
film is the background, and the world is the glass in front of it.

## Typography

Instrument Serif for the display voice — the name, the section headings, the
email address — with one italic gesture per heading (the second half of a
sentence, the family name). Manrope for everything readable: lede, entries,
descriptions, links, buttons. The platform monospace for data only: dates,
counts, tags, indices, the dock's counter, keyboard keys.

Sizes do the work; there are two weights in play (400, 600) plus 500 for
links. Headings carry their own weight — no label sits above a heading claiming
to introduce it. Section identity comes from the glass nav's numbered tabs and
the dock's counter, where the sequence *is* the content.

Body measure is 58ch or narrower, in a column that takes the left 40rem of a
wide frame; the world keeps the rest.

## Colour

Four rooms, all cut from the same deep blue. The tint owns the frame's grade and
the glass; the accent owns meaning and is rationed: the world's core and rings,
the active tab, focus rings, links, the live badge, the waypoint of the shockwave.
Nothing else is coloured, and there is never more than one accent in a frame.

`renderer/src/layout.rs` holds the table and `web/main.js` writes `--accent` and
`--tint` from it every frame, blended across the cut, so the world and the
document cannot disagree about a room's colour. Every accent clears 4.5:1
against the film it sits on.

## Type in the world

Three labels live in the scene rather than in the document: the span of years on
experience, an index line on projects, a position on contact. Each is an
ordinary DOM element whose `transform` and `font-size` are driven from the
renderer's per-frame anchor projection (screen position, fade, pixels-per-metre),
so text stays crisp, selectable and translatable while appearing to sit in the
space. They are `aria-hidden`, decorative, and never carry a fact the document
does not also state.

## Interaction

- **Wheel, trackpad, swipe, keys.** A slide change takes one deliberate gesture:
  wheel and trackpad accumulate past a threshold, a touch flick or a swipe
  counts, and <kbd>↑</kbd> <kbd>↓</kbd> <kbd>space</kbd> <kbd>1</kbd>–<kbd>4</kbd>
  <kbd>Home</kbd> <kbd>End</kbd> work from the keyboard. A sheet with more
  content than its frame scrolls first and only then changes slide.
- **The glass nav** carries four numbered tabs with a pip that slides between
  them, and the mark returns to the hero.
- **History.** Each slide is a history entry, so the back button walks the deck.
- **Focus.** When a cut lands, focus moves to the new slide's heading; slides
  that are off screen are `inert`, so nothing unreachable is focusable.

## Fallbacks

- **Reduced motion**: no cut, no tear, no film motion, no drift; the slide
  changes instantly and the film holds its poster.
- **No WebGPU**: the canvas is dropped, the film is graded darker, and a faint
  accent grid stands in for the world. Nothing is hidden or duplicated.
- **No scripting**: the four slides stay in the document flow as a plain,
  scrollable portfolio, complete with the projects list.
- **Print**: the film, the canvas, the chrome and the labels are dropped and the
  four slides print in order as a plain document.

## Do's and Don'ts

### Do

- **Do** treat the cut as the product: one transition, tuned, and the same
  movement in the page and in the world.
- **Do** keep glass thin. A pane that darkens the sea behind it is a pane too
  far.
- **Do** keep the film visible. If the page reads as black, the background has
  been lost.
- **Do** keep every fact in the DOM. If the film and the world both failed, the
  page would still be a complete portfolio.

### Don't

- **Don't** scatter, tumble or explode the typography: the page is cut, not
  thrown. Blocks move in scale and blur, never in rotation.
- **Don't** add a second transition style. New movement arrives as a parameter of
  the cut (a stagger, an amplitude), not as a new animation.
- **Don't** put a label above a heading, or a number on a section that does not
  need one.
- **Don't** name the technology in the interface — no stack labels, no renderer
  readout. The renderer's identity belongs in the console.
- **Don't** introduce a fifth colour. New colour arrives as a room in the
  palette table.
- **Don't** add a stats/skills section — removed by user decision.
