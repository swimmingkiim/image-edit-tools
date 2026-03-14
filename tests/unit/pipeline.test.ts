import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from '../../src/ops/pipeline.js'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('pipeline', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') 
  })

  it('runs multiple operations sequentially', async () => {
    const result = await pipeline(sampleJpeg, [
      { op: 'resize', width: 200, height: 200, fit: 'fill' },
      { op: 'adjust', brightness: 10 },
      { op: 'convert', format: 'png' }
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.width).toBe(200)
    expect(meta.height).toBe(200)
    expect(meta.format).toBe('png')
  })

  it('returns original loaded buffer for empty pipeline', async () => {
    const result = await pipeline(sampleJpeg, [])
    expect(result.ok).toBe(true)
  })

  it('returns error with step index if operation fails', async () => {
    const result = await pipeline(sampleJpeg, [
      { op: 'resize', width: 200, height: 200 },
      { op: 'crop', mode: 'absolute', x: 500, y: 500, width: 10, height: 10 }
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.step).toBe(1)
    expect(result.code).toBe('OUT_OF_BOUNDS')
  })
})
