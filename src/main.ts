import { animate, onScroll, stagger, utils } from 'animejs'

import { foldGeometry, toClipPath } from './fold'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pages = [...document.querySelectorAll<HTMLElement>('.page')]
const book = document.querySelector<HTMLElement>('.book')!
const stage = document.querySelector<HTMLElement>('.stage')!
const turnsCount = pages.length - 1
const revealed = new Set<number>()

const leaves = pages.map((page) => {
  const leaf = page.closest<HTMLElement>('.leaf')!
  return {
    page,
    leaf,
    fold: leaf.querySelector<HTMLElement>('.leaf__fold')!,
    crease: leaf.querySelector<HTMLElement>('.leaf__crease')!,
  }
})

const emptyClip = 'polygon(0px 0px, 0px 0px, 0px 0px)'

if (reduceMotion) document.documentElement.classList.add('reduce')

const maxScroll = () => Math.max(0, book.offsetHeight - innerHeight)

// Hero name lines rise out of their masks.
const heroName = document.querySelector<HTMLElement>('.hero__name')
if (heroName) {
  if (!reduceMotion) {
    animate('.hero__line', {
      translateY: ['110%', '0%'],
      opacity: [0, 1],
      duration: 1100,
      delay: stagger(110, { start: 120 }),
      ease: 'out(4)',
    })
  }
  heroName.style.visibility = 'visible'
}

// Stagger a page's content in, once, when the page is uncovered.
const reveal = (page: HTMLElement) => {
  const items = page.querySelectorAll('.reveal')
  if (!items.length) return
  if (reduceMotion) {
    utils.set(items, { opacity: 1, translateY: 0 })
    return
  }
  animate(items, {
    opacity: [0, 1],
    translateY: [24, 0],
    duration: 850,
    delay: stagger(70, { start: 120 }),
    ease: 'out(3)',
  })
}

// Paint the peel for a single leaf at a given turn progress.
// ponytail: the peel is a flat corner fold; the paper back and shadowed crease
// sell the curl. True curved paper needs a WebGL mesh and a DOM-to-texture
// pass, which is not worth the fragility for four static chapters.
const drawFold = (
  page: HTMLElement,
  fold: HTMLElement,
  crease: HTMLElement,
  progress: number,
  w: number,
  h: number,
) => {
  if (progress <= 0.002) {
    page.style.clipPath = 'none'
    fold.style.clipPath = emptyClip
    crease.style.opacity = '0'
    return
  }

  if (progress >= 0.998) {
    page.style.clipPath = emptyClip
    fold.style.clipPath = emptyClip
    crease.style.opacity = '0'
    return
  }

  const g = foldGeometry(w, h, progress)

  page.style.clipPath = toClipPath(g.front)
  fold.style.clipPath = toClipPath(g.flap)
  fold.style.setProperty('--fold-angle', `${g.crease.angle}deg`)
  crease.style.transform = `translate(-50%, -50%) rotate(${g.crease.angle}deg) translateY(${-g.crease.distance}px)`
  crease.style.opacity = String(g.crease.opacity)
}

// Paint a scroll progress (0..1 across the whole book) into the leaves.
const render = (progress: number) => {
  const p = progress * turnsCount
  const active = reduceMotion
    ? Math.round(utils.clamp(p, 0, turnsCount))
    : Math.floor(utils.clamp(p + 0.01, 0, turnsCount))
  const w = pages[0].clientWidth || innerWidth
  const h = pages[0].clientHeight || innerHeight

  leaves.forEach(({ page, leaf, fold, crease }, i) => {
    leaf.classList.toggle('is-active', i === active)
    page.toggleAttribute('inert', i !== active) // keep hidden pages out of the tab order

    if (!revealed.has(i) && p >= i - 0.45) {
      revealed.add(i)
      reveal(page)
    }

    const local = utils.clamp(p - i, 0, 1)
    leaf.classList.toggle('is-turning', !reduceMotion && i < turnsCount && local > 0 && local < 1)

    if (reduceMotion || i === turnsCount) {
      page.style.clipPath = 'none'
      fold.style.clipPath = emptyClip
      crease.style.opacity = '0'
      return
    }

    drawFold(page, fold, crease, local, w, h)
  })
}

/* Smooth follow: the leaves ease toward the scroll position instead of
   snapping to every wheel notch. */

let target = 0
let current = 0
let raf = 0
let lastTime = 0

const tick = (time: number) => {
  const dt = Math.min(Math.max(time - lastTime, 8), 64)
  lastTime = time
  current += (target - current) * (1 - Math.exp(-dt / 110))
  if (Math.abs(target - current) < 0.0004) current = target
  render(current)
  raf = current === target ? 0 : requestAnimationFrame(tick)
}

