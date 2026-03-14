import sharp from 'sharp';
import { ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata, isPositiveInt } from '../utils/validate.js';
// import { detectSubject } from './detect-subject.js'; // Deferred for now
export async function crop(input, options) {
    try {
        const buffer = await loadImage(input);
        const meta = await getImageMetadata(buffer);
        let left = 0, top = 0, width = meta.width, height = meta.height;
        const mode = options.mode || 'absolute';
        if (mode === 'absolute') {
            const opt = options;
            // Provide defaults if missing, theoretically
            const optX = opt.x ?? 0;
            const optY = opt.y ?? 0;
            if (!isPositiveInt(opt.width) || !isPositiveInt(opt.height)) {
                return err('Invalid dimensions', ErrorCode.INVALID_INPUT);
            }
            if (optX < 0 || optY < 0 || optX + opt.width > meta.width || optY + opt.height > meta.height) {
                return err('Crop region out of bounds', ErrorCode.OUT_OF_BOUNDS);
            }
            left = optX;
            top = optY;
            width = opt.width;
            height = opt.height;
        }
        else if (mode === 'ratio') {
            const opt = options;
            left = Math.round(meta.width * opt.left);
            top = Math.round(meta.height * opt.top);
            const right = Math.round(meta.width * opt.right);
            const bottom = Math.round(meta.height * opt.bottom);
            width = meta.width - left - right;
            height = meta.height - top - bottom;
            if (width <= 0 || height <= 0 || left < 0 || top < 0 || left + width > meta.width || top + height > meta.height) {
                return err('Invalid ratio calculation out of bounds', ErrorCode.OUT_OF_BOUNDS);
            }
        }
        else if (mode === 'aspect') {
            const opt = options;
            const [wRatio, hRatio] = opt.aspectRatio.split(':').map(Number);
            if (!wRatio || !hRatio || wRatio <= 0 || hRatio <= 0) {
                return err('Invalid aspect ratio format', ErrorCode.INVALID_INPUT);
            }
            const imageRatio = meta.width / meta.height;
            const targetRatio = wRatio / hRatio;
            if (imageRatio > targetRatio) {
                // Target is taller/narrower: Height bounded by image height
                height = meta.height;
                width = Math.round(height * targetRatio);
            }
            else {
                // Target is wider/shorter: Width bounded by image width
                width = meta.width;
                height = Math.round(width / targetRatio);
            }
            // Handle anchor
            const anchor = opt.anchor || 'center';
            if (anchor === 'center') {
                left = Math.floor((meta.width - width) / 2);
                top = Math.floor((meta.height - height) / 2);
            }
            else if (anchor === 'top') {
                left = Math.floor((meta.width - width) / 2);
                top = 0;
            }
            else if (anchor === 'bottom') {
                left = Math.floor((meta.width - width) / 2);
                top = meta.height - height;
            }
            else if (anchor === 'face') {
                // Fallback for now without detectFaces
                left = Math.floor((meta.width - width) / 2);
                top = Math.floor((meta.height - height) / 2);
            }
        }
        else if (mode === 'subject') {
            return err('Subject crop not currently implemented in this pass', ErrorCode.PROCESSING_FAILED);
        }
        else {
            return err('Invalid crop mode', ErrorCode.INVALID_INPUT);
        }
        const output = await sharp(buffer)
            .extract({ left, top, width, height })
            .toBuffer();
        return ok(output);
    }
    catch (e) {
        const msg = e.message || '';
        if (msg.includes('HTTP'))
            return err(msg, ErrorCode.FETCH_FAILED);
        if (msg.includes('ENOENT'))
            return err('File not found', ErrorCode.INVALID_INPUT);
        if (msg.includes('unsupported image format'))
            return err('Corrupt or unsupported input', ErrorCode.INVALID_INPUT);
        return err(msg, ErrorCode.PROCESSING_FAILED);
    }
}
//# sourceMappingURL=crop.js.map