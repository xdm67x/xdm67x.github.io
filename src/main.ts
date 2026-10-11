import { createWorld, type World } from "./world";
import { PROJECTS } from "./data";

const $ = <T extends Element = HTMLElement>(sel: string) =>
  document.querySelector<T>(sel);

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// ── world ────────────────────────────────────────────────────────
let world: World | null = null;
const canvas = $("#world");
if (canvas instanceof HTMLCanvasElement) {
  world = createWorld(canvas, { reducedMotion: reduced });
  if (!world) document.documentElement.classList.add("no-webgl");
} else {
  document.documentElement.classList.add("no-webgl");
}

if (world && finePointer) {
  window.addEventListener(
    "pointermove",
    (e) => {
      world!.setPointer(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      );
    },
    { passive: true },
  );
}

// ── content: projects ────────────────────────────────────────────
function projectCard(p: (typeof PROJECTS)[number], i: number): string {
  return `
  <article class="project-card reveal${p.live_url ? " featured" : ""}"
           style="--i:${i % 4}">
    <h3 class="pc-title">${p.title}</h3>
    <p class="pc-desc">${p.description}</p>
    ${p.insight ? `<p class="pc-insight">${p.insight}</p>` : ""}
    <ul class="pc-tags">
      ${p.tags.map((t) => `<li>${t}</li>`).join("")}
    </ul>
    <div class="pc-links">
      <a class="pc-link" href="${p.github_url}" target="_blank"
         rel="noopener noreferrer">
        Source
        <svg class="cta-arrow" viewBox="0 0 14 14" aria-hidden="true">
          <rect x="1" y="6" width="10" height="2" fill="currentColor" />
          <rect x="7" y="3" width="2" height="8" fill="currentColor" transform="rotate(45 8 7)" />
          <rect x="7" y="3" width="2" height="8" fill="currentColor" transform="rotate(-45 8 7)" />
        </svg>
      </a>
      ${
        p.live_url
          ? `<a class="pc-link" href="${p.live_url}" target="_blank"
             rel="noopener noreferrer">
              Live
              <svg class="cta-arrow" viewBox="0 0 14 14" aria-hidden="true">
                <rect x="1" y="6" width="10" height="2" fill="currentColor" />
                <rect x="7" y="3" width="2" height="8" fill="currentColor" transform="rotate(45 8 7)" />
                <rect x="7" y="3" width="2" height="8" fill="currentColor" transform="rotate(-45 8 7)" />
              </svg>
            </a>`
          : ""
      }
    </div>
  </article>`;
}

const grid = $("#projects-grid");
if (grid) grid.innerHTML = PROJECTS.map(projectCard).join("");

// ── reveal on scroll ─────────────────────────────────────────────
const revealables = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
if ("IntersectionObserver" in window && !reduced) {
  const ro = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          ro.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
  );
  revealables.forEach((el) => ro.observe(el));
} else {
  revealables.forEach((el) => el.classList.add("in"));
}

// ── path progress: biome, rail, timeline fill, hero drift ────────
const railFill = $("#rail-fill");
const trailFill = $("#timeline-fill");
const hero = $("#intro .hero");
const stops = Array.from(document.querySelectorAll<HTMLElement>(".rail-stop"));
const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-biome]"));

let lastY = window.scrollY;
let lastT = performance.now();
let vel = 0;
let decaying = false;

function decayLoop() {
  vel *= 0.93;
  if (vel > 0.004) {
    world?.setVelocity(vel);
    requestAnimationFrame(decayLoop);
  } else {
    vel = 0;
    world?.setVelocity(0);
    decaying = false;
  }
}

function updatePath() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  world?.setScroll(p);
  if (railFill) railFill.style.transform = `scaleY(${p.toFixed(3)})`;

  // travel velocity makes the world's breath quicken
  const now = performance.now();
  const inst = Math.min(
    Math.abs(window.scrollY - lastY) / Math.max(now - lastT, 1) / 2.2,
    1,
  );
  lastY = window.scrollY;
  lastT = now;
  vel = Math.max(vel, inst);
  world?.setVelocity(vel);
  if (!decaying && vel > 0.004) {
    decaying = true;
    requestAnimationFrame(decayLoop);
  }

  // dominant section decides the biome and the active waypoint
  const mid = window.scrollY + window.innerHeight * 0.5;
  let current = sections[0];
  for (const s of sections) {
    if (s.offsetTop <= mid) current = s;
  }
  const b = Number(current?.dataset.biome ?? 0);
  world?.setBiome(b);
  stops.forEach((stop, i) => {
    stop.classList.toggle("active", i === b);
  });

  if (!reduced) {
    // the hero drifts up and fades as the journey begins
    if (hero) {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.3) {
        hero.style.transform = `translate3d(0, ${(y * 0.2).toFixed(1)}px, 0)`;
        hero.style.opacity = Math.max(
          0,
          1 - y / (window.innerHeight * 0.8),
        ).toFixed(3);
      }
    }
    // the timeline's trail fills as it is traversed
    if (trailFill) {
      const timeline = trailFill.parentElement;
      if (timeline) {
        const r = timeline.getBoundingClientRect();
        const t = Math.min(
          Math.max((window.innerHeight * 0.72 - r.top) / r.height, 0),
          1,
        );
        trailFill.style.transform = `scaleY(${t.toFixed(3)})`;
      }
    }
  }
}

let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        updatePath();
        ticking = false;
      });
    }
  },
  { passive: true },
);
updatePath();

// ── card hover light ─────────────────────────────────────────────
if (finePointer && !reduced) {
  for (const card of Array.from(document.querySelectorAll<HTMLElement>(".project-card"))) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty(
        "--mx",
        `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`,
      );
      card.style.setProperty(
        "--my",
        `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`,
      );
    });
  }
}

// ── hero entrance ────────────────────────────────────────────────
const settle = () => document.documentElement.classList.add("loaded");
if (reduced || !("fonts" in document)) {
  settle();
} else {
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(
    settle,
  );
}
