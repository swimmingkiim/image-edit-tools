import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { composite } from '../../src/ops/composite.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('composite', () => {
  let sampleJpeg: Buffer
  let logoPng: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') // 400x300
    logoPng = fixture('logo.png')      // 100x100
  })

  it('composites a single overlay', async () => {
    const result = await composite(sampleJpeg, {
      layers: [{ image: logoPng, x: 50, y: 50 }]
    })
    expect(result.ok).toBe(true)
  })

  it('composites multiple overlays', async () => {
    const result = await composite(sampleJpeg, {
      layers: [
        { image: logoPng, x: 10, y: 10 },
        { image: logoPng, x: 200, y: 150, blend: 'multiply' }
      ]
    })
    expect(result.ok).toBe(true)
  })

  it('applies layer opacity', async () => {
    const result = await composite(sampleJpeg, {
      layers: [{ image: logoPng, x: 0, y: 0, opacity: 0.5 }]
    })
    expect(result.ok).toBe(true)
  })

  it('handles data URL as layer source', async () => {
    const base64 = `data:image/png;base64,${logoPng.toString('base64')}`
    const result = await composite(sampleJpeg, {
      layers: [{ image: base64, x: 0, y: 0 }]
    })
    expect(result.ok).toBe(true)
  })

  it('returns error if missing layers array', async () => {
    const result = await composite(sampleJpeg, {} as any)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_INPUT')
  })

  it('warns when opaque layer covers large area', async () => {
    // sampleJpeg is 400x300 = 120000 pixels, logoPng is 100x100 = 10000 pixels (8.3% — no warning)
    const result = await composite(sampleJpeg, {
      layers: [{ image: sampleJpeg, x: 0, y: 0 }]
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.warnings).toBeDefined()
    expect(result.warnings!.length).toBeGreaterThan(0)
    expect(result.warnings![0]).toContain('may hide content')
  })
})
