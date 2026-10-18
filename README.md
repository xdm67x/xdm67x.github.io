# Mehmet Ozkan — Portfolio

My portfolio website: a scroll-driven, one-page journey that starts in monochrome and gains color as you discover the chapters. Built with Three.js (custom GLSL shaders), GSAP ScrollTrigger, and TypeScript, bundled with Vite and managed with pnpm.

## The experience

- Hero: typographic intro over a procedural wireframe terrain, a neural web pulsing overhead, and a CRT scanline base
- Chapter 01 · The Origin: camera pushes toward a breathing, noise-displaced planet
- Chapter 02 · The Craft: orbital ring system
- Chapter 03 · The Playground: drifting crystal field and project cards
- Chapter 04 · Your Turn: camera lifts into a wide overview
- As you scroll, the world blooms: the terrain turns to grass with procedural flowers, butterflies wake up, and every shader tints from ink into color

## Stack

- Three.js with custom vertex/fragment shaders (goo displacement, fbm-free terrain, point sprites, line pulses)
- GSAP + ScrollTrigger for chapter travel, reveals, and color progression
- TypeScript (strict), Vite, pnpm
- oxlint + oxfmt for linting and formatting

## Commands

```sh
pnpm install
pnpm dev       # dev server
pnpm build     # type-check + production build to dist/
pnpm preview   # preview the production build
pnpm lint      # oxlint
pnpm fmt       # oxfmt (write)
pnpm fmt:check # oxfmt (check)
```

## Deployment

Pushes to `main` trigger the GitHub Pages workflow (`.github/workflows/deploy.yml`), which installs dependencies with pnpm, builds with Vite, and deploys `dist/`.
