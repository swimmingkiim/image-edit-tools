import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadImage } from '../../src/utils/load-image.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name));

describe('loadImage', () => {
  let sampleJpeg: Buffer;

  beforeAll(() => {
    sampleJpeg = fixture('sample.jpg');
  });

  it('passes through Buffer input directly', async () => {
    const result = await loadImage(sampleJpeg);
    expect(result).toBe(sampleJpeg);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('loads image from a local file path', async () => {
    const filePath = join(__dirname, '../fixtures/sample.jpg');
    const result = await loadImage(filePath);
    expect(Buffer.isBuffer(result)).toBe(true);
    // Buffer length might be different in deep equal vs identity, but lengths should match
    expect(result.length).toBe(sampleJpeg.length);
  });

  it('decodes a base64 data URI', async () => {
    const base64 = `data:image/jpeg;base64,${sampleJpeg.toString('base64')}`;
    const result = await loadImage(base64);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBe(sampleJpeg.length);
  });

  // Note: We might want to mock node-fetch for HTTP tests to avoid true network reliance,
  // but a simple test checking if it resolves fetching an image can be mocked like so:
  it('throws an error for invalid local paths', async () => {
    await expect(loadImage(join(__dirname, '../fixtures/missing.jpg')))
      .rejects.toThrow();
  });
});
