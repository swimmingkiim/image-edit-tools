import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { drawShape } from '../../src/ops/draw-shape.js'

describe('drawShape', () => {
  it('draws a filled rect', async () => {
    const result = await drawShape({ width: 200, height: 100, shape: 'rect', fill: '#FF0000', borderRadius: 16 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.width).toBe(200)
    expect(meta.height).toBe(100)
  })

  it('draws a circle with stroke', async () => {
    const result = await drawShape({ width: 100, height: 100, shape: 'circle', fill: '#00FF00', stroke: '#000000', strokeWidth: 3 })
    expect(result.ok).toBe(true)
  })

  it('draws an ellipse', async () => {
    const result = await drawShape({ width: 200, height: 100, shape: 'ellipse', fill: '#0000FF' })
    expect(result.ok).toBe(true)
  })

  it('draws a line', async () => {
    const result = await drawShape({ width: 200, height: 200, shape: 'line', stroke: '#FF0000', strokeWidth: 4, x1: 10, y1: 10, x2: 190, y2: 190 })
    expect(result.ok).toBe(true)
  })

  it('returns error for unknown shape', async () => {
    const result = await drawShape({ width: 100, height: 100, shape: 'hexagon' as any })
    expect(result.ok).toBe(false)
  })
})
