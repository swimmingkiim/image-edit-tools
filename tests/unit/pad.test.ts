import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { pad } from '../../src/ops/pad.js'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('pad', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') // 400x300
  })

  it('pads individual edges', async () => {
    const result = await pad(sampleJpeg, { top: 10, bottom: 20, left: 5, right: 15 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.width).toBe(400 + 5 + 15)
    expect(meta.height).toBe(300 + 10 + 20)
  })

  it('pads to square size', async () => {
    const result = await pad(sampleJpeg, { size: 500 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.width).toBe(500)
    expect(meta.height).toBe(500)
  })

  it('uses transparent background', async () => {
    const result = await pad(sampleJpeg, { top: 10, color: 'transparent' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.hasAlpha).toBe(true)
  })

  it('parses hex color', async () => {
    const result = await pad(sampleJpeg, { top: 10, color: '#ff0000' })
    expect(result.ok).toBe(true)
  })

  it('returns error for negative padding', async () => {
    const result = await pad(sampleJpeg, { top: -10 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_INPUT')
  })
})
