# Mehmet Ozkan - Portfolio

My portfolio website, laid out as a book. Scrolling or dragging peels each page from its bottom-right corner to reveal the next chapter: about me, experiences, projects, and contact.

## The experience

- One fixed page per chapter, stacked as leaves
- Scrolling or dragging peels each leaf from the bottom-right: a diagonal fold line sweeps across the page, the paper back covers the unpeeled side, and the next chapter shows through underneath with a shadowed crease
- The peel eases toward the scroll position, then settles on the nearest page so a leaf never rests half-turned
- Scroll, drag horizontally, or use arrow/page keys to turn pages; vertical touch scrolling still works
- Every chapter has its own paper: cream for the hero, forest green for experiences, warm sand for projects, near-black for contact
- Hero name rises line by line out of its mask; each chapter's content staggers in once the page is uncovered
- Hidden pages are `inert`, so keyboard focus never lands on a page you cannot see
- No JS: the leaves flatten into scrollable chapters and all content stays visible
- Contact is three icon links: email, LinkedIn, and GitHub
- Reduced motion: no peel or reveals, pages switch instantly and all content stays visible

## Stack

- Anime.js v4 (`onScroll`, `animate`, `stagger`) for the scroll follow, settling, and staggered reveals
- Fold geometry (`src/fold.ts`) computes the front/flap clip polygons and crease placement; covered by `bun test`
- TypeScript, Bun (bundler + dev server)
- oxlint + oxfmt for linting and formatting
- Self-hosted Space Grotesk variable font (300–700, Latin), distributed under the [SIL Open Font License](src/fonts/OFL.txt)

## Commands

```sh
bun install
bun dev        # dev server with HMR
bun build      # production build to dist/
bun preview    # preview the production build
bun lint       # oxlint
bun fmt        # oxfmt (write)
bun fmt:check  # oxfmt (check)
bun test       # fold geometry tests
```

## Deployment

Pushes to `main` trigger the GitHub Pages workflow (`.github/workflows/deploy.yml`), which installs dependencies with Bun, builds with `bun build`, and deploys `dist/`.
