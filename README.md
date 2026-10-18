# Mehmet Ozkan - Portfolio

My portfolio website: a scroll-driven, one-page journey from monochrome manga to colorful anime. Built with Three.js (custom GLSL shaders), Anime.js, and TypeScript, bundled with Vite and managed with pnpm.

## The experience

- Hero: inked typography and an outlined sound effect over a procedural wireframe terrain, a neural web overhead, and manga screentones
- The whole page is laid out as comic panels: heavy ink frames, offset shadows, numbered panel tabs, screentone fills, a speech balloon, and action lines raking off each headline
- Chapter 01 · The Origin: camera pushes toward a breathing, noise-displaced planet
- Chapter 02 · The Craft: orbital ring system
- Chapter 03 · The Playground: drifting crystal field and project cards
- Chapter 04 · Your Turn: camera lifts into a wide overview
- As you scroll, the world blooms: screentones give way to a blue sky, the terrain turns to grass with procedural flowers, butterflies wake up, and cel-shaded objects gain color
- The same scroll progress develops the page from manga to anime: screentone and action lines fade out as panel fills bloom into coral, blue, yellow, and mint, and the ink accents turn blue
- Reduced motion: all content stays visible in a fully colored, static scene, with no reveals, camera travel, pointer tilt, or continuous render loop

## Stack

- Three.js with custom vertex/fragment shaders (goo displacement, fbm-free terrain, point sprites, line pulses)
- Anime.js v4 (`onScroll`, `animate`, `createAnimatable`, and responsive scopes) for chapter travel, reveals, pointer tilt, and shared color progression
- TypeScript (strict), Vite, pnpm
- oxlint + oxfmt for linting and formatting
- Self-hosted M PLUS Rounded 1c Latin fonts (400, 500, 700, 900), distributed under the [SIL Open Font License](public/fonts/OFL.txt)

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
