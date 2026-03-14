import sharp from 'sharp';
import { ClipToShapeOptions, ImageInput, ImageResult, ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata } from '../utils/validate.js';

function buildClipSvg(width: number, height: number, options: ClipToShapeOptions): string {
  const { shape } = options;
  let clipContent: string;

  switch (shape) {
    case 'circle': {
      const r = Math.min(width, height) / 2;
      const cx = width / 2;
      const cy = height / 2;
      clipContent = `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
      break;
    }
    case 'ellipse': {
      clipContent = `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2}" ry="${height / 2}"/>`;
      break;
    }
    case 'rounded-rect': {
      const radius = options.borderRadius ?? 32;
      clipContent = `<rect width="${width}" height="${height}" rx="${radius}" ry="${radius}"/>`;
      break;
    }
    default:
      clipContent = `<rect width="${width}" height="${height}"/>`;
  }

  // Create an SVG mask: white shape on black = keep shape area
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${clipContent.replace('/>', ' fill="white"/>')}
  </svg>`;
}

export async function clipToShape(input: ImageInput, options: ClipToShapeOptions): Promise<ImageResult> {
  try {
    const buffer = await loadImage(input);
    const meta = await getImageMetadata(buffer);
    const { width, height } = meta;

    const maskSvg = buildClipSvg(width, height, options);
    const mask = await sharp(Buffer.from(maskSvg))
      .resize(width, height)
      .grayscale()
      .toBuffer();

    const output = await sharp(buffer)
      .ensureAlpha()
      .composite([{
        input: mask,
        blend: 'dest-in'
      }])
      .png()
      .toBuffer();

    return ok(output);
  } catch (e: any) {
    return err(e.message || 'Clip to shape failed', ErrorCode.PROCESSING_FAILED);
  }
}
