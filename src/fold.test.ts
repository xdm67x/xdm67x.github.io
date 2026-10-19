import { describe, expect, test } from 'bun:test'

import { foldGeometry, polygonArea, toClipPath } from './fold'

const W = 1440
const H = 900

describe('foldGeometry', () => {
  test('starts as the full page with no flap', () => {
    const g = foldGeometry(W, H, 0)
    expect(polygonArea(g.front)).toBeCloseTo(W * H, 0)
    expect(polygonArea(g.flap)).toBeCloseTo(0, 0)
    expect(g.crease.opacity).toBe(0)
  })

  test('ends with the page gone and the flap off-page', () => {
    const g = foldGeometry(W, H, 1)
    expect(polygonArea(g.front)).toBeCloseTo(0, 0)
    expect(polygonArea(g.flap)).toBeCloseTo(0, 0)
    expect(g.crease.opacity).toBe(0)
  })

  test('folds a real corner inside the page', () => {
    const p = 0.35
    const g = foldGeometry(W, H, p)
    expect(polygonArea(g.front)).toBeGreaterThan(0)
    expect(polygonArea(g.flap)).toBeGreaterThan(0)

    // the bottom-right corner lands at (W(1 - 2p), H(1 - 2p)) and reaches the flap
    const corner = { x: W * (1 - 2 * p), y: H * (1 - 2 * p) }
    const reached = g.flap.some((q) => Math.hypot(q.x - corner.x, q.y - corner.y) < 0.5)
    expect(reached).toBe(true)

    for (const q of g.flap) {
      expect(q.x).toBeGreaterThanOrEqual(-1e-6)
      expect(q.x).toBeLessThanOrEqual(W + 1e-6)
      expect(q.y).toBeGreaterThanOrEqual(-1e-6)
      expect(q.y).toBeLessThanOrEqual(H + 1e-6)
    }
  })

  test('front and flap stay on opposite sides of the fold line', () => {
    const p = 0.6
    const g = foldGeometry(W, H, p)
    const d = Math.hypot(W, H)
    const nx = W / d
    const ny = H / d
    const c = (1 - p) * d

    for (const q of g.front) expect(nx * q.x + ny * q.y).toBeLessThanOrEqual(c + 1e-6)
    for (const q of g.flap) expect(nx * q.x + ny * q.y).toBeLessThanOrEqual(c + 1e-6)
  })

  test('crease sits on the fold line', () => {
    const p = 0.3
    const g = foldGeometry(W, H, p)
    const d = Math.hypot(W, H)
    const nx = W / d
    const ny = H / d
    const cx = W / 2 + g.crease.distance * nx
    const cy = H / 2 + g.crease.distance * ny
    expect(nx * cx + ny * cy).toBeCloseTo((1 - p) * d, 6)
    expect(g.crease.opacity).toBe(1)
  })

  test('produces usable clip paths and clamps progress', () => {
    const g = foldGeometry(W, H, 0.5)
    expect(toClipPath(g.front)).toStartWith('polygon(')
    expect(toClipPath(g.flap)).toStartWith('polygon(')
    expect(foldGeometry(W, H, -1).crease.opacity).toBe(0)
    expect(foldGeometry(W, H, 2).crease.opacity).toBe(0)
  })

  test('works for square and mobile pages', () => {
    for (const [w, h] of [
      [800, 800],
      [390, 844],
      [844, 390],
    ]) {
      const g = foldGeometry(w, h, 0.5)
      expect(polygonArea(g.front)).toBeGreaterThan(0)
      for (const q of g.flap) {
        expect(q.x).toBeGreaterThanOrEqual(-1e-6)
        expect(q.x).toBeLessThanOrEqual(w + 1e-6)
        expect(q.y).toBeGreaterThanOrEqual(-1e-6)
        expect(q.y).toBeLessThanOrEqual(h + 1e-6)
      }
    }
  })
})
