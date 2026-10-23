/**
 * The deck: slides, the transition that cuts between them, and the world.
 *
 * One clock drives everything. `progress` runs 0 → 1 while a slide change
 * plays, and every frame it is sent to the Rust renderer with the two slides it
 * sits between (`set_deck(from, to, progress)`) at the same time as it moves the
 * document's own blocks. The world and the page therefore play the same
 * choreography from the same number, and cannot drift apart:
 *
 *   before the cut   the page is pushed through the lens — blocks converge,
 *                    grow and burn out — while bands of glass rip sideways out
 *                    of the frame
 *   at the cut       a flash, a shockwave, and a chromatic split through the type
 *   after the cut    the new page punches in oversized and snaps back into its
 *                    layout, block by block, behind a single wipe of light
 *
 * At rest `from === to` and `progress === 1`. The renderer is a pure function
 * of that state, so a resting frame costs nothing to reason about.
 *
 * Everything readable is real DOM. Without scripting, or without WebGPU, the
 * four slides are a plain, complete portfolio.
 *
 * @typedef {object} World
 * @property {() => string} adapter
 * @property {() => string[]} anchor_ids
 * @property {() => Float32Array} anchor_sizes
 * @property {() => number} anchor_stride
 * @property {() => number} anchor_count
 * @property {() => number} draw_calls
 * @property {() => number} instance_count
 * @property {() => number} sample_count
 * @property {() => number[]} palette
 * @property {(buffer: Float32Array) => void} set_anchor_buffer
 * @property {(from: number, to: number, progress: number) => void} set_deck
 * @property {(reduced: boolean) => void} set_reduced_motion
 * @property {(paused: boolean) => void} set_paused
 * @property {(x: number, y: number) => void} set_pointer
 * @property {(width: number, height: number, dpr: number) => void} set_viewport
 * @property {() => void} start
 * @property {() => void} stop
 */

import init, { World as WorldModule } from "./wasm/world.js";
import { PROJECTS } from "./data.js";

/** True on a local server, where the dev handles below are worth exposing. */
const DEVELOPMENT = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

/* ------------------------------------------------------------------ elements */

const root = document.documentElement;
const body = document.body;
const deck = document.getElementById("deck");
const canvas = document.getElementById("world");
const film = document.getElementById("film");
const fx = document.getElementById("fx");
const sliceField = document.getElementById("slices");
const fxFlash = document.querySelector(".fx-flash");
const fxWave = document.querySelector(".fx-wave");
const fxSweep = document.querySelector(".fx-sweep");
const pip = document.getElementById("tabs-pip");
const worklist = document.getElementById("worklist");
const announce = document.getElementById("announce");
const dockIndex = document.getElementById("dock-index");
const dockName = document.getElementById("dock-name");

const slides = [...document.querySelectorAll(".slide")];
const tabs = [...document.querySelectorAll(".tab")];
const SLIDE_COUNT = slides.length;

/* ------------------------------------------------------------------- motion */

/** Seconds a slide change takes. Short, hard, deliberate: a cut, not a drift. */
const TRANSITION = 0.92;
/** The instant the old page is gone and the new one lands. */
const SWITCH = 0.42;
/** The window over which the landed page settles. */
const SETTLE = 0.46;

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** Overshoots past its target and comes back: the snap that reads as a landing. */
const easeOutBack = (t, amount = 1.5) => {
  const c3 = amount + 1;
  const u = t - 1;
  return 1 + c3 * u * u * u + amount * u * u;
};
const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const bell = (p, centre, width) => Math.exp(-(((p - centre) / width) ** 2));

/* --------------------------------------------------------------------- state */

let index = 0;
/** The 3D transition's endpoints: equal at rest. */
let from = 0;
let to = 0;
let progress = 1;
let moving = false;
/** Dev only: freeze the transition clock so a frame can be inspected. */
let held = false;
/** Whether to move focus into the new slide once the transition lands. */
let focusOnSettle = false;
let reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let wheelLock = 0;

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
motionQuery.addEventListener("change", (event) => {
  reduced = event.matches;
  body.classList.toggle("still", reduced);
  world?.set_reduced_motion(reduced);
  if (reduced) film?.pause();
  else film?.play().catch(() => {});
});

