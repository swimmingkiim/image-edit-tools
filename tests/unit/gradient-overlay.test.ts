import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { gradientOverlay } from '../../src/ops/gradient-overlay.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('gradientOverlay', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg')
  })

  it('applies default bottom gradient', async () => {
    const result = await gradientOverlay(sampleJpeg)
    expect(result.ok).toBe(true)
  })

  it('applies gradient with custom direction and color', async () => {
    const result = await gradientOverlay(sampleJpeg, {
      direction: 'top-right', color: '#FF0000', opacity: 0.5, coverage: 0.8
    })
    expect(result.ok).toBe(true)
  })
})
