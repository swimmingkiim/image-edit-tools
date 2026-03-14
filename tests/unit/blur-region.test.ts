import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { blurRegion } from '../../src/ops/blur-region.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('blurRegion', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') // 400x300
  })

  it('blurs a single region', async () => {
    const result = await blurRegion(sampleJpeg, {
      regions: [{ x: 50, y: 50, width: 100, height: 100, radius: 10 }]
    })
    expect(result.ok).toBe(true)
  })

  it('blurs multiple regions', async () => {
    const result = await blurRegion(sampleJpeg, {
      regions: [
        { x: 10, y: 10, width: 50, height: 50 },
        { x: 100, y: 100, width: 80, height: 80, radius: 5 }
      ]
    })
    expect(result.ok).toBe(true)
  })

  it('fails if region is out of bounds', async () => {
    const result = await blurRegion(sampleJpeg, {
      regions: [{ x: 350, y: 0, width: 100, height: 100 }]
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('OUT_OF_BOUNDS')
  })

  it('fails if width/height are invalid', async () => {
    const result = await blurRegion(sampleJpeg, {
      regions: [{ x: 0, y: 0, width: -10, height: 50 }]
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_INPUT')
  })
})
