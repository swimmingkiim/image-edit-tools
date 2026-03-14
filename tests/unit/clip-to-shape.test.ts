import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { clipToShape } from '../../src/ops/clip-to-shape.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('clipToShape', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg')
  })

  it('clips to circle', async () => {
    const result = await clipToShape(sampleJpeg, { shape: 'circle' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.hasAlpha).toBe(true)
  })

  it('clips to rounded-rect with custom radius', async () => {
    const result = await clipToShape(sampleJpeg, { shape: 'rounded-rect', borderRadius: 64 })
    expect(result.ok).toBe(true)
  })

  it('clips to ellipse', async () => {
    const result = await clipToShape(sampleJpeg, { shape: 'ellipse' })
    expect(result.ok).toBe(true)
  })
})
