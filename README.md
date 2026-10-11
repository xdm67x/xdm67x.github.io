# xdm67x

Personal portfolio website built with Bun, Vite, and Three.js — a path
traced through one continuous WebGL shader world.

## Tech Stack

- Three.js (WebGL2 fragment shaders for the world, motes, and biome blending)
- TypeScript, vanilla DOM
- Vite (bundled by Bun)

## Development

```bash
bun install
bun run dev
```

## Build

```bash
bun run build    # outputs to dist/
bun run preview  # serve the production build locally
```

## Deployment

Deployed to GitHub Pages at [xdm67x.github.io](https://xdm67x.github.io).

Automatically deployed on push to `main` via GitHub Actions: Bun installs,
Vite builds, `dist/` is published.
