export type Point = { x: number; y: number }

export type FoldGeometry = {
  front: Point[]
  flap: Point[]
  crease: {
    /** Signed distance from the page centre to the fold line, along the fold normal. */
    distance: number
    /** Crease strip rotation in CSS degrees. */
    angle: number
    opacity: number
  }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

const clipHalfPlane = (poly: Point[], signed: (p: Point) => number): Point[] => {
  const out: Point[] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const da = signed(a)
    const db = signed(b)

    if (da <= 0) out.push(a)
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db)
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  return out
}

const clipToPage = (poly: Point[], w: number, h: number): Point[] => {
  let out = poly
  out = clipHalfPlane(out, (p) => -p.x)
  out = clipHalfPlane(out, (p) => p.x - w)
  out = clipHalfPlane(out, (p) => -p.y)
  out = clipHalfPlane(out, (p) => p.y - h)
  return out
}

export const polygonArea = (poly: Point[]): number => {
  let area = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    area += a.x * b.y - b.x * a.y
  }
  return Math.abs(area) / 2
}

/**
 * Corner peel geometry.
 *
 * The fold line is perpendicular to the page diagonal and sweeps from the
 * bottom-right corner (progress 0) to the top-left corner (progress 1). The
 * front page keeps the region behind the fold; the folded part is reflected
 * across the line and clipped to the page to form the visible paper back.
 */
export const foldGeometry = (w: number, h: number, progress: number): FoldGeometry => {
  const p = clamp01(progress)
  const diagonal = Math.hypot(w, h)
  const nx = w / diagonal
  const ny = h / diagonal
  const c = (1 - p) * diagonal
  const signed = (q: Point) => nx * q.x + ny * q.y - c

  const page: Point[] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ]

  const front = clipHalfPlane(page, signed)

  const reflected = page.map((q) => {
    const d = signed(q)
    return { x: q.x - 2 * d * nx, y: q.y - 2 * d * ny }
  })
  const flap = clipToPage(clipHalfPlane(reflected, signed), w, h)

  return {
    front: polygonArea(front) > 0.5 ? front : [],
    flap: polygonArea(flap) > 0.5 ? flap : [],
    crease: {
      distance: c - diagonal / 2,
      angle: (Math.atan2(nx, -ny) * 180) / Math.PI,
      opacity: Math.min(1, p * 12, (1 - p) * 12),
    },
  }
}

export const toClipPath = (poly: Point[]): string =>
  poly.length >= 3
    ? `polygon(${poly.map((q) => `${q.x.toFixed(2)}px ${q.y.toFixed(2)}px`).join(', ')})`
    : 'polygon(0px 0px, 0px 0px, 0px 0px)'
