import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { dropShadow } from '../../src/ops/drop-shadow.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('dropShadow', () => {
  let logoPng: Buffer

  beforeAll(() => {
    logoPng = fixture('logo.png') // 100x100
  })

  it('adds drop shadow with expanded canvas', async () => {
    const result = await dropShadow(logoPng, { blur: 8, offsetX: 4, offsetY: 4 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    // Canvas should be expanded
    expect(meta.width).toBeGreaterThan(100)
    expect(meta.height).toBeGreaterThan(100)
  })

  it('adds shadow without expanding canvas', async () => {
    const result = await dropShadow(logoPng, { expand: false, blur: 4 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const meta = await sharp(result.data).metadata()
    expect(meta.width).toBe(100)
    expect(meta.height).toBe(100)
  })

  it('uses default options', async () => {
    const result = await dropShadow(logoPng)
    expect(result.ok).toBe(true)
  })
})
