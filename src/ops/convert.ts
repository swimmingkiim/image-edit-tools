import sharp from 'sharp';
import { ConvertOptions, ImageInput, ImageResult, ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';

export async function convert(input: ImageInput, options: ConvertOptions): Promise<ImageResult> {
  try {
    const buffer = await loadImage(input);
    let pipeline = sharp(buffer);
    
    const quality = options.quality ?? 80;
    const stripMetadata = options.stripMetadata ?? true;

    if (!stripMetadata) {
      pipeline = pipeline.keepMetadata();
    }

    switch (options.format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, compressionLevel: options.compressionLevel ?? 6 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
      case 'gif':
        pipeline = pipeline.gif(); 
        break;
      default:
        return err('Unsupported format', ErrorCode.UNSUPPORTED_FORMAT);
    }

    const output = await pipeline.toBuffer();
    return ok(output);
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('HTTP')) return err(msg, ErrorCode.FETCH_FAILED);
    if (msg.includes('ENOENT')) return err('File not found', ErrorCode.INVALID_INPUT);
    return err(msg, ErrorCode.PROCESSING_FAILED);
  }
}
