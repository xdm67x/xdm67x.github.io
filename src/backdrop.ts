import * as THREE from 'three'

export interface BackdropHandle {
  update(t: number, mouseNdc: THREE.Vector2, mouseTerrain: THREE.Vector3, vivid: number): void
  dispose(): void
}

// Printed manga paper opens into a softly painted anime sky.
const SCANLINE_VERT = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`

const SCANLINE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uVivid;

  varying vec2 vUv;

  void main() {
    vec2 dotUv = fract(gl_FragCoord.xy / 6.0) - 0.5;
    float dots = 1.0 - smoothstep(0.06, 0.16, length(dotUv));
    vec3 paper = vec3(0.98 - dots * 0.07);
    vec3 sky = mix(vec3(1.0, 0.94, 0.82), vec3(0.52, 0.76, 0.95), vUv.y);
    float cloud = sin(vUv.x * 12.0 + uTime * 0.015) * 0.025;
    cloud = 1.0 - smoothstep(0.015, 0.08, abs(vUv.y - 0.72 - cloud));
    sky = mix(sky, vec3(0.98, 0.98, 0.96), cloud * 0.5);
    vec3 col = mix(paper, sky, uVivid);
    gl_FragColor = vec4(col, 1.0);
  }
`

// Procedural meadow terrain: ink grid by day zero, grass and flowers as vivid rises.
const TERRAIN_VERT = /* glsl */ `
  uniform float uTime;

  varying vec3 vWorld;
  varying float vH;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec3 pos = position;
    vec2 wp = (modelMatrix * vec4(position, 1.0)).xz;
    float h = noise(wp * 0.05) * 2.2 + noise(wp * 0.18) * 0.5;
    h += sin(uTime * 0.3 + wp.x * 0.08 + wp.y * 0.12) * 0.25;
    pos.z += h;
    vH = h;
    vWorld = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
  }
`

const TERRAIN_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uVivid;
  uniform vec3 uMouse;

  varying vec3 vWorld;
  varying float vH;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 cell = vWorld.xz / 2.0;
    vec2 g = abs(fract(cell) - 0.5) / fwidth(cell);
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    float fade = smoothstep(60.0, 10.0, distance(vWorld.xz, cameraPosition.xz));
    float wave = 0.5 + 0.5 * sin(vWorld.x * 0.35 - uTime * 1.2);
    float near = smoothstep(7.0, 0.0, distance(vWorld.xz, uMouse.xz));
    float lineAlpha = line * fade * (0.3 + 0.35 * wave + 0.9 * near);

    vec4 gridInk = vec4(vec3(0.04), lineAlpha);

    vec3 grass = mix(vec3(0.3, 0.52, 0.25), vec3(0.62, 0.78, 0.34), smoothstep(0.0, 3.0, vH));
    grass *= 0.92 + 0.08 * sin(vWorld.x * 1.7 + vWorld.z * 2.3 + uTime * 0.4);
    vec4 meadow = vec4(grass, fade * 0.97);

    vec4 col = mix(gridInk, meadow, uVivid);

    float over = lineAlpha * (1.0 - uVivid * 0.8);
    col.rgb = mix(col.rgb, vec3(0.06, 0.16, 0.07), over);
    col.a = max(col.a, over);

    vec2 fcell = floor(cell);
    vec2 fr = fract(cell);
    float h = hash(fcell + 4.7);
    float has = step(0.78, h);
    vec2 fpos = vec2(hash(fcell + 9.1), hash(fcell + 2.3)) * 0.6 + 0.2;
    vec2 d = fr - fpos;
    d.x += sin(uTime * 0.8 + h * 6.28) * 0.015;
    float petal = smoothstep(0.1, 0.045, length(d));
    float core = smoothstep(0.05, 0.02, length(d));
    vec3 fcol = h > 0.93 ? vec3(0.96, 0.55, 0.72) : (h > 0.86 ? vec3(0.98, 0.85, 0.35) : vec3(1.0));
    float flowerA = (petal * 0.9 + core) * has * fade * smoothstep(0.3, 0.85, uVivid);
    col.rgb = mix(col.rgb, fcol, flowerA);
    col.a = max(col.a, flowerA);

    gl_FragColor = col;
  }
