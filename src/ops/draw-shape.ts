import sharp from 'sharp';
import { DrawShapeOptions, ImageResult, ErrorCode } from '../types.js';
import { err, ok } from '../utils/result.js';

export async function drawShape(options: DrawShapeOptions): Promise<ImageResult> {
  try {
    const { width, height, shape } = options;
    const fill = options.fill ?? 'transparent';
    const fillOpacity = options.fillOpacity ?? 1;
    const stroke = options.stroke ?? 'none';
    const strokeWidth = options.strokeWidth ?? 0;
    const borderRadius = options.borderRadius ?? 0;

    let shapeEl: string;

    switch (shape) {
      case 'rect': {
        shapeEl = `<rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${width - strokeWidth}" height="${height - strokeWidth}" rx="${borderRadius}" ry="${borderRadius}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
        break;
      }
      case 'circle': {
        const cx = options.cx ?? width / 2;
        const cy = options.cy ?? height / 2;
        const r = options.r ?? Math.min(width, height) / 2 - strokeWidth;
        shapeEl = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
        break;
      }
      case 'ellipse': {
        const cx = options.cx ?? width / 2;
        const cy = options.cy ?? height / 2;
        const rx = options.r ?? width / 2 - strokeWidth;
        const ry = options.ry ?? height / 2 - strokeWidth;
        shapeEl = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
        break;
      }
      case 'line': {
        const x1 = options.x1 ?? 0;
        const y1 = options.y1 ?? 0;
        const x2 = options.x2 ?? width;
        const y2 = options.y2 ?? height;
        shapeEl = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke || fill}" stroke-width="${strokeWidth || 2}"/>`;
        break;
      }
      default:
        return err(`Unknown shape: ${shape}`, ErrorCode.INVALID_INPUT);
    }

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${shapeEl}</svg>`;

    const output = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    return ok(output);
  } catch (e: any) {
    return err(e.message || 'Draw shape failed', ErrorCode.PROCESSING_FAILED);
  }
}
