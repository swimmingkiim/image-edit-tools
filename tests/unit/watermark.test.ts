import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { watermark } from '../../src/ops/watermark.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('watermark', () => {
  let sampleJpeg: Buffer
  let logoPng: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') // 400x300
    logoPng = fixture('logo.png')      // 100x100
  })

  it('adds text watermark at bottom-right', async () => {
    const result = await watermark(sampleJpeg, {
      type: 'text', text: 'Confidential', position: 'bottom-right'
    })
    expect(result.ok).toBe(true)
  })

  it('adds text watermark tiled', async () => {
    const result = await watermark(sampleJpeg, {
      type: 'text', text: 'Draft', position: 'tile', tileSpacing: 100
    })
    expect(result.ok).toBe(true)
  })

  it('adds image watermark at top-left', async () => {
    const result = await watermark(sampleJpeg, {
      type: 'image', image: logoPng, position: 'top-left'
    })
    expect(result.ok).toBe(true)
  })

  it('adds image watermark tiled with opacity and scale', async () => {
    const result = await watermark(sampleJpeg, {
      type: 'image', image: logoPng, position: 'tile', opacity: 0.3, scale: 0.5, tileSpacing: 20
    })
    expect(result.ok).toBe(true)
  })

  it('returns error if missing valid type', async () => {
    const result = await watermark(sampleJpeg, {} as any)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_INPUT')
  })
})
