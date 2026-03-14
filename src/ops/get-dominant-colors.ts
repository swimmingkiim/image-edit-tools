import { ImageInput, Result, ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getPaletteFromURL } from 'color-thief-node';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export async function getDominantColors(input: ImageInput, count: number = 5): Promise<Result<string[]>> {
  let tmpFile = '';
  try {
    const buffer = await loadImage(input);
    tmpFile = join(tmpdir(), `ct-${Date.now()}-${Math.random()}.jpg`);
    writeFileSync(tmpFile, buffer);

    const palette = await getPaletteFromURL(tmpFile, count);
    if (tmpFile) {
        try { unlinkSync(tmpFile) } catch(e){}
    }

    const hexColors = palette.map((rgb: number[]) => {
      return '#' + rgb.map((x: number) => x.toString(16).padStart(2, '0')).join('');
    });
    
    while (hexColors.length > count) hexColors.pop();
    while (hexColors.length > 0 && hexColors.length < count) hexColors.push(hexColors[hexColors.length - 1]);
    
    // If image has only 1 color and getPaletteFromURL completely fails to return array,
    if (hexColors.length === 0) hexColors.push('#000000');

    return ok(hexColors);
  } catch (e: any) {
    if (tmpFile) {
        try { unlinkSync(tmpFile) } catch(e){}
    }
    const msg = e.message || '';
    if (msg.includes('HTTP')) return err(msg, ErrorCode.FETCH_FAILED);
    if (msg.includes('ENOENT')) return err('File not found', ErrorCode.INVALID_INPUT);
    return err(msg, ErrorCode.PROCESSING_FAILED);
  }
}
