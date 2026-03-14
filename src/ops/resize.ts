import sharp from 'sharp';
import { ResizeOptions, ImageInput, ImageResult, ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata, isPositiveInt } from '../utils/validate.js';

export async function resize(input: ImageInput, options: ResizeOptions): Promise<ImageResult> {
  try {
    const buffer = await loadImage(input);
    
    let width = options.width;
    let height = options.height;

    if (options.scale) {
      if (options.scale <= 0) return err('Scale must be positive', ErrorCode.INVALID_INPUT);
      const meta = await getImageMetadata(buffer);
      width = Math.round(meta.width * options.scale);
      height = Math.round(meta.height * options.scale);
    }

    if (width !== undefined && !isPositiveInt(width)) {
      return err('Width must be a positive integer', ErrorCode.INVALID_INPUT);
    }
    if (height !== undefined && !isPositiveInt(height)) {
      return err('Height must be a positive integer', ErrorCode.INVALID_INPUT);
    }

    if (width === undefined && height === undefined) {
      return err('Must provide width, height, or scale', ErrorCode.INVALID_INPUT);
    }

    let kernel: keyof sharp.KernelEnum | undefined;
    if (options.kernel === 'linear') kernel = 'mitchell';
    else if (options.kernel) kernel = options.kernel;

    const output = await sharp(buffer)
      .resize({
        width,
        height,
        fit: options.fit,
        kernel,
        withoutEnlargement: options.withoutEnlargement
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
