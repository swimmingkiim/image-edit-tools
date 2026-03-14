import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { crop } from '../../src/ops/crop.js'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('crop', () => {
  let sampleJpeg: Buffer
  let samplePng: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg')  // 400×300
    samplePng = fixture('sample.png')   // 400×300 with alpha
  })

  // ── Absolute mode ──────────────────────────────────────────────────────────

  it('crops to exact pixel coordinates', async () => {
    const result = await crop(sampleJpeg, { mode: 'absolute', x: 10, y: 10, width: 100, height: 80 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.width).toBe(100)
    expect(meta.height).toBe(80)
  })

  it('preserves alpha channel when cropping a PNG', async () => {
    const result = await crop(samplePng, { mode: 'absolute', x: 0, y: 0, width: 200, height: 200 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.hasAlpha).toBe(true)
  })

  // ── Ratio mode ─────────────────────────────────────────────────────────────

  it('crops by ratio from each edge', async () => {
    const result = await crop(sampleJpeg, {
      mode: 'ratio', left: 0.1, top: 0.1, right: 0.1, bottom: 0.1
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // 400 * 0.1 = 40, so width = 400 - 80 = 320
    const meta = await sharp(result.data).metadata()
    expect(meta.width).toBe(320)
    expect(meta.height).toBe(240)
  })

  // ── Aspect mode ────────────────────────────────────────────────────────────

  it('crops to 16:9 aspect ratio centered', async () => {
    const result = await crop(sampleJpeg, {
      mode: 'aspect', aspectRatio: '16:9', anchor: 'center'
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.width! / meta.height!).toBeCloseTo(16 / 9, 1)
  })

  // ── Error paths ────────────────────────────────────────────────────────────

  it('returns error when crop region exceeds image bounds', async () => {
    const result = await crop(sampleJpeg, { mode: 'absolute', x: 0, y: 0, width: 9999, height: 9999 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('OUT_OF_BOUNDS')
  })

  it('returns error for corrupt input buffer', async () => {
    const result = await crop(Buffer.from('not an image'), { mode: 'absolute', x: 0, y: 0, width: 10, height: 10 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_INPUT')
  })

  it('accepts file path as input', async () => {
    const path = join(__dirname, '../fixtures/sample.jpg')
    const result = await crop(path, { mode: 'absolute', x: 0, y: 0, width: 100, height: 100 })
    expect(result.ok).toBe(true)
  })

  it('accepts base64 data URI as input', async () => {
    const base64 = `data:image/jpeg;base64,${sampleJpeg.toString('base64')}`
    const result = await crop(base64, { mode: 'absolute', x: 0, y: 0, width: 100, height: 100 })
    expect(result.ok).toBe(true)
  })
})
