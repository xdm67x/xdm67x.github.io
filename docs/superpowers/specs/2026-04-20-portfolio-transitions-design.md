# Portfolio Redesign — Clean Transitions & Editorial Design

**Date:** 2026-04-20  
**Status:** Approved for implementation  
**Approach:** React Spring `useScroll` + existing `@react-spring/parallax` structure

---

## 1. Goal

Upgrade the portfolio website to have a clean, editorial design with smooth, layered transitions between parallax-scrolled project sections.

---

## 2. Visual Design System

### 2.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0A0A0A` | Primary background |
| `--color-bg-gradient` | `#0F1115` | Subtle bottom gradient target |
| `--color-surface` | `#111111` | Card/section surfaces |
| `--color-border` | `#222222` | Borders, dividers |
| `--color-text` | `#F5F5F5` | Primary text |
| `--color-text-muted` | `#888888` | Secondary/muted text |
| `--color-text-dim` | `#555555` | Tertiary text, hints |
| `--color-white` | `#FFFFFF` | Button text on dark, accents |
| `--color-nav-bg` | `rgba(10, 10, 10, 0.8)` | Navigation background |

Project accent colors remain unchanged and are used sparingly for:
- Project number badges
- "Featured Project" label text
- Hover states on tech badges and links

### 2.2 Typography

| Element | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| Name (Hero) | Outfit | `clamp(4rem, 10vw, 7rem)` | 700 | Massive, commanding |
| Hero title | Outfit | `clamp(1.5rem, 4vw, 2rem)` | 500 | Secondary line |
| Project titles | Outfit | `clamp(2.5rem, 5vw, 4rem)` | 700 | Editorial impact |
| Labels | Inter | `0.75rem` | 600 | Uppercase, `letter-spacing: 3px` |
| Body | Inter | `1.1rem` | 400 | Line-height `1.7` |
| Nav links | Inter | `0.85rem` | 500 | Uppercase, `letter-spacing: 2px` |
| Buttons | Inter | `0.9rem` | 600 | — |

### 2.3 Spacing & Layout

- **Body background:** Subtle gradient from `#0A0A0A` (top) to `#0F1115` (bottom)
- **Hero:** Full viewport height (`100vh`), content vertically and horizontally centered
- **Project sections:** Full viewport height each, internal padding `4rem 2rem`
- **Section separation:** No hard dividers — transitions create natural separation
- **Max content width:** `1200px`, centered
- **Grid:** 2-column (`1fr 1fr`, gap `3rem`) for project sections; single column on mobile (`< 900px`)

---

## 3. Component Architecture

### 3.1 Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component, holds `parallaxRef` |
| `src/components/ParallaxContainer.tsx` | Main parallax scroll container, orchestrates layers |
| `src/components/HeroLayer.tsx` | Hero section with entrance animations |
| `src/components/ProjectLayer.tsx` | Individual project section with scroll-driven animations |
| `src/components/Navigation.tsx` | Fixed nav with scroll-to and active-state tracking |
| `src/components/FloatingShapes.tsx` | Reusable floating background shapes per section |
| `src/data/projects.ts` | Project data (unchanged schema) |
| `src/styles/theme.css` | Global styles, CSS variables, typography reset |

### 3.2 New/Revised Components

#### FloatingShapes
- Accepts: `color: string`, `count: number` (default 3)
- Renders absolutely-positioned circles with the given color at `opacity: 0.04–0.08`
- Each shape has its own size, position, and CSS `animation` duration/direction
- Uses `pointer-events: none`, `position: absolute`, `overflow: hidden` on parent

#### ProjectLayer (revised)
- Wraps content in a scroll-tracking container
- Uses `useScroll` from `@react-spring/web` to track section scroll progress
- Drives `useSpring` for image, text, and badge entrance animations
- Renders `FloatingShapes` with the project's accent color

#### HeroLayer (revised)
- Same scroll-tracking pattern as ProjectLayer
- Entrance animations on page load + scroll-linked fade for transition to first project
- Renders 4 floating shapes using muted neutral tones (`#1E3A5F` at low opacity, `#2563EB` at low opacity) for subtle depth without distracting from content

#### Navigation (revised)
- Adds `useScroll` to determine which section is currently active
- Updates link styles to show active state
- Background uses `backdrop-filter: blur(12px)`

---

## 4. Animation & Transition System

### 4.1 Hero Entrance (Page Load)

