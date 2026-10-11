import { createWorld, type World } from "./world";
import {
  PROJECTS,
  LANGUAGES,
  TOOLS,
  TRAITS,
  PARTY_LANGUAGES,
  type StatSlot,
} from "./data";

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
  <article class="project-card reveal${p.play_url ? " featured" : ""}"
           style="--pc:${p.color}; --i:${i % 4}" data-project>
    <div class="pc-head">
      <span class="pc-index">/${String(i + 1).padStart(2, "0")}</span>
      <h3 class="pc-title">${p.title}</h3>
    </div>
    <p class="pc-desc">${p.description}</p>
    <ul class="pc-tags">
      ${p.tags.map((t) => `<li>${t}</li>`).join("")}
    </ul>
    <div class="pc-links">
      <a class="pc-link" href="${p.github_url}" target="_blank"
         rel="noopener noreferrer">
        <span class="obj-arrow" aria-hidden="true"><svg viewBox="0 0 8 8"><rect x="0" y="3" width="6" height="2" fill="currentColor"/><rect x="4" y="1" width="2" height="6" fill="currentColor"/></svg></span>
        SOURCE
      </a>
      ${
        p.play_url
          ? `<a class="pc-link pc-play" href="${p.play_url}" target="_blank"
             rel="noopener noreferrer">
              <span class="obj-arrow" aria-hidden="true"><svg viewBox="0 0 8 8"><rect x="1" y="1" width="2" height="6" fill="currentColor"/><rect x="5" y="1" width="2" height="6" fill="currentColor"/></svg></span>
              PLAY
            </a>`
          : ""
      }
    </div>
    <span class="pc-shine" aria-hidden="true"></span>
  </article>`;
}

const grid = $("#projects-grid");
if (grid) grid.innerHTML = PROJECTS.map(projectCard).join("");

// ── content: stats panels ────────────────────────────────────────
function slots(list: StatSlot[]): string {
  return `
  <ul class="slot-grid">
    ${list
      .map(
        (s) => `
    <li class="slot">
      <span class="slot-abbr">${s.abbr}</span>
      <span class="slot-name">${s.name}</span>
    </li>`,
      )
      .join("")}
  </ul>`;
}

function listPanel(title: string, items: string[]): string {
  return `
  <div class="stat-panel reveal" style="--i:2">
    <h3 class="stat-title">${title}</h3>
    <ul class="trait-list">
      ${items.map((t) => `<li>${t}</li>`).join("")}
    </ul>
  </div>`;
}

const stats = $("#stats-panels");
if (stats) {
  stats.innerHTML = `
  <div class="stat-panel reveal" style="--i:0">
    <h3 class="stat-title">INVENTORY — LANGUAGES</h3>
    ${slots(LANGUAGES)}
  </div>
  <div class="stat-panel reveal" style="--i:1">
    <h3 class="stat-title">ITEMS — TOOLS &amp; FRAMEWORKS</h3>
    ${slots(TOOLS)}
  </div>
  ${listPanel("TRAITS", TRAITS)}
  ${listPanel("PARTY LANGUAGES", PARTY_LANGUAGES)}`;
}

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

// ── HUD: scroll progress, biome, level chips ─────────────────────
const hud = $("#hud");
const hpFill = $("#hud-hp-fill");
const hpBar = document.querySelector<HTMLElement>(".hud-hp");
const secrets = $("#hud-secrets");
const levels = Array.from(document.querySelectorAll<HTMLElement>(".hud-level"));
const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-biome]"));

function updateHud() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  if (hpFill) hpFill.style.transform = `scaleX(${p.toFixed(3)})`;
  if (hpBar) hpBar.setAttribute("aria-valuenow", String(Math.round(p * 100)));
  world?.setScroll(p);

  // dominant section decides the biome / level
  const mid = window.scrollY + window.innerHeight * 0.5;
  let current = sections[0];
  for (const s of sections) {
    if (s.offsetTop <= mid) current = s;
  }
  const b = Number(current?.dataset.biome ?? 0);
  world?.setBiome(b);
  levels.forEach((btn, i) => {
    btn.classList.toggle("active", i + 1 === b);
  });
}

let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        updateHud();
        ticking = false;
      });
    }
  },
  { passive: true },
);
updateHud();

levels.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target ?? "");
    target?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  });
});

const start = $("#start");
start?.addEventListener("click", () => {
  document.getElementById("journey")?.scrollIntoView({
    behavior: reduced ? "auto" : "smooth",
  });
});

// ── secrets counter ───────────────────────────────────────────────
const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-project]"));
let found = 0;
if (secrets && "IntersectionObserver" in window) {
  const co = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          co.unobserve(e.target);
          found += 1;
          secrets.textContent = `${found}/${cards.length}`;
        }
      }
    },
    { threshold: 0.4 },
  );
  cards.forEach((c) => co.observe(c));
}

// ── card tilt ────────────────────────────────────────────────────
if (finePointer && !reduced) {
  for (const card of cards) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
      card.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  }
}

// ── boot sequence ────────────────────────────────────────────────
const boot = $("#boot");
const bootLog = $("#boot-log");
const BOOT_LINES = [
  "XDM67X SYSTEM v2.6 — BOOT SEQUENCE",
  "> LOADING WORLD ............... OK",
  "> COMPILING SHADERS ........... OK",
  "> SUMMONING PLAYER DATA ....... OK",
  "> MOUNTING PORTFOLIO .......... OK",
];

function finishBoot() {
  if (!boot) return;
  document.documentElement.classList.remove("booting");
  if (hud) hud.hidden = false;
  boot.classList.add("boot-done");
  window.setTimeout(() => boot.remove(), 700);
  const title = $("#title");
  if (title && !reduced) title.classList.add("live");
  if (title && reduced) {
    title.classList.add("live");
    title.querySelectorAll(".logo, .tagline, .bio, .btn-start, .controls-hint")
      .forEach((el) => el.classList.add("now"));
  }
}

if (!boot || !bootLog || reduced || sessionStorage.getItem("booted")) {
  finishBoot();
} else {
  sessionStorage.setItem("booted", "1");
  let skipped = false;
  const skip = () => {
    if (skipped) return;
    skipped = true;
    finishBoot();
  };
  boot.addEventListener("click", skip);
  window.addEventListener("keydown", skip, { once: true });

  const fontsReady = ("fonts" in document)
    ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))])
    : Promise.resolve();

  fontsReady.then(() => {
    if (skipped) return;
    let line = 0;
    let col = 0;
    const step = () => {
      if (skipped) return;
      if (line >= BOOT_LINES.length) {
        window.setTimeout(skip, 420);
        return;
      }
      const text = BOOT_LINES[line];
      col += 1;
      bootLog.textContent =
        BOOT_LINES.slice(0, line).join("\n") +
        (line > 0 ? "\n" : "") +
        text.slice(0, col);
      if (col >= text.length) {
        line += 1;
        col = 0;
        window.setTimeout(step, 130);
      } else {
        window.setTimeout(step, reduced ? 0 : 14);
      }
    };
    step();
  });
}