/* --------------------------------------------------------------- the pieces */

/**
 * Every block the transition can pick up: one per `[data-piece]` in a slide.
 *
 * The leaving page is not scattered through space: it is *pushed through the
 * lens*. Blocks drift a little towards the frame's centre, grow, blur and burn
 * out, which is how a game cuts a menu away. The landing page arrives the other
 * way round, punching in slightly oversized and snapping back.
 *
 * The variation comes from a stable hash rather than from measured geometry, so
 * no layout is read and the movement is the same on every device.
 *
 * @typedef {object} Piece
 * @property {HTMLElement} el
 * @property {number} dx  @property {number} dy   drift while leaving, in px
 * @property {number} zoom                        growth while leaving
 * @property {number} outDelay @property {number} inDelay
 */

/** @type {Piece[][]} */
const pieces = slides.map((slide) =>
  [...slide.querySelectorAll("[data-piece]")].map((el, i) => ({
    el,
    dx: (hash(i + 3) - 0.5) * 46,
    dy: (hash(i + 7) - 0.5) * 30,
    zoom: 0.20 + 0.24 * hash(i + 11),
    outDelay: 0.05 * hash(i + 13),
    inDelay: Math.min(0.20, i * 0.026) + 0.04 * hash(i + 17),
  })),
);

/** Stable hash, 0..1. */
function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const sheets = slides.map((slide) => slide.querySelector(".sheet"));

/** Put a slide's blocks back where the layout says they belong. */
function restSlide(i) {
  for (const piece of pieces[i]) {
    piece.el.style.transform = "";
    piece.el.style.opacity = "";
    piece.el.style.filter = "";
  }
  const sheet = sheets[i];
  if (sheet) {
    sheet.style.transform = "";
    sheet.style.opacity = "";
    sheet.style.filter = "";
  }
}

/* ---------------------------------------------------------------- the tear */

/**
 * The tear: a stack of full-width panes, one per band of the frame. While the
 * page changes they rip sideways — alternating directions on the way out, so
 * the old page opens like a split seam — and then sweep across in one direction
 * as the new page lands, like a wipe with weight behind it.
 *
 * @typedef {object} Slice
 * @property {HTMLElement} el
 * @property {number} dir @property {number} travel
 * @property {number} skew @property {number} delay
 */

/** @type {Slice[]} */
const slices = [];

function buildSlices() {
  if (!sliceField) return;
  const count = 16;
  const band = 100 / count;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "slice";
    el.style.top = `${i * band}%`;
    // A hair of overlap, so no seam of the film shows between bands.
    el.style.height = `${band + 0.4}%`;
    sliceField.append(el);

    slices.push({
      el,
      // Alternating directions: the old page splits rather than slides.
      dir: i % 2 === 0 ? -1 : 1,
      travel: 62 + 46 * hash(i + 71),
      skew: (hash(i + 79) - 0.5) * 14,
      delay: 0.11 * hash(i + 83),
    });
  }
}

function paintTear(p) {
  const leaving = p < SWITCH;

  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    let shift;
    let opacity;

    if (leaving) {
      const q = clamp((p - slice.delay) / (SWITCH - slice.delay), 0, 1);
      const e = easeOutCubic(q);
      shift = slice.dir * slice.travel * e;
      // The panes are already on screen when the cut starts, so they enter
      // fast and leave as the frame empties.
      opacity = Math.min(q * 8, 1) * (1 - e) ** 1.2 * 0.6;
    } else {
      const q = clamp((p - SWITCH - slice.delay * 0.6) / (1 - SWITCH - slice.delay * 0.6), 0, 1);
      const e = easeInOutCubic(q);
      // Every band crosses the frame the same way: a wipe, not a scatter.
      shift = -slice.travel + 2 * slice.travel * e;
      opacity = (1 - Math.abs(e - 0.5) * 2) * 0.5;
    }

    slice.el.style.transform = `translate3d(${shift.toFixed(1)}%, ${(slice.skew * (leaving ? 1 : -1) * 0.4).toFixed(2)}%, 0) skewX(${(slice.skew * 0.3).toFixed(2)}deg)`;
    slice.el.style.opacity = opacity.toFixed(3);
  }
}

