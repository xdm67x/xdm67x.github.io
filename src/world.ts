import * as THREE from "three";
import skyVert from "./shaders/sky.vert?raw";
import skyFrag from "./shaders/sky.frag?raw";
import moteVert from "./shaders/mote.vert?raw";
import moteFrag from "./shaders/mote.frag?raw";

interface Biome {
  skyTop: string;
  skyBot: string;
  nebA: string;
  nebB: string;
  glow: string;
  star: string;
  ridgeTint: string;
  mote: string;
  starAmt: number;
  moonAmt: number;
  auroraAmt: number;
  haze: number;
}

const BIOMES: Biome[] = [
  // 0 — title: indigo night, gold moon
  {
    skyTop: "#05060f", skyBot: "#171b3d", nebA: "#2c2460", nebB: "#14224e",
    glow: "#f2c14e", star: "#ffe9b0", ridgeTint: "#0a0c1e", mote: "#ffd97a",
    starAmt: 0.16, moonAmt: 1.0, auroraAmt: 0.0, haze: 0.35,
  },
  // 1 — journey: dawn over the ridge
  {
    skyTop: "#0c0d26", skyBot: "#4d2b46", nebA: "#a34d57", nebB: "#5e2f5c",
    glow: "#ff9d5c", star: "#ffd7c2", ridgeTint: "#14102a", mote: "#ffb08a",
    starAmt: 0.05, moonAmt: 0.4, auroraAmt: 0.0, haze: 0.5,
  },
  // 2 — quests: crystal cave
  {
    skyTop: "#060312", skyBot: "#241040", nebA: "#7b2fa8", nebB: "#2a1c5e",
    glow: "#d966ff", star: "#e6c0ff", ridgeTint: "#0b0718", mote: "#ff9a5c",
    starAmt: 0.1, moonAmt: 0.25, auroraAmt: 0.0, haze: 0.6,
  },
  // 3 — stats: aurora fields
  {
    skyTop: "#03100f", skyBot: "#0d2b33", nebA: "#1f8a70", nebB: "#14505e",
    glow: "#7ef29d", star: "#d8ffe8", ridgeTint: "#071413", mote: "#9df5c0",
    starAmt: 0.14, moonAmt: 0.0, auroraAmt: 1.0, haze: 0.4,
  },
  // 4 — continue: starfield arena
  {
    skyTop: "#02020a", skyBot: "#14062b", nebA: "#4d2a8f", nebB: "#8c3c78",
    glow: "#b48ce8", star: "#ffffff", ridgeTint: "#05030f", mote: "#cdb0ff",
    starAmt: 0.3, moonAmt: 0.15, auroraAmt: 0.0, haze: 0.3,
  },
];

const BIOME_KEYS = [
  "skyTop", "skyBot", "nebA", "nebB", "glow", "star", "ridgeTint", "mote",
] as const;
type ColorKey = (typeof BIOME_KEYS)[number];

const FLOAT_KEYS = ["starAmt", "moonAmt", "auroraAmt", "haze"] as const;

export interface World {
  setBiome(target: number): void;
  setScroll(progress: number): void;
  setPointer(x: number, y: number): void;
  dispose(): void;
}

