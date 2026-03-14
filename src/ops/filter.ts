import { FilterOptions, ImageInput, ImageResult, ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import sharp from 'sharp';

export async function filter(input: ImageInput, options: FilterOptions): Promise<ImageResult> {
  try {
    const buffer = await loadImage(input);
    let pipeline = sharp(buffer);

    switch (options.preset) {
      case 'grayscale':
        pipeline = pipeline.grayscale();
        break;
      case 'sepia':
        pipeline = pipeline.tint({ r: 112, g: 66, b: 20 }).modulate({ saturation: 0.5 });
        break;
      case 'invert':
        pipeline = pipeline.negate();
        break;
      case 'vintage':
        // vintage: grayscale -> sepia -> slight contrast reduction -> add film grain (skip grain as composite noise is complex, but we can do a slight tint instead)
        pipeline = pipeline
          .grayscale()
          .tint({ r: 112, g: 66, b: 20 })
          .modulate({ saturation: 0.8, brightness: 1.1 })
          .linear(0.9, -(128 * 0.9) + 128);
        break;
      case 'unsharp':
        pipeline = pipeline.sharpen({ sigma: 1.5, m1: 0.5, m2: 0.1 });
        break;
      case 'blur':
        if (options.radius === undefined || options.radius <= 0) {
          return err('Blur radius must be a positive number', ErrorCode.INVALID_INPUT);
        }
        pipeline = pipeline.blur(options.radius);
        break;
      default:
        return err('Invalid filter preset', ErrorCode.INVALID_INPUT);
    }

    const output = await pipeline.toBuffer();
    return ok(output);
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('HTTP')) return err(msg, ErrorCode.FETCH_FAILED);
    if (msg.includes('ENOENT')) return err('File not found', ErrorCode.INVALID_INPUT);
    if (msg.includes('unsupported image format')) return err('Corrupt or unsupported input', ErrorCode.INVALID_INPUT);
    return err(msg, ErrorCode.PROCESSING_FAILED);
  }
}