Elements stagger in with `fadeInUp` on initial mount:

| Element | Delay | `translateY` | Opacity |
|---------|-------|--------------|---------|
| Greeting | `0.2s` | `20px → 0` | `0 → 1` |
| Name | `0.35s` | `20px → 0` | `0 → 1` |
| Title | `0.5s` | `20px → 0` | `0 → 1` |
| Tagline | `0.65s` | `20px → 0` | `0 → 1` |
| CTA button | `0.85s` | `20px → 0` | `0 → 1` |
| Scroll indicator | `1.1s` | `20px → 0` | `0 → 1` |

All use `cubic-bezier(0.25, 0.1, 0.25, 1)` easing, duration `0.8s`.

### 4.2 Project Section Scroll-Driven Animations

Each project section tracks its own scroll progress via `useScroll` on a container ref.

**Progress mapping:**
- `0.0 – 0.25`: Content enters viewport
- `0.25 – 0.75`: Content fully visible, shapes float
- `0.75 – 1.0`: Content begins to fade out gently

**Image wrapper animation (progress 0 → 0.3):**
- `translateY`: `40px → 0px`
- `opacity`: `0 → 1`
- `scale`: `0.95 → 1.0`
- Easing: `easeOutCubic`

**Text block animation (progress 0.05 → 0.35):**
- `translateY`: `30px → 0px`
- `opacity`: `0 → 1`
- Staggered: label → title → description → tech stack → links, each `0.08s` apart

**Project number badge (progress 0.1 → 0.3):**
- `scale`: `0 → 1.15 → 1.0` (overshoot for playful pop)
- `opacity`: `0 → 1`

**Exit fade (progress 0.75 → 1.0):**
- `opacity`: `1.0 → 0.3`
- No `translateY` — content stays in place, just recedes
- This creates overlap with the next section fading in above it

### 4.3 Floating Shapes

Each section has 3 floating circles:

| Shape | Size | Position | Speed (parallax) | Opacity |
|-------|------|----------|------------------|---------|
| 1 | `300–400px` | Top-left quadrant | `0.2` | `0.04–0.06` |
| 2 | `200–280px` | Bottom-right quadrant | `0.5` | `0.05–0.07` |
| 3 | `100–160px` | Center-right | `0.8` | `0.03–0.05` |

Shapes use the project's accent color (or primary/secondary for hero).
CSS `animation: float 15–25s ease-in-out infinite` with randomized delays so they never sync up.

### 4.4 Hero → First Project Transition

- Hero content fades and `translateY(-20px)` as scroll leaves hero
- First project content fades in from `translateY(40px)` as it enters
- Hero shapes slow their animation; new project shapes appear with `opacity` fade-in
- No hard cut — it's a crossfade overlap

### 4.5 Between Projects

Same pattern as hero → project:
- Leaving project: opacity fades to `0.3`, content stays static
- Entering project: content animates in with entrance sequence
- Divider layers (scroll hints) are removed from `ParallaxContainer` — the transition itself provides enough visual rhythm

---

## 5. Responsive Behavior

**Desktop (`> 900px`):**
- 2-column project grid
- Full floating shapes visible
- Nav links visible

**Mobile (`≤ 900px`):**
- Single column project grid, text centered
- Tech badges and links centered
- Image max-width `400px`, centered
- Floating shapes reduced in size and count (2 instead of 3)
- Nav collapses to hamburger or remains compact

---

## 6. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-spring/parallax` | Existing | Parallax scroll container |
| `@react-spring/web` | Existing | `useScroll`, `useSpring` |
| `react` | Existing | UI framework |

No new dependencies required.

---

## 7. Success Criteria

- [ ] Monochrome editorial palette applied globally
- [ ] Typography uses massive heading scale for editorial impact
- [ ] Each project section animates in smoothly on scroll (image, text, badge)
- [ ] Background shapes float at different parallax speeds per section
- [ ] Exit fade creates gentle overlap between sections
- [ ] Navigation is fixed, blurred, and tracks active section
- [ ] Hero → first project transition is seamless
- [ ] No hard dividers between projects — transitions create rhythm
- [ ] Mobile layout stacks gracefully
- [ ] All existing project data preserved

---

## 8. Out of Scope

- Horizontal scrolling
- Page-level progress indicator
- Contact form or additional pages
- Dark/light mode toggle
- 3D/WebGL effects
- Sound or video

---

## 9. Open Questions

None — all decisions validated with user.