export function createWorld(
  canvas: HTMLCanvasElement,
  opts: { reducedMotion: boolean },
): World | null {
  THREE.ColorManagement.enabled = false;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  if (!renderer.getContext()) return null;

  const reduced = opts.reducedMotion;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Pre-bake biome palettes as THREE.Color (raw hex, no color management).
  const biomeColors: Record<ColorKey, THREE.Color[]> = {} as never;
  for (const key of BIOME_KEYS) {
    biomeColors[key] = BIOMES.map((b) => new THREE.Color(b[key]));
  }

  const skyUniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: reduced ? 7.3 : 0 },
    uScroll: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    skyTop: { value: biomeColors.skyTop[0].clone() },
    skyBot: { value: biomeColors.skyBot[0].clone() },
    nebA: { value: biomeColors.nebA[0].clone() },
    nebB: { value: biomeColors.nebB[0].clone() },
    glow: { value: biomeColors.glow[0].clone() },
    star: { value: biomeColors.star[0].clone() },
    ridgeTint: { value: biomeColors.ridgeTint[0].clone() },
    starAmt: { value: BIOMES[0].starAmt },
    moonAmt: { value: BIOMES[0].moonAmt },
    auroraAmt: { value: BIOMES[0].auroraAmt },
    haze: { value: BIOMES[0].haze },
  };

  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      uniforms: skyUniforms,
      depthWrite: false,
      depthTest: false,
    }),
  );
  sky.frustumCulled = false;
  scene.add(sky);

  // ── motes ──────────────────────────────────────────────────────
  const MOTES = 320;
  const positions = new Float32Array(MOTES * 3);
  const seeds = new Float32Array(MOTES * 3);
  for (let i = 0; i < MOTES; i++) {
    positions[i * 3] = (Math.random() * 2 - 1) * 2.2;
    positions[i * 3 + 1] = Math.random() * 2.6 - 1.3;
    positions[i * 3 + 2] = 0;
    seeds[i * 3] = Math.random();
    seeds[i * 3 + 1] = Math.random();
    seeds[i * 3 + 2] = Math.random();
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  moteGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));

  const moteUniforms = {
    uTime: skyUniforms.uTime,
    uScroll: skyUniforms.uScroll,
    uMouse: skyUniforms.uMouse,
    uDpr: { value: 1 },
    uColor: { value: biomeColors.mote[0].clone() },
    uOpacity: { value: 0.85 },
  };
  const motes = new THREE.Points(
    moteGeo,
    new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: moteVert,
      fragmentShader: moteFrag,
      uniforms: moteUniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  motes.frustumCulled = false;
  scene.add(motes);

  // ── state ─────────────────────────────────────────────────────
  let biomeTarget = 0;
  let biome = 0;
  let scrollTarget = 0;
  const pointer = new THREE.Vector2(0, 0);
  const pointerTarget = new THREE.Vector2(0, 0);

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    skyUniforms.uRes.value.set(w, h);
    moteUniforms.uDpr.value = dpr;
  }

  function applyPalette(b: number) {
    const i = Math.max(0, Math.min(BIOMES.length - 1, Math.floor(b)));
    const j = Math.min(BIOMES.length - 1, i + 1);
    const f = THREE.MathUtils.smoothstep(b - i, 0, 1);
    for (const key of BIOME_KEYS) {
      if (key === "mote") continue;
      skyUniforms[key].value.lerpColors(
        biomeColors[key][i],
        biomeColors[key][j],
        f,
      );
    }
    moteUniforms.uColor.value.lerpColors(
      biomeColors.mote[i],
      biomeColors.mote[j],
      f,
    );
    for (const key of FLOAT_KEYS) {
      skyUniforms[key].value = THREE.MathUtils.lerp(
        BIOMES[i][key],
        BIOMES[j][key],
        f,
      );
    }
  }

  resize();
  applyPalette(0);
  renderer.render(scene, camera);

  let raf = 0;
  let last = performance.now();
  let running = !reduced;

  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const k = 1 - Math.exp(-dt * 3.2);
    biome += (biomeTarget - biome) * k;
    skyUniforms.uScroll.value += (scrollTarget - skyUniforms.uScroll.value) * k;
    pointer.lerp(pointerTarget, 1 - Math.exp(-dt * 5));
    skyUniforms.uMouse.value.copy(pointer);
    skyUniforms.uTime.value += dt;
    applyPalette(biome);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function renderOnce() {
    // reduced-motion mode: advance state without animation
    biome = biomeTarget;
    skyUniforms.uScroll.value = scrollTarget;
    applyPalette(biome);
    renderer.render(scene, camera);
  }

  if (running) raf = requestAnimationFrame(frame);

  document.addEventListener("visibilitychange", () => {
    if (reduced) return;
    if (document.hidden) {
      cancelAnimationFrame(raf);
      running = false;
    } else if (!running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });

  window.addEventListener("resize", () => {
    resize();
    if (reduced) renderOnce();
  });

  return {
    setBiome(target: number) {
      biomeTarget = target;
      if (reduced) renderOnce();
    },
    setScroll(progress: number) {
      scrollTarget = progress;
      if (reduced) renderOnce();
    },
    setPointer(x: number, y: number) {
      pointerTarget.set(x, y);
    },
    dispose() {
      cancelAnimationFrame(raf);
      moteGeo.dispose();
      (sky.material as THREE.Material).dispose();
      sky.geometry.dispose();
      (motes.material as THREE.Material).dispose();
      renderer.dispose();
    },
  };
}
