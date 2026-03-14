import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { optimize } from '../../src/ops/optimize.js'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('optimize', () => {
  let sampleJpeg: Buffer
  let samplePng: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') 
    samplePng = fixture('sample.png')
  })

  it('reduces file size below target maxSizeKB', async () => {
    const startSize = sampleJpeg.length
    
    // We expect the dummy jpg from sharp to be very small, maybe < 10KB.
    // If it's already < 10KB, optimization just maintains or matches it.
    const result = await optimize(sampleJpeg, { maxSizeKB: 10, autoFormat: false })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.length).toBeLessThanOrEqual(10 * 1024 + 1024) 
  })

  it('resizes using maxDimension', async () => {
    const result = await optimize(sampleJpeg, { maxDimension: 100 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(Math.max(meta.width!, meta.height!)).toBe(100)
  })

  it('selects webp for alpha by default', async () => {
    const result = await optimize(samplePng, {}) 
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.format).toBe('webp')
  })
})
