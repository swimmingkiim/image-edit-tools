import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { filter } from '../../src/ops/filter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('filter', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') // 400x300
  })

  // Test all presets
  const presets = ['grayscale', 'sepia', 'invert', 'vintage', 'unsharp'] as const
  for (const preset of presets) {
    it(`applies ${preset} preset`, async () => {
      const result = await filter(sampleJpeg, { preset })
      expect(result.ok).toBe(true)
    })
  }

  it('applies blur preset with radius', async () => {
    const result = await filter(sampleJpeg, { preset: 'blur', radius: 10 })
    expect(result.ok).toBe(true)
  })

  it('fails blur preset if radius is missing or invalid', async () => {
    // TypeScript should stop missing radius, but casting to verify runtime validation
    const result = await filter(sampleJpeg, { preset: 'blur', radius: -5 } as any)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_INPUT')
  })
})
