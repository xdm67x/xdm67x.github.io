import * as THREE from 'three'

export interface WorldHandle {
  group: THREE.Group
  update(t: number, progress: readonly number[], pointerWorld: THREE.Vector3, vivid: number): void
  dispose(): void
}

const SHARD_COLORS: number[][] = [
  [0.95, 0.55, 0.72],
  [0.98, 0.85, 0.35],
  [0.4, 0.6, 0.95],
  [0.95, 0.6, 0.25],
  [0.7, 0.45, 0.9],
  [0.5, 0.8, 0.4],
]

// Manga screentones dissolve into cel-shaded color, keeping the ink silhouette.
const GOO_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform vec3 uMouse;

  varying vec3 vNormal;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  void main() {
    vNormal = normalMatrix * normal;
    vec3 pos = position;
    float d = noise(position * 1.4 + uTime * 0.35);
    float pull = smoothstep(2.2, 0.0, distance(uMouse, position));
    pos += normal * d * (0.1 + pull * 0.3) * uAmp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const GOO_FRAG = /* glsl */ `
  uniform float uVivid;
  uniform vec3 uColor;

  varying vec3 vNormal;

  void main() {
    vec3 n = normalize(vNormal);
    float lambert = dot(n, normalize(vec3(0.4, 0.75, 0.55))) * 0.5 + 0.5;
    float bands = floor(lambert * 3.0) / 3.0;
    float edge = smoothstep(0.16, 0.26, abs(n.z));
    vec2 dotUv = fract(gl_FragCoord.xy / 5.0) - 0.5;
    float dotRadius = mix(0.38, 0.06, bands);
    float tone = 1.0 - smoothstep(dotRadius - 0.05, dotRadius, length(dotUv));
    vec3 mono = mix(vec3(0.94), vec3(0.12), tone * (1.0 - bands * 0.6));
    vec3 tint = mix(uColor * 0.42, uColor, bands);
    tint = mix(tint, vec3(1.0, 0.96, 0.83), step(0.72, lambert) * 0.45);
    mono = mix(vec3(0.06), mono, edge);
    tint = mix(vec3(0.07, 0.08, 0.12), tint, edge);
    gl_FragColor = vec4(mix(mono, tint, uVivid), 1.0);
  }
`

interface Goo {
  material: THREE.ShaderMaterial
  time: { value: number }
  mouse: { value: THREE.Vector3 }
  vivid: { value: number }
}

function gooMaterial(amp: number, color: number[], vivid: { value: number }): Goo {
  const time = { value: 0 }
  const mouse = { value: new THREE.Vector3(99, 99, 99) }
  const material = new THREE.ShaderMaterial({
    vertexShader: GOO_VERT,
    fragmentShader: GOO_FRAG,
    uniforms: {
      uTime: time,
      uAmp: { value: amp },
      uMouse: mouse,
      uVivid: vivid,
      uColor: { value: new THREE.Vector3(color[0] ?? 0.5, color[1] ?? 0.5, color[2] ?? 0.5) },
    },
  })
  return { material, time, mouse, vivid }
}

function reveal(progress: number): number {
  const k = Math.min(1, Math.max(0, progress * 2.2))
  return 0.001 + (1 - Math.pow(1 - k, 3)) * 0.999
}

export function createWorld(): WorldHandle {
  const group = new THREE.Group()
  const vivid = { value: 0 }
  const goos: Goo[] = []
  const materials = new Set<THREE.Material>()
  const geometries = new Set<THREE.BufferGeometry>()
  const track = (mesh: THREE.Mesh): void => {
    geometries.add(mesh.geometry)
    materials.add(mesh.material as THREE.Material)
  }

  // Chapter 01 — The Origin: a breathing planet, present from the hero on.
  const origin = new THREE.Group()
  origin.position.set(0, 0.6, -3)
  const originGoo = gooMaterial(1.6, [0.89, 0.45, 0.27], vivid)
  goos.push(originGoo)
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 4), originGoo.material)
  const moonGoo = gooMaterial(0.4, [0.98, 0.9, 0.55], vivid)
  goos.push(moonGoo)
  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 2), moonGoo.material)
  origin.add(core, moon)
  track(core)
  track(moon)

  // Chapter 02 — The Craft: an orbital ring carrying three nodes.
  const craft = new THREE.Group()
  craft.position.set(10, -0.5, -4)
  const ringGoo = gooMaterial(0.3, [0.2, 0.62, 0.58], vivid)
  goos.push(ringGoo)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.14, 16, 64), ringGoo.material)
  ring.rotation.x = Math.PI / 2.4
  craft.add(ring)
  track(ring)
  const nodes: THREE.Mesh[] = []
  for (let i = 0; i < 3; i++) {
    const size = [0.5, 0.38, 0.3][i] ?? 0.4
    const node = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), ringGoo.material)
    const angle = (i / 3) * Math.PI * 2
    node.position.set(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0)
    ring.add(node)
    track(node)
    nodes.push(node)
  }

  // Chapter 03 — The Playground: a drifting crystal field.
  const playground = new THREE.Group()
  playground.position.set(20, 0.8, -3)
  const shards: THREE.Mesh[] = []
  for (let i = 0; i < 6; i++) {
    const shardGoo = gooMaterial(
      0.5,
      SHARD_COLORS[i % SHARD_COLORS.length] ?? [0.5, 0.5, 0.5],
      vivid,
    )
    goos.push(shardGoo)
    const geometry =
      i % 2 === 0
        ? new THREE.OctahedronGeometry(0.5 + Math.random() * 0.35)
        : new THREE.IcosahedronGeometry(0.4 + Math.random() * 0.3, 0)
    const shard = new THREE.Mesh(geometry, shardGoo.material)
    shard.position.set(
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 3.5,
      (Math.random() - 0.5) * 3.5,
    )
    shard.userData.speed = 0.3 + Math.random() * 0.5
    shard.userData.phase = Math.random() * Math.PI * 2
    shard.userData.baseY = shard.position.y
    shards.push(shard)
    playground.add(shard)
    track(shard)
  }

  craft.scale.setScalar(0.001)
  playground.scale.setScalar(0.001)
  group.add(origin, craft, playground)

  return {
    group,

    update(
      t: number,
      progress: readonly number[],
      pointerWorld: THREE.Vector3,
      vividness: number,
    ): void {
      vivid.value = vividness
      for (const goo of goos) {
        goo.time.value = t
      }

      // The planet bulges toward the pointer.
      originGoo.mouse.value.copy(pointerWorld).sub(origin.position)

      const orbit = t * 0.35
      moon.position.set(Math.cos(orbit) * 3, Math.sin(orbit) * 1.2, Math.sin(orbit) * 3)

      craft.scale.setScalar(reveal(progress[1] ?? 0))
      ring.rotation.z = t * 0.15
      for (const node of nodes) {
        node.rotation.x = t * 0.6
        node.rotation.y = t * 0.4
      }

      playground.scale.setScalar(reveal(progress[2] ?? 0))
      playground.rotation.y = t * 0.06
      for (const shard of shards) {
        const speed = shard.userData.speed as number
        const phase = shard.userData.phase as number
        const baseY = shard.userData.baseY as number
        shard.rotation.x = t * speed
        shard.rotation.y = t * speed * 0.7
        shard.position.y = baseY + Math.sin(t * 0.9 + phase) * 0.15
      }
    },

    dispose(): void {
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
    },
  }
}