/**
 * The impact: a flash frame at the cut, a shockwave ring leaving from the
 * centre of the frame, and one band of light crossing the landed page.
 */
function paintImpact(p) {
  if (fxFlash) {
    fxFlash.style.opacity = (0.5 * bell(p, SWITCH, 0.042)).toFixed(3);
  }
  if (fxWave) {
    const q = clamp((p - SWITCH) / 0.34, 0, 1);
    const scale = 0.05 + 2.5 * easeOutCubic(q);
    fxWave.style.transform = `scale(${scale.toFixed(3)})`;
    fxWave.style.opacity = (0.75 * (1 - q) ** 1.6).toFixed(3);
  }
  if (fxSweep) {
    const q = clamp((p - SWITCH - 0.04) / 0.40, 0, 1);
    const travel = -40 + 190 * easeInOutCubic(q);
    fxSweep.style.transform = `translate3d(0, ${travel.toFixed(1)}vh, 0)`;
    fxSweep.style.opacity = (Math.sin(Math.PI * q) * 0.85).toFixed(3);
  }
  // The chromatic split that runs through the type while it is being cut.
  const split = p < SWITCH ? 7 * (1 - p / SWITCH) + 3 : 9 * (1 - (p - SWITCH) / SETTLE) ** 1.5;
  root.style.setProperty("--split", `${Math.max(0, split).toFixed(2)}px`);
}

/* ------------------------------------------------------------------ painting */

/**
 * The page leaving: pushed through the lens. Blocks converge a little, grow,
 * blur, and burn out, so the cut has weight without anything tumbling.
 */
function paintLeaving(slideIndex, p) {
  const sheet = sheets[slideIndex];
  const sheetQ = easeInOutCubic(clamp(p / SWITCH, 0, 1));
  if (sheet) {
    sheet.style.transform = `scale(${(1 + 0.07 * sheetQ).toFixed(4)})`;
    sheet.style.opacity = clamp(1 - sheetQ * 1.05, 0, 1).toFixed(3);
    sheet.style.filter = `blur(${(9 * sheetQ).toFixed(2)}px)`;
  }

  for (const piece of pieces[slideIndex]) {
    const window = Math.max(0.06, SWITCH - piece.outDelay);
    const q = clamp((p - piece.outDelay) / window, 0, 1);
    const e = q * q * (3 - 2 * q);

    piece.el.style.transform =
      `translate3d(${(-piece.dx * e).toFixed(1)}px, ${(-piece.dy * e).toFixed(1)}px, 0) scale(${(1 + piece.zoom * e).toFixed(4)})`;
    piece.el.style.opacity = clamp(1 - e * 1.15, 0, 1).toFixed(3);
    piece.el.style.filter = e > 0.01 ? `blur(${(7 * e).toFixed(2)}px)` : "";
  }
}

/**
 * The page landing: it punches in oversized and snaps back, each block a beat
 * behind the one above it, so the column reads as it arrives.
 */
function paintArriving(slideIndex, p) {
  const sheet = sheets[slideIndex];
  const sheetQ = clamp((p - SWITCH - 0.06) / SETTLE, 0, 1);
  const sheetE = easeOutBack(sheetQ, 1.1);
  if (sheet) {
    sheet.style.transform = `scale(${(1 + 0.06 * (1 - sheetE)).toFixed(4)})`;
    sheet.style.opacity = clamp(sheetQ * 5, 0, 1).toFixed(3);
    sheet.style.filter = sheetQ < 1 ? `blur(${(4 * (1 - sheetE)).toFixed(2)}px)` : "";
  }

  for (const piece of pieces[slideIndex]) {
    const window = Math.max(0.08, 1 - SWITCH - piece.inDelay);
    const q = clamp((p - SWITCH - piece.inDelay) / window, 0, 1);
    const e = easeOutBack(q, 1.6);

    piece.el.style.transform =
      `translate3d(0, ${(12 * (1 - e)).toFixed(2)}px, 0) scale(${e.toFixed(4)})`;
    piece.el.style.opacity = clamp(q * 3.2, 0, 1).toFixed(3);
    piece.el.style.filter = q < 0.98 ? `blur(${(5 * (1 - e)).toFixed(2)}px)` : "";
  }
}

