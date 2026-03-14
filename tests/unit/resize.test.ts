import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { resize } from '../../src/ops/resize.js'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('resize', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') // 400x300
  })

  it('resizes using px dimensions', async () => {
    const result = await resize(sampleJpeg, { width: 100, height: 100 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.width).toBe(100)
    expect(meta.height).toBe(100)
  })

  it('resizes using scale', async () => {
    const result = await resize(sampleJpeg, { scale: 0.5 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.width).toBe(200)
    expect(meta.height).toBe(150)
  })

  it('preserves aspect ratio for single axis', async () => {
    const result = await resize(sampleJpeg, { width: 200 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.width).toBe(200)
    expect(meta.height).toBe(150) // 400:300 is 4:3 -> 200:150
  })

  it('applies fit parameter correctly', async () => {
    const result = await resize(sampleJpeg, { width: 100, height: 200, fit: 'contain' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.width).toBe(100)
    expect(meta.height).toBe(200)
  })

  it('respects withoutEnlargement', async () => {
    const result = await resize(sampleJpeg, { width: 1000, height: 1000, withoutEnlargement: true })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.width).toBe(400) // Original width
    expect(meta.height).toBe(300) // Original height
  })

  it('returns error on zero dimensions', async () => {
    const result = await resize(sampleJpeg, { width: 0 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_INPUT')
  })
})
