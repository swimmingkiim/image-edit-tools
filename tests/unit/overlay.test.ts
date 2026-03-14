import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { overlay } from '../../src/ops/overlay.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('overlay', () => {
  let sampleJpeg: Buffer
  let logoPng: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') // 400x300
    logoPng = fixture('logo.png')      // 100x100
  })

  it('adds overlay with default options', async () => {
    const result = await overlay(sampleJpeg, logoPng)
    expect(result.ok).toBe(true)
  })

  it('adds overlay using gravity', async () => {
    const result = await overlay(sampleJpeg, logoPng, { gravity: 'SouthEast' })
    expect(result.ok).toBe(true)
  })

  it('adds overlay using offsets and opacity', async () => {
    const result = await overlay(sampleJpeg, logoPng, { offsetX: 50, offsetY: 50, opacity: 0.5 })
    expect(result.ok).toBe(true)
  })

  it('supports blend modes', async () => {
    const result = await overlay(sampleJpeg, logoPng, { blend: 'multiply' })
    expect(result.ok).toBe(true)
  })
})