function paint() {
  const open = moving ? bell(progress, SWITCH, 0.3) : 0;
  root.style.setProperty("--film-open", open.toFixed(3));

  if (!moving) return;

  if (from !== to) paintLeaving(from, progress);
  paintArriving(to, progress);
  fx?.classList.add("is-live");
  paintTear(progress);
  paintImpact(progress);
}

/* ------------------------------------------------------------------ palette */

/** Per slide, from the renderer: accent `r, g, b` then tint `r, g, b`. */
let slideColors = [];
const appliedMood = { accent: "", tint: "" };

const toHex = (r, g, b) =>
  "#" +
  [r, g, b]
    .map((channel) => Math.round(clamp(channel, 0, 1) * 255).toString(16).padStart(2, "0"))
    .join("");

/** Blend the two rooms either side of the transition and write them to CSS. */
function applyMood(hand) {
  if (!slideColors.length) return;
  const t = clamp(hand, 0, SLIDE_COUNT - 1);
  const lower = Math.min(Math.floor(t), SLIDE_COUNT - 2);
  const f = t - lower;
  const a = slideColors[lower];
  const b = slideColors[lower + 1];
  const mix = (i) => a[i] + (b[i] - a[i]) * f;

  const accent = [mix(0), mix(1), mix(2)];
  const tint = [mix(3), mix(4), mix(5)];
  const accentHex = toHex(...accent);
  const tintHex = toHex(...tint);
  if (accentHex === appliedMood.accent && tintHex === appliedMood.tint) return;
  appliedMood.accent = accentHex;
  appliedMood.tint = tintHex;

  const style = root.style;
  style.setProperty("--accent", accentHex);
  style.setProperty("--accent-rgb", accent.map((c) => Math.round(c * 255)).join(" "));
  style.setProperty("--tint", tintHex);
  style.setProperty("--tint-rgb", tint.map((c) => Math.round(c * 255)).join(" "));
}

/* ------------------------------------------------------------------ the deck */

const LABELS = slides.map((slide, i) => slide.getAttribute("aria-label") || tabs[i]?.textContent.trim() || `Slide ${i + 1}`);

function updateDeckChrome() {
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].setAttribute("aria-current", i === index ? "true" : "false");
  }
  if (dockIndex) dockIndex.textContent = String(index + 1).padStart(2, "0");
  if (dockName) dockName.textContent = LABELS[index];
  updatePip();
}

function updatePip() {
  const tab = tabs[index];
  if (!tab || !pip) return;
  pip.style.width = `${tab.offsetWidth}px`;
  pip.style.transform = `translate(${tab.offsetLeft}px, -50%)`;
}

function setInert(slide, inert) {
  // `inert` keeps the flying page out of the tab order; the class keeps it out
  // of sight for browsers without support.
  if ("inert" in HTMLElement.prototype) slide.inert = inert;
}

/**
 * Move to a slide. `instant` skips the choreography entirely, which is what
 * reduced-motion and the print/plain modes use.
 */
function go(target, options = {}) {
  const { instant = false, focus = true, push = true } = options;
  target = clamp(target, 0, SLIDE_COUNT - 1);
  if (moving && !instant) return;
  if (target === index && !instant) return;

  focusOnSettle = focus;

  if (reduced || instant) {
    from = target;
    to = target;
    index = target;
    progress = 1;
    moving = false;
    for (let i = 0; i < SLIDE_COUNT; i++) restSlide(i);
    settle();
    return;
  }

  from = index;
  to = target;
  index = target;
  progress = 0;
  moving = true;

  slides[from].classList.add("is-live", "is-leaving");
  setInert(slides[from], true);
  slides[to].classList.add("is-live", "is-arriving");
  setInert(slides[to], true);

  body.classList.add("is-moving");
  updateDeckChrome();
  if (announce) announce.textContent = `${index + 1} of ${SLIDE_COUNT}. ${LABELS[index]}.`;
  syncHash(push);
}

