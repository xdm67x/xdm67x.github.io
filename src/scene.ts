import * as THREE from 'three'
import { createBackdrop } from './backdrop'
import { createWorld } from './world'

export interface SceneHandle {
  setChapterProgress(index: number, progress: number): void
  setVivid(progress: number): void
  dispose(): void
}

const CAMERA_DISTANCE = 7
const CAMERA_FOV = 42
const CHAPTER_COUNT = 4
const ORIGIN_Z = -3
const TERRAIN_Y = -4.5

interface Pointer {
  x: number
  y: number
}

export function createScene(container: HTMLElement): SceneHandle {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true })
  } catch {
    container.dataset.webgl = 'unsupported'
    return {
      setChapterProgress(): void {},
      setVivid(): void {},
      dispose(): void {},
    }
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 120)
  camera.position.set(0, 0, CAMERA_DISTANCE)

  const backdrop = createBackdrop(scene)
  const world = createWorld()
  scene.add(world.group)

  const pointer: Pointer = { x: 0, y: 0 }
  const target: Pointer = { x: 0, y: 0 }
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  let reducedMotion = motionQuery.matches
  const onPointerMove = (event: PointerEvent): void => {
    if (reducedMotion) return
    target.x = (event.clientX / window.innerWidth) * 2 - 1
    target.y = -((event.clientY / window.innerHeight) * 2 - 1)
  }
  window.addEventListener('pointermove', onPointerMove)

  const chapterProgress: number[] = [0, 0, 0, 0]
  let vividTarget = 0
  let vivid = 0

  const raycaster = new THREE.Raycaster()
  const rayNdc = new THREE.Vector2()
  const originPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -ORIGIN_Z)
  const terrainPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TERRAIN_Y)
  const pointerWorld = new THREE.Vector3(99, 99, 99)
  const pointerTerrain = new THREE.Vector3(99, 99, 99)
  const mouseNdc = new THREE.Vector2()

  const clock = new THREE.Clock()
  const render = (): void => {
    const t = reducedMotion ? 0 : clock.getElapsedTime()

    pointer.x = reducedMotion ? 0 : pointer.x + (target.x - pointer.x) * 0.05
    pointer.y = reducedMotion ? 0 : pointer.y + (target.y - pointer.y) * 0.05

    // Camera rides the chapters, with a light pointer parallax on top.
    const about = reducedMotion ? 0 : (chapterProgress[0] ?? 0)
    const experience = reducedMotion ? 0 : (chapterProgress[1] ?? 0)
    const work = reducedMotion ? 0 : (chapterProgress[2] ?? 0)
    const contact = reducedMotion ? 0 : (chapterProgress[3] ?? 0)
    const travel = 10 * (experience + work)
    const smoothing = reducedMotion ? 1 : 0.05
    camera.position.x += (travel + pointer.x * 0.7 - camera.position.x) * smoothing
    camera.position.y += (contact * 6 + pointer.y * 0.45 - camera.position.y) * smoothing
    camera.position.z +=
      (CAMERA_DISTANCE - about * 2.5 + contact * 9 - camera.position.z) * smoothing
    camera.updateMatrixWorld()

    rayNdc.set(pointer.x, pointer.y)
    raycaster.setFromCamera(rayNdc, camera)
    if (!raycaster.ray.intersectPlane(originPlane, pointerWorld)) {
      pointerWorld.set(99, 99, 99)
    }
    if (!raycaster.ray.intersectPlane(terrainPlane, pointerTerrain)) {
      pointerTerrain.set(99, 99, 99)
    }

    mouseNdc.set(pointer.x, pointer.y)
    vivid = reducedMotion ? vividTarget : vivid + (vividTarget - vivid) * 0.03
    backdrop.update(t, mouseNdc, pointerTerrain, vivid)
    world.update(t, chapterProgress, pointerWorld, vivid)
    renderer.render(scene, camera)
  }

  const resize = (): void => {
    const { clientWidth: width, clientHeight: height } = container
    if (width === 0 || height === 0) return
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    render()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(container)
  resize()

  const updateMotion = (): void => {
    reducedMotion = motionQuery.matches
    target.x = 0
    target.y = 0
    renderer.setAnimationLoop(reducedMotion ? null : render)
    render()
  }
  motionQuery.addEventListener('change', updateMotion)
  updateMotion()

  return {
    setChapterProgress(index: number, progress: number): void {
      if (index >= 0 && index < CHAPTER_COUNT) {
        chapterProgress[index] = progress
        if (reducedMotion) render()
      }
    },

    setVivid(progress: number): void {
      vividTarget = progress
      if (reducedMotion) render()
    },

    dispose(): void {
      renderer.setAnimationLoop(null)
      window.removeEventListener('pointermove', onPointerMove)
      motionQuery.removeEventListener('change', updateMotion)
      observer.disconnect()
      world.dispose()
      backdrop.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
