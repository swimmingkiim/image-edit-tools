import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { addText } from '../../src/ops/add-text.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('addText', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') // 400x300
  })

  it('adds a single text layer', async () => {
    const result = await addText(sampleJpeg, {
      layers: [{ text: 'Hello', x: 50, y: 50 }]
    })
    expect(result.ok).toBe(true)
  })

  it('adds multiple text layers with different anchors', async () => {
    const result = await addText(sampleJpeg, {
      layers: [
        { text: 'Top Left', x: 10, y: 10, anchor: 'top-left' },
        { text: 'Center', x: 200, y: 150, anchor: 'center' },
        { text: 'Bottom Right', x: 390, y: 290, anchor: 'bottom-right' }
      ]
    })
    expect(result.ok).toBe(true)
  })

  it('wraps text via maxWidth', async () => {
    const result = await addText(sampleJpeg, {
      layers: [{ text: 'This represents a completely long line of text that needs to wrap properly', x: 10, y: 50, maxWidth: 100 }]
    })
    expect(result.ok).toBe(true)
  })

  it('renders text background box', async () => {
    const result = await addText(sampleJpeg, {
      layers: [{ text: 'Background', x: 50, y: 50, background: { color: '#ff0000', opacity: 0.5, padding: 10, borderRadius: 5 } }]
    })
    expect(result.ok).toBe(true)
  })

  it('returns error if missing layers array', async () => {
    const result = await addText(sampleJpeg, {} as any)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_INPUT')
  })
})
