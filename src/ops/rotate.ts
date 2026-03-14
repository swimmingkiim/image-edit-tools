import sharp from 'sharp';
import { RotateOptions, ImageInput, ImageResult, ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';

export async function rotate(input: ImageInput, options: RotateOptions): Promise<ImageResult> {
  try {
    const buffer = await loadImage(input);
    const angle = options.angle % 360;

    if (angle === 0) return ok(buffer);

    const bgColor = options.background ?? { r: 0, g: 0, b: 0, alpha: 0 };
    const background = typeof bgColor === 'string'
      ? bgColor
      : bgColor;

    const output = await sharp(buffer)
      .rotate(angle, { background })
      .png()
      .toBuffer();

    return ok(output);
  } catch (e: any) {
    return err(e.message || 'Rotation failed', ErrorCode.PROCESSING_FAILED);
  }
}
