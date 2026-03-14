import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getMetadata } from '../../src/ops/get-metadata.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('getMetadata', () => {
  let sampleJpeg: Buffer
  let samplePng: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') 
    samplePng = fixture('sample.png')
  })

  it('returns metadata for jpeg', async () => {
    const result = await getMetadata(sampleJpeg)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.width).toBe(400)
    expect(result.data.height).toBe(300)
    expect(result.data.format).toBe('jpeg')
  })

  it('returns metadata for png', async () => {
    const result = await getMetadata(samplePng)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.format).toBe('png')
    expect(result.data.hasAlpha).toBe(true)
  })
})
