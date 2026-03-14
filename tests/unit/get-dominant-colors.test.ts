import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getDominantColors } from '../../src/ops/get-dominant-colors.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('getDominantColors', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') 
  })

  it('returns exactly count dominant colors as hex', async () => {
    const result = await getDominantColors(sampleJpeg, 3)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(3)
    expect(result.data[0]).toMatch(/^#[0-9a-fA-F]{6}$/)
  })
})
