import { BoundingBox, ImageInput, Result, ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { ok, err } from '../utils/result.js';
import { pipeline, RawImage } from '@xenova/transformers';
import sharp from 'sharp';

export async function detectFaces(input: ImageInput): Promise<Result<BoundingBox[]>> {
  try {
    const buffer = await loadImage(input);
    let detector: any;
    try {
      detector = await pipeline('object-detection', 'Xenova/detr-resnet-50', {
        quantized: true,
      });
    } catch (e) {
      return err('Model unavailable. Run: npx image-edit-tools download-models', ErrorCode.MODEL_NOT_FOUND);
    }
    
    const rawRgb = await sharp(buffer).ensureAlpha().raw().toBuffer();
    const meta = await sharp(buffer).metadata();
    const img = new RawImage(new Uint8ClampedArray(rawRgb), meta.width!, meta.height!, 4);
    
    const results = await detector(img, { threshold: 0.5 });
    const faces = results.filter((r: any) => r.label === 'person' || r.label === 'face');
    
    const boxes = faces.map((f: any) => ({
      x: Math.round(f.box.xmin),
      y: Math.round(f.box.ymin),
      width: Math.round(f.box.xmax - f.box.xmin),
      height: Math.round(f.box.ymax - f.box.ymin),
      confidence: f.score
    }));
    
    return ok(boxes);
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('HTTP')) return err(msg, ErrorCode.FETCH_FAILED);
    if (msg.includes('ENOENT')) return err('File not found', ErrorCode.INVALID_INPUT);
    return err(msg, ErrorCode.PROCESSING_FAILED);
  }
}
