import { describe, it, expect, beforeAll, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { extractText } from '../../src/ops/extract-text.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

vi.mock('tesseract.js', () => {
  return {
    default: {
      recognize: vi.fn().mockResolvedValue({
        data: { text: 'Mocked text' }
      })
    }
  }
})

describe('extractText', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') 
  })

  it('extracts text', async () => {
    const result = await extractText(sampleJpeg)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBe('Mocked text')
  })
})
