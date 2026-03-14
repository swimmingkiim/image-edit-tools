import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { addText } from '../../src/ops/add-text.js'
import sharp from 'sharp'

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

  it('warns when text extends beyond canvas bounds', async () => {
    const result = await addText(sampleJpeg, {
      layers: [{ text: 'Way out of bounds', x: 9999, y: 9999, fontSize: 48 }]
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.warnings).toBeDefined()
    expect(result.warnings!.length).toBeGreaterThan(0)
    expect(result.warnings![0]).toContain('beyond canvas bounds')
  })

  it('includes bounds.contentBottom in result', async () => {
    const result = await addText(sampleJpeg, {
      layers: [{ text: 'Hello', x: 50, y: 50, fontSize: 24 }]
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect((result as any).bounds).toBeDefined()
    expect((result as any).bounds.contentBottom).toBeGreaterThan(50)
  })

  // ── Spans tests ─────────────────────────────────────────────────────────────

  describe('spans', () => {
    it('renders mixed bold+normal spans in one line', async () => {
      const result = await addText(sampleJpeg, {
        layers: [{
          text: '',
          x: 20, y: 50, fontSize: 28, color: '#333',
          spans: [
            { text: 'normal ' },
            { text: 'bold part', bold: true, color: '#000' },
          ]
        }]
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      const meta = await sharp(result.data).metadata()
      expect(meta.width).toBe(400)
    })

    it('renders italic and custom fontSize spans', async () => {
      const result = await addText(sampleJpeg, {
        layers: [{
          text: '',
          x: 20, y: 50, fontSize: 24, color: '#333',
          spans: [
            { text: 'normal ' },
            { text: 'italic small', italic: true, fontSize: 16, color: '#666' },
          ]
        }]
      })
      expect(result.ok).toBe(true)
    })

    it('handles newline in span text', async () => {
      const result = await addText(sampleJpeg, {
        layers: [{
          text: '',
          x: 20, y: 50, fontSize: 24, color: '#333',
          spans: [
            { text: 'line one\n' },
            { text: 'line two', bold: true },
          ]
        }]
      })
      expect(result.ok).toBe(true)
    })

    it('renders highlight background behind span', async () => {
      const result = await addText(sampleJpeg, {
        layers: [{
          text: '',
          x: 20, y: 50, fontSize: 24, color: '#333',
          spans: [
            { text: 'highlighted', highlight: '#FFFF00' },
            { text: ' normal' },
          ]
        }]
      })
      expect(result.ok).toBe(true)
    })

    it('warns when maxWidth used with spans', async () => {
      const result = await addText(sampleJpeg, {
        layers: [{
          text: '',
          x: 20, y: 50, fontSize: 24, color: '#333',
          maxWidth: 200,
          spans: [{ text: 'hello' }]
        }]
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.warnings).toContain(
        'maxWidth is not supported with spans'
      )
    })

    it('warns when both text and spans are provided', async () => {
      const result = await addText(sampleJpeg, {
        layers: [{
          text: 'this should be ignored',
          x: 20, y: 50, fontSize: 24, color: '#333',
          spans: [{ text: 'spans win' }]
        }]
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.warnings).toContain(
        'text field ignored when spans is provided'
      )
    })

    it('renders spans with background box', async () => {
      const result = await addText(sampleJpeg, {
        layers: [{
          text: '',
          x: 20, y: 50, fontSize: 24, color: '#333',
          background: { color: '#EEE', padding: 8 },
          spans: [
            { text: 'with ' },
            { text: 'background', bold: true },
          ]
        }]
      })
      expect(result.ok).toBe(true)
    })
  })
})