/** The transition has landed: hand the viewport to the new slide. */
function settle() {
  moving = false;
  progress = 1;
  from = to;

  body.classList.remove("is-moving");
  fx?.classList.remove("is-live");
  root.style.setProperty("--split", "0px");

  for (let i = 0; i < SLIDE_COUNT; i++) {
    const slide = slides[i];
    const current = i === index;
    slide.classList.toggle("is-live", current);
    slide.classList.toggle("is-current", current);
    slide.classList.remove("is-leaving", "is-arriving");
    slide.classList.remove("is-booting");
    setInert(slide, !current);
  }

  restSlide(index);
  restSlide(from);
  for (const slice of slices) {
    slice.el.style.transform = "";
    slice.el.style.opacity = "";
  }
  for (const node of [fxFlash, fxWave, fxSweep]) {
    if (!node) continue;
    node.style.transform = "";
    node.style.opacity = "";
  }
  root.style.setProperty("--film-open", "0");

  updateDeckChrome();

  if (focusOnSettle) {
    focusOnSettle = false;
    const heading = slides[index].querySelector("[data-piece][tabindex='-1']");
    heading?.focus({ preventScroll: true });
  }
}

function syncHash(push) {
  const id = slides[index].id;
  const url = `#${id}`;
  if (location.hash === url) return;
  // Each slide becomes a history entry, so the back button walks the deck.
  if (push) history.pushState({ slide: index }, "", url);
  else history.replaceState({ slide: index }, "", url);
}

/* ---------------------------------------------------------------- the world */

/** @type {World | null} */
let world = null;
/** @type {Float32Array | null} */
let anchorBuffer = null;
/** @type {(HTMLElement | null)[]} */
const anchorEls = [];
let anchorSizes = [];
let anchorFontSize = [];
let frameCount = 0;

function placeAnchors() {
  if (!world || !anchorBuffer) return;
  for (let i = 0; i < anchorEls.length; i++) {
    const el = anchorEls[i];
    if (!el) continue;
    const o = i * 4;
    const fade = anchorBuffer[o + 2];
    if (!(fade > 0.005)) {
      if (el.style.opacity !== "0") el.style.opacity = "0";
      continue;
    }
    const size = clamp(anchorBuffer[o + 3] * anchorSizes[i], 9, 24);
    if (Math.abs(size - anchorFontSize[i]) > 0.4) {
      anchorFontSize[i] = size;
      el.style.fontSize = `${size.toFixed(1)}px`;
    }
    el.style.transform = `translate3d(${anchorBuffer[o].toFixed(1)}px, ${anchorBuffer[o + 1].toFixed(1)}px, 0) translate(-50%, -50%)`;
    el.style.opacity = fade.toFixed(3);
  }
}

function onWorldFrame() {
  frameCount++;
  placeAnchors();
  if (frameCount === 1) {
    body.classList.add("world-live");
    body.classList.remove("film-dim");
    console.info(`[world] renderer: ${world?.adapter()}`);
  }
}

function staticView(note) {
  body.classList.add("no-gpu");
  body.classList.remove("film-dim");
  console.info(`[world] ${note}`);
}

function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  world?.set_viewport(width, height, dpr);
}

