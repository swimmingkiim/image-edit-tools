import { describe, it, expect, beforeAll, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { removeBg } from '../../src/ops/remove-bg.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

// Since tests run in CI/offline and we shouldn't download huge models, 
// we test that the function gracefully hits the MODEL_NOT_FOUND error 
// if AutoModel fails, or passes if the network enables it.
// We explicitly mock '@xenova/transformers' to simulate network failure or success.

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

describe('removeBg', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') 
  })

  it('handles unavailable model offline correctly', async () => {
    const result = await removeBg(sampleJpeg, {})
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('MODEL_NOT_FOUND')
    }
  })
})
