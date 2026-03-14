import sharp from 'sharp';
import { ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
export async function getMetadata(input) {
    try {
        const buffer = await loadImage(input);
        const meta = await sharp(buffer).metadata();
        return ok({
            width: meta.width || 0,
            height: meta.height || 0,
            format: meta.format || 'unknown',
            fileSize: meta.size || buffer.length,
            colorSpace: meta.space,
            hasAlpha: meta.hasAlpha || false,
            channels: meta.channels || 3,
            density: meta.density,
            exif: meta.exif ? { bufferLength: meta.exif.length } : undefined
        });
    }
    catch (e) {
        const msg = e.message || '';
        if (msg.includes('HTTP'))
            return err(msg, ErrorCode.FETCH_FAILED);
        if (msg.includes('ENOENT'))
            return err('File not found', ErrorCode.INVALID_INPUT);
        return err(msg, ErrorCode.PROCESSING_FAILED);
    }
}
//# sourceMappingURL=get-metadata.js.map