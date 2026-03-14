import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { batch } from '../../src/ops/batch.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name))

describe('batch', () => {
  let sampleJpeg: Buffer

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg') 
  })

  it('processes all images', async () => {
    const inputs = [sampleJpeg, sampleJpeg, sampleJpeg]
    const operations: any[] = [{ op: 'resize', width: 50, height: 50 }]
    
    let progressUpdates = 0
    const result = await batch(inputs, operations, {
      concurrency: 2,
      onProgress: (done, total) => {
        progressUpdates++
        expect(total).toBe(3)
        expect(done).toBeLessThanOrEqual(3)
      }
    })
    
    expect(result).toHaveLength(3)
    expect(progressUpdates).toBe(3)
    for (const r of result) {
      expect(r.ok).toBe(true)
    }
  })
})
