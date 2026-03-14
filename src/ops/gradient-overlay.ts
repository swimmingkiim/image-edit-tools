import sharp from 'sharp';
import { GradientOverlayOptions, ImageInput, ImageResult, ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata } from '../utils/validate.js';

function buildGradientSvg(
  width: number,
  height: number,
  direction: string,
  color: string,
  opacity: number,
  coverage: number
): string {
  // Map direction to SVG linearGradient coordinates
  const dirMap: Record<string, { x1: string; y1: string; x2: string; y2: string }> = {
    'top':          { x1: '0%', y1: '0%',   x2: '0%', y2: '100%' },
    'bottom':       { x1: '0%', y1: '100%', x2: '0%', y2: '0%' },
    'left':         { x1: '0%', y1: '0%',   x2: '100%', y2: '0%' },
    'right':        { x1: '100%', y1: '0%', x2: '0%', y2: '0%' },
    'top-left':     { x1: '0%', y1: '0%',   x2: '100%', y2: '100%' },
    'top-right':    { x1: '100%', y1: '0%', x2: '0%', y2: '100%' },
    'bottom-left':  { x1: '0%', y1: '100%', x2: '100%', y2: '0%' },
    'bottom-right': { x1: '100%', y1: '100%', x2: '0%', y2: '0%' },
  };

  const d = dirMap[direction] ?? dirMap['bottom'];
  const stopOffset = Math.round(coverage * 100);

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="${d.x1}" y1="${d.y1}" x2="${d.x2}" y2="${d.y2}">
        <stop offset="0%" stop-color="${color}" stop-opacity="${opacity}"/>
        <stop offset="${stopOffset}%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
  </svg>`;
}

export async function gradientOverlay(input: ImageInput, options: GradientOverlayOptions = {}): Promise<ImageResult> {
  try {
    const buffer = await loadImage(input);
    const meta = await getImageMetadata(buffer);
    const { width, height } = meta;

    const direction = options.direction ?? 'bottom';
    const color = options.color ?? '#000000';
    const opacity = options.opacity ?? 0.7;
    const coverage = options.coverage ?? 0.5;

    const svg = buildGradientSvg(width, height, direction, color, opacity, coverage);

    const output = await sharp(buffer)
      .composite([{ input: Buffer.from(svg), blend: 'over' }])
      .toBuffer();

    return ok(output);
  } catch (e: any) {
    return err(e.message || 'Gradient overlay failed', ErrorCode.PROCESSING_FAILED);
  }
}
