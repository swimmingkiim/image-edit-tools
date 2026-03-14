import sharp from 'sharp';
import { DropShadowOptions, ImageInput, ImageResult, ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata } from '../utils/validate.js';

export async function dropShadow(input: ImageInput, options: DropShadowOptions = {}): Promise<ImageResult> {
  try {
    const buffer = await loadImage(input);
    const meta = await getImageMetadata(buffer);
    const { width, height } = meta;

    const offsetX = options.offsetX ?? 4;
    const offsetY = options.offsetY ?? 4;
    const blurRadius = options.blur ?? 8;
    const color = options.color ?? 'rgba(0,0,0,0.5)';
    const expand = options.expand ?? true;

    const expandPx = expand ? Math.ceil(blurRadius * 2 + Math.max(Math.abs(offsetX), Math.abs(offsetY))) : 0;
    const canvasW = width + expandPx * 2;
    const canvasH = height + expandPx * 2;

    // Create shadow by making a silhouette of the source image
    const silhouette = await sharp(buffer)
      .ensureAlpha()
      .png()
      .toBuffer();

    // Tint to create a colored, blurred shadow
    const shadow = await sharp({
      create: { width, height, channels: 4, background: color }
    })
      .png()
      .toBuffer();

    // Use source alpha as mask for the shadow color
    const maskedShadow = await sharp(shadow)
      .composite([{
        input: silhouette,
        blend: 'dest-in'
      }])
      .blur(Math.max(0.3, blurRadius))
      .toBuffer();

    // Assemble on canvas
    const canvas = await sharp({
      create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
      .composite([
        { input: maskedShadow, left: expandPx + offsetX, top: expandPx + offsetY, blend: 'over' },
        { input: buffer, left: expandPx, top: expandPx, blend: 'over' }
      ])
      .png()
      .toBuffer();

    return ok(canvas);
  } catch (e: any) {
    return err(e.message || 'Drop shadow failed', ErrorCode.PROCESSING_FAILED);
  }
}