async function bootWorld() {
  if (!("gpu" in navigator)) {
    staticView("no WebGPU — static view");
    return;
  }
  try {
    await init();
    world = await WorldModule.new(canvas, onWorldFrame);

    const ids = world.anchor_ids();
    anchorBuffer = new Float32Array(ids.length * world.anchor_stride());
    anchorSizes = Array.from(world.anchor_sizes());
    anchorFontSize = new Array(ids.length).fill(0);
    for (const id of ids) anchorEls.push(document.querySelector(`[data-anchor="${id}"]`));
    world.set_anchor_buffer(anchorBuffer);

    const flat = world.palette();
    slideColors = [];
    for (let i = 0; i < flat.length; i += 6) slideColors.push(flat.slice(i, i + 6));

    sizeCanvas();
    world.set_reduced_motion(reduced);
    world.set_deck(from, to, progress);
    world.start();

    if (DEVELOPMENT) {
      Object.assign(window, {
        __world: () => world,
        __deck: () => ({ index, from, to, progress, moving, held }),
        __go: (i, options) => go(i, options),
        // Hold the transition at a given progress, for inspecting one frame.
        __hold: (p) => {
          held = false;
          if (!moving) go(index === SLIDE_COUNT - 1 ? index - 1 : index + 1);
          progress = clamp(p, 0, 1);
          held = true;
          paint();
          world?.set_deck(from, to, progress);
          return progress;
        },
        __release: () => {
          held = false;
        },
      });
    }
  } catch (error) {
    console.error("[world] renderer unavailable:", error);
    staticView("renderer unavailable — static view");
  }
}

/* ------------------------------------------------------------------- ticker */

let lastFrame = 0;

function tick(now) {
  requestAnimationFrame(tick);
  const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 1 / 60;
  lastFrame = now;

  if (moving && !held) {
    progress += dt / TRANSITION;
    if (progress >= 1) {
      progress = 1;
      settle();
    }
  }

  paint();
  applyMood(from === to ? to : from + (to - from) * smootherstep(progress));
  world?.set_deck(from, to, progress);
  if (wheelLock > 0) wheelLock -= dt;
}

/* -------------------------------------------------------------- interaction */

const scrollable = () => {
  const sheet = sheets[index];
  if (!sheet) return null;
  return sheet.scrollHeight > sheet.clientHeight + 4 ? sheet : null;
};

/** True when a scroll gesture should change slide rather than scroll the sheet. */
function freeToNavigate(deltaY) {
  const sheet = scrollable();
  if (!sheet) return true;
  if (deltaY > 0) return sheet.scrollTop + sheet.clientHeight >= sheet.scrollHeight - 2;
  return sheet.scrollTop <= 2;
}

let wheelAccum = 0;

window.addEventListener(
  "wheel",
  (event) => {
    const delta = event.deltaY;
    if (Math.abs(delta) < 3) return;
    if (moving || wheelLock > 0) return;
    if (!freeToNavigate(delta)) {
      wheelAccum = 0;
      return;
    }
    wheelAccum += delta;
    if (Math.abs(wheelAccum) < 48) return;
    const direction = wheelAccum > 0 ? 1 : -1;
    wheelAccum = 0;
    wheelLock = 0.35;
    go(index + direction);
  },
  { passive: true },
);

let touchStart = null;

window.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY, t: performance.now() };
  },
  { passive: true },
);

window.addEventListener(
  "touchend",
  (event) => {
    if (!touchStart || moving) return;
    const touch = event.changedTouches[0];
    const dy = touch.clientY - touchStart.y;
    const dx = touch.clientX - touchStart.x;
    const fast = performance.now() - touchStart.t < 600;
    touchStart = null;
    if (Math.abs(dy) < 55 || Math.abs(dx) > Math.abs(dy)) return;
    // A deliberate flick only: inside a scrollable sheet, let the sheet scroll.
    const direction = dy < 0 ? 1 : -1;
    if (!freeToNavigate(-dy)) return;
    if (!fast && Math.abs(dy) < 90) return;
    go(index + direction);
  },
  { passive: true },
);

window.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
    return;
  }

  const key = event.key;
  if (key === "ArrowDown" || key === "ArrowRight" || key === "PageDown" || key === " ") {
    event.preventDefault();
    go(index + 1);
  } else if (key === "ArrowUp" || key === "ArrowLeft" || key === "PageUp") {
    event.preventDefault();
    go(index - 1);
  } else if (key === "Home") {
    event.preventDefault();
    go(0);
  } else if (key === "End") {
    event.preventDefault();
    go(SLIDE_COUNT - 1);
  } else if (/^[1-4]$/.test(key) && Number(key) <= SLIDE_COUNT) {
    event.preventDefault();
    go(Number(key) - 1);
  }
});

