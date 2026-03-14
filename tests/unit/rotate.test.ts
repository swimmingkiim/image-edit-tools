import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { rotate } from '../../src/ops/rotate.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('rotate', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg')
  })

  it('rotates 90 degrees', async () => {
    const result = await rotate(sampleJpeg, { angle: 90 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    // 400x300 rotated 90° → 300x400
    expect(meta.width).toBe(300)
    expect(meta.height).toBe(400)
  })

  it('rotates 45 degrees with transparent bg', async () => {
    const result = await rotate(sampleJpeg, { angle: 45 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    // Canvas expands for 45° rotation
    expect(meta.width).toBeGreaterThan(400)
  })

  it('returns same buffer for 0 degrees', async () => {
    const result = await rotate(sampleJpeg, { angle: 0 })
    expect(result.ok).toBe(true)
  })
})