const requestTick = () => {
  if (raf) return
  lastTime = performance.now()
  raf = requestAnimationFrame(tick)
}

/* Settle on the nearest page after scrolling stops, so a leaf never rests
   half-peeled. */

let snap: ReturnType<typeof animate> | null = null
let snapTimer = 0
let snapping = false

const stopSnap = () => {
  if (snap) snap.cancel()
  snap = null
  snapping = false
}

const snapTo = (progress: number) => {
  const to = utils.clamp(progress, 0, 1) * maxScroll()
  if (Math.abs(to - scrollY) < 1) return

  stopSnap()
  if (reduceMotion) {
    scrollTo(0, to)
    return
  }

  snapping = true
  const proxy = { y: scrollY }
  snap = animate(proxy, {
    y: to,
    duration: 480 + Math.min(Math.abs(to - proxy.y) / innerHeight, 2) * 160,
    ease: 'out(4)',
    onUpdate: () => scrollTo(0, proxy.y),
    onComplete: () => {
      snapping = false
      snap = null
    },
  })
}

const scheduleSnap = () => {
  if (reduceMotion || dragging || snapping) return
  clearTimeout(snapTimer)
  snapTimer = window.setTimeout(() => {
    if (dragging || snapping) return
    const distance = maxScroll()
    if (!distance) return
    snapTo(Math.round((scrollY / distance) * turnsCount) / turnsCount)
  }, 170)
}

const updateTarget = (progress: number) => {
  target = progress
  if (reduceMotion || dragging) {
    current = target
    render(current)
    return
  }
  requestTick()
  scheduleSnap()
}

/* Drag to peel: a horizontal drag scrubs the book, then settles on a page. */

let dragging = false
let dragIntent = false
let dragX = 0
let dragY = 0
let dragScroll = 0
let suppressClick = false

const isInteractive = (el: EventTarget | null) =>
  el instanceof Element && Boolean(el.closest('a, button, input, textarea, select'))

stage.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  if (isInteractive(event.target)) return
  dragging = true
  dragIntent = false
  dragX = event.clientX
  dragY = event.clientY
  dragScroll = scrollY
  clearTimeout(snapTimer)
  stopSnap()
})

stage.addEventListener('pointermove', (event) => {
  if (!dragging) return
  const dx = event.clientX - dragX
  const dy = event.clientY - dragY

  if (!dragIntent) {
    if (Math.abs(dx) < 8) return
    if (event.pointerType !== 'mouse' && Math.abs(dx) < Math.abs(dy) * 1.2) {
      dragging = false // vertical intent: let the browser scroll
      scheduleSnap()
      return
    }
    dragIntent = true
    stage.setPointerCapture(event.pointerId)
    document.documentElement.classList.add('is-dragging')
  }

  const factor = innerHeight / (innerWidth * 0.62)
  scrollTo(0, utils.clamp(dragScroll - dx * factor, 0, maxScroll()))
})

const endDrag = () => {
  if (!dragging) return
  const turned = dragIntent
  dragging = false
  dragIntent = false
  document.documentElement.classList.remove('is-dragging')
  if (turned) {
    suppressClick = true
    window.setTimeout(() => {
      suppressClick = false
    }, 250)
  }
  scheduleSnap()
}

stage.addEventListener('pointerup', endDrag)
stage.addEventListener('pointercancel', endDrag)

// A drag should not also open whatever card it ended on.
stage.addEventListener(
  'click',
  (event) => {
    if (!suppressClick) return
    suppressClick = false
    event.preventDefault()
    event.stopPropagation()
  },
  true,
)

// User input interrupts a settling animation.
window.addEventListener('wheel', stopSnap, { passive: true })
window.addEventListener('touchstart', stopSnap, { passive: true })

// Arrow / page keys move whole pages instead of 40px.
window.addEventListener('keydown', (event) => {
  const el = event.target
  if (el instanceof Element && el.closest('input, textarea, select')) return
  const here = Math.round((scrollY / (maxScroll() || 1)) * turnsCount)
  let next = here
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
    case 'PageDown':
      next = here + 1
      break
    case 'ArrowUp':
    case 'ArrowLeft':
    case 'PageUp':
      next = here - 1
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = turnsCount
      break
    default:
      return
  }
  event.preventDefault()
  stopSnap()
  snapTo(utils.clamp(next, 0, turnsCount) / turnsCount)
})

addEventListener('resize', () => render(current))

onScroll({
  target: '.book',
  enter: 'top top',
  leave: 'bottom bottom',
  onUpdate: (self) => updateTarget(self.progress),
})

render(0)
