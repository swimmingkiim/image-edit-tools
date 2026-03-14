import { describe, it, expect, beforeAll, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { detectSubject } from '../../src/ops/detect-subject.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

vi.mock('@xenova/transformers', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('@xenova/transformers')>()),
    AutoModel: {
      from_pretrained: vi.fn().mockRejectedValue(new Error('Mock network failure'))
    },
    AutoProcessor: {
      from_pretrained: vi.fn()
    }
  }
})

describe('detectSubject', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') 
  })

  it('returns MODEL_NOT_FOUND when model is unavailable', async () => {
    const result = await detectSubject(sampleJpeg)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('MODEL_NOT_FOUND')
    }
  })
})
