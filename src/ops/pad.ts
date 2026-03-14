import sharp from 'sharp';
import { PadOptions, ImageInput, ImageResult, ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata } from '../utils/validate.js';

export async function pad(input: ImageInput, options: PadOptions): Promise<ImageResult> {
  try {
    const buffer = await loadImage(input);
    let top = 0, right = 0, bottom = 0, left = 0;

    if (options.size !== undefined) {
      if (options.size <= 0) return err('Size must be positive', ErrorCode.INVALID_INPUT);
      const meta = await getImageMetadata(buffer);
      const targetSize = options.size;
      
      if (targetSize < meta.width || targetSize < meta.height) {
         return err('Target size must be larger than image dimensions', ErrorCode.INVALID_INPUT);
      }
      
      const missingTotalW = targetSize - meta.width;
      const missingTotalH = targetSize - meta.height;
      left = Math.floor(missingTotalW / 2);
      right = missingTotalW - left;
      top = Math.floor(missingTotalH / 2);
      bottom = missingTotalH - top;
    } else {
      top = options.top || 0;
      right = options.right || 0;
      bottom = options.bottom || 0;
      left = options.left || 0;
    }

    if (top < 0 || right < 0 || bottom < 0 || left < 0) {
      return err('Padding values cannot be negative', ErrorCode.INVALID_INPUT);
    }
    
    let background: string | sharp.RGBA = options.color || '#ffffff';
    let pipeline = sharp(buffer);
    if (options.color?.toLowerCase() === 'transparent') {
      background = { r: 0, g: 0, b: 0, alpha: 0 };
      pipeline = pipeline.png();
    }

    const output = await pipeline
      .extend({
        top,
        bottom,
        left,
        right,
        background
      })
      .toBuffer();
    
    return ok(output);
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('HTTP')) return err(msg, ErrorCode.FETCH_FAILED);
    if (msg.includes('ENOENT')) return err('File not found', ErrorCode.INVALID_INPUT);
    if (msg.includes('unsupported image format')) return err('Corrupt or unsupported input', ErrorCode.INVALID_INPUT);
    return err(msg, ErrorCode.PROCESSING_FAILED);
  }
}