document.addEventListener("click", (event) => {
  const trigger = event.target instanceof Element ? event.target.closest("[data-go]") : null;
  if (!trigger) return;
  const target = Number(trigger.dataset.go);
  if (!Number.isFinite(target)) return;
  event.preventDefault();
  go(target);
});

window.addEventListener("resize", () => {
  sizeCanvas();
  updatePip();
});

document.addEventListener("visibilitychange", () => {
  const hidden = document.hidden;
  world?.set_paused(hidden);
  if (hidden) film?.pause();
  else if (!reduced) film?.play().catch(() => {});
});

// The back button walks the deck.
window.addEventListener("popstate", () => {
  const target = slideFromHash();
  if (target !== index) go(target, { push: false, focus: false });
});

const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (finePointer) {
  window.addEventListener(
    "pointermove",
    (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -((event.clientY / window.innerHeight) * 2 - 1);
      world?.set_pointer(x, y);
    },
    { passive: true },
  );
} else {
  // Touch devices: a slow drift keeps the world alive without a cursor.
  let start = 0;
  const drift = (now) => {
    if (!start) start = now;
    const seconds = (now - start) / 1000;
    world?.set_pointer(Math.sin(seconds * 0.14) * 0.45, Math.sin(seconds * 0.09) * 0.3);
    requestAnimationFrame(drift);
  };
  requestAnimationFrame(drift);
}

/* -------------------------------------------------------------------- build */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ESCAPES[char]);

function buildProjects() {
  if (!worklist) return;
  PROJECTS.forEach((project, i) => {
    const number = String(i + 1).padStart(2, "0");
    const row = document.createElement("li");
    row.className = "work";
    row.dataset.index = String(i);
    row.innerHTML = `
      <span class="work-index">${number}</span>
      <div class="work-main">
        <p class="work-head">
          <a class="work-title" href="${project.github_url}" target="_blank" rel="noopener noreferrer"
            >${escapeHtml(project.title)}</a
          >
          ${
            project.live_url
              ? `<a class="work-live" href="${project.live_url}" target="_blank" rel="noopener noreferrer">live</a>`
              : ""
          }
        </p>
        <p class="work-desc">${escapeHtml(project.description)}</p>
        ${project.insight ? `<p class="work-insight">${escapeHtml(project.insight)}</p>` : ""}
        <ul class="work-tags">${project.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>
      </div>`;
    worklist.append(row);
  });
}

/** Read the hash on load, so a deep link opens on the right slide. */
function slideFromHash() {
  const id = location.hash.replace(/^#/, "");
  const found = slides.findIndex((slide) => slide.id === id);
  return found === -1 ? 0 : found;
}

function boot() {
  if (!deck || !canvas || slides.length !== SLIDE_COUNT) {
    throw new Error("the page markup is missing an element the deck needs");
  }

  body.classList.toggle("still", reduced);
  body.classList.add("film-dim");
  buildProjects();
  buildSlices();

  index = slideFromHash();
  from = index;
  to = index;

  if (reduced) {
    progress = 1;
    moving = false;
    for (let i = 0; i < SLIDE_COUNT; i++) restSlide(i);
    settle();
  } else {
    // The entrance is the same choreography as an arrival: the page assembles
    // out of scattered blocks and the glass closes back over it.
    progress = 0;
    moving = true;
    for (let i = 0; i < SLIDE_COUNT; i++) setInert(slides[i], i !== index);
    slides[index].classList.add("is-live", "is-current", "is-arriving");
    body.classList.add("is-moving");
  }

  updateDeckChrome();
  requestAnimationFrame(tick);

  // Chrome fades in once the film has something to show.
  const ready = () => body.classList.add("is-ready");
  if (film && film.readyState < 2) {
    film.addEventListener("loadeddata", ready, { once: true });
    window.setTimeout(ready, 1400);
  } else {
    window.setTimeout(ready, 120);
  }

  if (reduced) film?.pause();
  else film?.play().catch(() => {});

  bootWorld();
}

boot();
