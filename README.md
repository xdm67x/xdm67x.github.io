# Mehmet Ozkan — Portfolio

A minimal portfolio at the intersection of **video games**, **AI** and **3D**,
rendered live in **Rust** and **WebGPU**. Scrolling takes each page apart in
three dimensions and rebuilds it as the next: the world's 176 glass pieces fly
from one themed arrangement to another while the DOM plays the same
choreography, driven by the same clock.

## The experience

- Four slides — intro, craft, play, contact — each with its own accent colour
  and its own 3D room, composited over a quiet looping film
- **Hero** — a voxel game level under construction: a wireframe grid, a floating
  cursor block, a sky of scattered voxels (lime accent)
- **Craft** — the AI layer: a central node wired to an orbit of satellite nodes
  (mint accent)
- **Play** — the 3D viewport: a perspective grid floor with objects standing on
  it, framed by an orbit cage (violet accent)
- **Contact** — a radar: concentric sweeps around a signal sphere (ice accent)
- The scroll transition is a real 3D burst: every piece is thrown outward along
  its own radial, stretched into a streak, and lands overshot with a snap —
  while the DOM tears in horizontal slices, flashes at the cut, and settles the
  new page block by block
- The camera eases with pointer parallax; on touch devices it drifts on its own
- Design is deliberately épuré: near-monochrome, hairline borders, flat panels,
  one accent colour per slide, Space Grotesk + JetBrains Mono
- No JS or no WebGPU: the four slides remain a plain, readable, printable
  portfolio (real DOM, `<noscript>` fallback, print stylesheet)
- Reduced motion: no burst, no tear — slides switch instantly
- Keyboard: arrows, space, page up/down, 1–4, home/end; the back button walks
  the deck

## Stack

- **Rust → WebAssembly** (`renderer/`): wgpu 30 + WGSL renderer with procedural
  meshes (sphere, torus, shard), four themed arrangements of one shared pool of
  176 pieces, the destruct/reconstruct transition, filmic lighting and the
  projection of world anchors the DOM pins its small labels to
- **Trunk** builds everything: compiles the crate, resolves the matching
  wasm-bindgen CLI, copies the plain-ES-module front end
- **Front end** (`web/`): plain ES modules (`main.js`, `data.js`, `style.css`),
  no bundler, no transpiler; `web/wasm/world.js` keeps a stable import path for
  the emitted wasm-bindgen module
- **GitHub Actions** (`.github/workflows/deploy.yml`) builds with Trunk and
  deploys `dist/` to GitHub Pages

## Commands

```sh
rustup target add wasm32-unknown-unknown
cargo install trunk --locked

trunk serve          # dev server with live reload on http://127.0.0.1:8080
trunk build --release  # production build to dist/
cargo check --target wasm32-unknown-unknown
```

## Deployment

Pushes to `main` trigger the GitHub Pages workflow, which installs Rust +
`wasm32-unknown-unknown`, caches the `renderer/` workspace, installs Trunk,
builds with `trunk build --release`, and deploys `dist/`.
