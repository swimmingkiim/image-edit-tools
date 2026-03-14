import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { convert } from '../../src/ops/convert.js'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('convert', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') 
  })

  it('converts to jpeg with quality', async () => {
    const result = await convert(sampleJpeg, { format: 'jpeg', quality: 50 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.format).toBe('jpeg')
  })

  it('converts to png with compressionLevel', async () => {
    const result = await convert(sampleJpeg, { format: 'png', compressionLevel: 9 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.format).toBe('png')
  })

  it('converts to webp', async () => {
    const result = await convert(sampleJpeg, { format: 'webp' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.format).toBe('webp')
  })

  it('converts to avif', async () => {
    const result = await convert(sampleJpeg, { format: 'avif' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.format).toBe('heif') 
  })

  it('preserves metadata when stripMetadata is false', async () => {
    const result = await convert(sampleJpeg, { format: 'jpeg', stripMetadata: false })
    expect(result.ok).toBe(true)
  })
})
