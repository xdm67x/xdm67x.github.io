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
  glowAmt: number;
  mote: string;
}

const BIOMES: Biome[] = [
  // 0 — intro: indigo silk, gold breath
  {
    skyTop: "#070a18", skyBot: "#111a3a", nebA: "#1d2a5e", nebB: "#3a2f7a",
    glow: "#e5b96b", glowAmt: 0.55, mote: "#ffd98f",
  },
  // 1 — experience: dawn rose silk
  {
    skyTop: "#141126", skyBot: "#3a2242", nebA: "#7a3a54", nebB: "#9a5a3a",
    glow: "#ff9d5c", glowAmt: 0.6, mote: "#ffb08a",
  },
  // 2 — projects: violet dusk silk
  {
    skyTop: "#0b0818", skyBot: "#221040", nebA: "#4a2a7e", nebB: "#1c2a6e",
    glow: "#c9a0ff", glowAmt: 0.6, mote: "#d9b8ff",
  },
  // 3 — contact: aurora teal silk
  {
    skyTop: "#05121a", skyBot: "#0c2e33", nebA: "#14655e", nebB: "#1f8a70",
    glow: "#7ef29d", glowAmt: 0.6, mote: "#9df5c0",
  },
];

const BIOME_KEYS = [
  "skyTop", "skyBot", "nebA", "nebB", "glow", "mote",
] as const;
type ColorKey = (typeof BIOME_KEYS)[number];

const FLOAT_KEYS = ["glowAmt"] as const;

export interface World {
  setBiome(target: number): void;
  setScroll(progress: number): void;
  setPointer(x: number, y: number): void;
  setVelocity(velocity: number): void;
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
    glowAmt: { value: BIOMES[0].glowAmt },
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
  let velocity = 0;
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
    const k = 1 - Math.exp(-dt * 2.6);
    biome += (biomeTarget - biome) * k;
    skyUniforms.uScroll.value += (scrollTarget - skyUniforms.uScroll.value) * k;
    pointer.lerp(pointerTarget, 1 - Math.exp(-dt * 5));
    skyUniforms.uMouse.value.copy(pointer);
    // the world's breath quickens while traveling
    skyUniforms.uTime.value += dt * (1 + velocity * 4.5);
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
    setVelocity(v: number) {
      velocity = Math.max(0, Math.min(1, v));
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