`

// Neural web: signals travel along the connections.
const WEB_LINE_VERT = /* glsl */ `
  attribute float aT;
  attribute float aPhase;

  varying float vT;
  varying float vPhase;

  void main() {
    vT = aT;
    vPhase = aPhase;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const WEB_LINE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uVivid;

  varying float vT;
  varying float vPhase;

  void main() {
    float p = fract(vT - uTime * 0.35 + vPhase);
    float head = smoothstep(0.25, 0.0, p);
    vec3 col = mix(vec3(0.05), vec3(0.3, 0.55, 0.95), uVivid);
    gl_FragColor = vec4(col, 0.12 + head * 0.75);
  }
`

// Nodes and ambient specks: twinkle, size attenuation, color with vivid.
const SPECK_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;

  uniform float uTime;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float tw = 0.55 + 0.45 * sin(uTime * 1.5 + aPhase);
    vAlpha = tw;
    vColor = aColor;
    gl_PointSize = aSize * tw * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const SPECK_FRAG = /* glsl */ `
  uniform float uVivid;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vAlpha;
    vec3 col = mix(vec3(0.08), vColor, uVivid);
    gl_FragColor = vec4(col, a);
  }
`

const SPECK_PALETTE: number[][] = [
  [0.95, 0.55, 0.72],
  [0.98, 0.85, 0.35],
  [0.55, 0.75, 0.95],
  [0.6, 0.85, 0.55],
  [0.85, 0.6, 0.9],
]

interface Butterfly {
  group: THREE.Group
  pivotL: THREE.Group
  pivotR: THREE.Group
  material: THREE.MeshBasicMaterial
  speed: number
  phase: number
  cx: number
  cz: number
  rx: number
  rz: number
  baseY: number
}

const BUTTERFLY_COLORS = [0xe88bb4, 0xf0a24a, 0x7aa8f0, 0xf0d24a, 0xb98bf0, 0x7fd9a8]

function createButterfly(index: number, wingGeometry: THREE.CircleGeometry): Butterfly {
  const color = BUTTERFLY_COLORS[index % BUTTERFLY_COLORS.length] ?? 0xe88bb4
  const group = new THREE.Group()
  const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })

  const pivotL = new THREE.Group()
  const pivotR = new THREE.Group()
  const wingL = new THREE.Mesh(wingGeometry, material)
  const wingR = new THREE.Mesh(wingGeometry, material)
  wingL.scale.set(1.1, 0.7, 1)
  wingR.scale.set(1.1, 0.7, 1)
  wingL.position.z = -0.2
  wingR.position.z = 0.2
  pivotL.add(wingL)
  pivotR.add(wingR)
  group.add(pivotL, pivotR)
  group.scale.setScalar(0.001)

  return {
    group,
    pivotL,
    pivotR,
    material,
    speed: 0.35 + Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
    cx: -6 + Math.random() * 44,
    cz: -14 + Math.random() * 16,
    rx: 2 + Math.random() * 3,
    rz: 1 + Math.random() * 2,
    baseY: -1.4 + Math.random() * 0.8,
  }
}

export function createBackdrop(scene: THREE.Scene): BackdropHandle {
  const disposables: Array<{ dispose(): void }> = []
  const vivid = { value: 0 }

  const scanTime = { value: 0 }
  const scanlines = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      vertexShader: SCANLINE_VERT,
      fragmentShader: SCANLINE_FRAG,
      uniforms: { uTime: scanTime, uVivid: vivid },
      depthTest: false,
      depthWrite: false,
    }),
  )
  scanlines.frustumCulled = false
  scanlines.renderOrder = -2
  scene.add(scanlines)
  disposables.push(scanlines.geometry, scanlines.material as THREE.Material)

  const terrainTime = { value: 0 }
  const terrainMouse = { value: new THREE.Vector3(99, 99, 99) }
  const terrainGeometry = new THREE.PlaneGeometry(170, 90, 170, 90)
  const terrainMaterial = new THREE.ShaderMaterial({
    vertexShader: TERRAIN_VERT,
    fragmentShader: TERRAIN_FRAG,
    uniforms: { uTime: terrainTime, uVivid: vivid, uMouse: terrainMouse },
    transparent: true,
    depthWrite: false,
  })
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
  terrain.rotation.x = -Math.PI / 2
  terrain.position.set(15, -4.5, -6)
  scene.add(terrain)
  disposables.push(terrainGeometry, terrainMaterial)

  // Neural web: nodes in a sky slab, each wired to its nearest neighbors.
  const NODE_COUNT = 48
  const nodes: THREE.Vector3[] = []
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push(
      new THREE.Vector3(Math.random() * 52 - 10, 2.5 + Math.random() * 5, -8 + Math.random() * 10),
    )
  }
  const edgeKeys = new Set<string>()
  const edges: Array<[number, number]> = []
  for (let i = 0; i < NODE_COUNT; i++) {
    const distances = nodes
      .map((node, j) => ({ j, d: node.distanceTo(nodes[i] ?? new THREE.Vector3()) }))
      .filter((entry) => entry.j !== i)
      .toSorted((a, b) => a.d - b.d)
    for (const near of distances.slice(0, 2)) {
      const key = `${Math.min(i, near.j)}-${Math.max(i, near.j)}`
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key)
        edges.push([i, near.j])
      }
    }
  }

  const web = new THREE.Group()
  scene.add(web)

  const webTime = { value: 0 }
  const linePositions = new Float32Array(edges.length * 2 * 3)
  const lineT = new Float32Array(edges.length * 2)
  const linePhase = new Float32Array(edges.length * 2)
  edges.forEach(([a, b], index) => {
    const from = nodes[a]
    const to = nodes[b]
    if (!from || !to) return
    linePositions.set([from.x, from.y, from.z], index * 6)
    linePositions.set([to.x, to.y, to.z], index * 6 + 3)
    const phase = Math.random()
    linePhase[index * 2] = phase
    linePhase[index * 2 + 1] = phase
  })
  for (let index = 0; index < edges.length; index++) {
    lineT[index * 2] = 0
    lineT[index * 2 + 1] = 1
  }
  const webGeometry = new THREE.BufferGeometry()
  webGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
  webGeometry.setAttribute('aT', new THREE.BufferAttribute(lineT, 1))
  webGeometry.setAttribute('aPhase', new THREE.BufferAttribute(linePhase, 1))
  const webMaterial = new THREE.ShaderMaterial({
    vertexShader: WEB_LINE_VERT,
    fragmentShader: WEB_LINE_FRAG,
    uniforms: { uTime: webTime, uVivid: vivid },
    transparent: true,
    depthWrite: false,
  })
  const webLines = new THREE.LineSegments(webGeometry, webMaterial)
  web.add(webLines)
  disposables.push(webGeometry, webMaterial)

  const nodeTime = { value: 0 }
  const nodeGeometry = new THREE.BufferGeometry()
  const nodePositions = new Float32Array(NODE_COUNT * 3)
  const nodeSizes = new Float32Array(NODE_COUNT)
  const nodePhases = new Float32Array(NODE_COUNT)
  const nodeColors = new Float32Array(NODE_COUNT * 3)
  nodes.forEach((node, index) => {
    nodePositions[index * 3 + 0] = node.x
    nodePositions[index * 3 + 1] = node.y
    nodePositions[index * 3 + 2] = node.z
    nodeSizes[index] = 2 + Math.random() * 2.5
    nodePhases[index] = Math.random() * Math.PI * 2
    const palette = SPECK_PALETTE[index % SPECK_PALETTE.length] ?? [0.5, 0.5, 0.5]
    nodeColors.set(palette, index * 3)
  })
  nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
  nodeGeometry.setAttribute('aSize', new THREE.BufferAttribute(nodeSizes, 1))
  nodeGeometry.setAttribute('aPhase', new THREE.BufferAttribute(nodePhases, 1))
  nodeGeometry.setAttribute('aColor', new THREE.BufferAttribute(nodeColors, 3))
  const nodeMaterial = new THREE.ShaderMaterial({
    vertexShader: SPECK_VERT,
    fragmentShader: SPECK_FRAG,
    uniforms: { uTime: nodeTime, uVivid: vivid },
    transparent: true,
    depthWrite: false,
  })
  web.add(new THREE.Points(nodeGeometry, nodeMaterial))
  disposables.push(nodeGeometry, nodeMaterial)

  // Ambient specks along the whole journey.
  const SPECK_COUNT = 600
  const speckTime = { value: 0 }
  const speckPositions = new Float32Array(SPECK_COUNT * 3)
  const speckSizes = new Float32Array(SPECK_COUNT)
  const speckPhases = new Float32Array(SPECK_COUNT)
  const speckColors = new Float32Array(SPECK_COUNT * 3)
  for (let i = 0; i < SPECK_COUNT; i++) {
    speckPositions[i * 3 + 0] = Math.random() * 52 - 10
    speckPositions[i * 3 + 1] = (Math.random() - 0.5) * 16
    speckPositions[i * 3 + 2] = (Math.random() - 0.5) * 18 - 2
    speckSizes[i] = 0.4 + Math.random() * 1.4
    speckPhases[i] = Math.random() * Math.PI * 2
    const palette = SPECK_PALETTE[Math.floor(Math.random() * SPECK_PALETTE.length)] ?? [
      0.5, 0.5, 0.5,
    ]
    speckColors.set(palette, i * 3)
  }
  const speckGeometry = new THREE.BufferGeometry()
  speckGeometry.setAttribute('position', new THREE.BufferAttribute(speckPositions, 3))
  speckGeometry.setAttribute('aSize', new THREE.BufferAttribute(speckSizes, 1))
  speckGeometry.setAttribute('aPhase', new THREE.BufferAttribute(speckPhases, 1))
  speckGeometry.setAttribute('aColor', new THREE.BufferAttribute(speckColors, 3))
  const speckMaterial = new THREE.ShaderMaterial({
    vertexShader: SPECK_VERT,
    fragmentShader: SPECK_FRAG,
    uniforms: { uTime: speckTime, uVivid: vivid },
    transparent: true,
    depthWrite: false,
  })
  scene.add(new THREE.Points(speckGeometry, speckMaterial))
  disposables.push(speckGeometry, speckMaterial)

  // Butterflies wake up as the world turns colorful.
  const butterflies: Butterfly[] = []
  const wingGeometry = new THREE.CircleGeometry(0.22, 10)
  disposables.push(wingGeometry)
  for (let i = 0; i < 8; i++) {
    const butterfly = createButterfly(i, wingGeometry)
    butterflies.push(butterfly)
    scene.add(butterfly.group)
    disposables.push(butterfly.material)
  }

  return {
    update(
      t: number,
      mouseNdc: THREE.Vector2,
      mouseTerrain: THREE.Vector3,
      vividness: number,
    ): void {
      vivid.value = vividness
      scanTime.value = t
      terrainTime.value = t
      webTime.value = t
      nodeTime.value = t
      speckTime.value = t
      terrainMouse.value.copy(mouseTerrain)
      web.position.x = mouseNdc.x * 0.5
      web.position.y = mouseNdc.y * 0.35

      const wake = Math.max(0.001, smoothstep(0.45, 0.9, vividness))
      for (const butterfly of butterflies) {
        const wander = t * butterfly.speed + butterfly.phase
        const x = butterfly.cx + Math.sin(wander * 0.6) * butterfly.rx
        const z = butterfly.cz + Math.sin(wander * 0.83 + 1.7) * butterfly.rz
        const y = butterfly.baseY + Math.sin(wander * 1.4) * 0.6
        butterfly.group.position.set(x, y, z)

        const dx = Math.cos(wander * 0.6) * butterfly.rx * 0.6 * butterfly.speed
        const dz = Math.cos(wander * 0.83 + 1.7) * butterfly.rz * 0.83 * butterfly.speed
        butterfly.group.rotation.y = Math.atan2(dz, dx)

        const flap = Math.sin(t * 10 + butterfly.phase) * 0.85
        butterfly.pivotL.rotation.x = flap
        butterfly.pivotR.rotation.x = -flap
        butterfly.group.scale.setScalar(wake)
      }
    },

    dispose(): void {
      for (const disposable of disposables) {
        disposable.dispose()
      }
    },
  }
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const k = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return k * k * (3 - 2 * k)
}
