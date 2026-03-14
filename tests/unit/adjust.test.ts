import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { adjust } from '../../src/ops/adjust.js'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('adjust', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') // 400x300
  })

  it('adjusts brightness', async () => {
    const result = await adjust(sampleJpeg, { brightness: 50 })
    expect(result.ok).toBe(true)
  })

  it('adjusts contrast', async () => {
    const result = await adjust(sampleJpeg, { contrast: 50 })
    expect(result.ok).toBe(true)
  })

  it('adjusts saturation', async () => {
    const result = await adjust(sampleJpeg, { saturation: -50 })
    expect(result.ok).toBe(true)
  })

  it('adjusts hue', async () => {
    const result = await adjust(sampleJpeg, { hue: 180 })
    expect(result.ok).toBe(true)
  })

  it('adjusts sharpness', async () => {
    const result = await adjust(sampleJpeg, { sharpness: 80 })
    expect(result.ok).toBe(true)
  })

  it('adjusts temperature (warm)', async () => {
    const result = await adjust(sampleJpeg, { temperature: 50 })
    expect(result.ok).toBe(true)
  })

  it('adjusts temperature (cool)', async () => {
    const result = await adjust(sampleJpeg, { temperature: -50 })
    expect(result.ok).toBe(true)
  })

  it('applies all adjustments together', async () => {
    const result = await adjust(sampleJpeg, {
      brightness: 10,
      contrast: 10,
      saturation: 20,
      hue: 45,
      sharpness: 50,
      temperature: 10
    })
    expect(result.ok).toBe(true)
  })

  // ── Error paths ────────────────────────────────────────────────────────────

  it('returns error for out-of-range brightness', async () => {
    const result = await adjust(sampleJpeg, { brightness: 150 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_INPUT')
  })

  it('returns error for out-of-range hue', async () => {
    const result = await adjust(sampleJpeg, { hue: -10 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_INPUT')
  })
})
