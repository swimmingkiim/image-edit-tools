import { ImageInput } from '../types.js';
import { readFile } from 'fs/promises';
import fetch from 'node-fetch';

/**
 * Resolves any ImageInput variant to a Buffer.
 * Handles: Buffer (passthrough), URL (fetch), base64 data URI (decode), file path (readFile).
 */
export async function loadImage(input: ImageInput): Promise<Buffer> {
  if (Buffer.isBuffer(input)) return input;
  if (input.startsWith('data:')) {
    const base64 = input.split(',')[1];
    return Buffer.from(base64, 'base64');
  }
  if (input.startsWith('http://') || input.startsWith('https://')) {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(input);
}
