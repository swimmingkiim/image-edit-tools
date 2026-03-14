import sharp from 'sharp';
import { ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata, isPositiveInt } from '../utils/validate.js';
export async function blurRegion(input, options) {
    try {
        const buffer = await loadImage(input);
        const meta = await getImageMetadata(buffer);
        if (!options.regions || !Array.isArray(options.regions)) {
            return err('Regions array required', ErrorCode.INVALID_INPUT);
        }
        const composites = [];
        for (const r of options.regions) {
            if (!isPositiveInt(r.width) || !isPositiveInt(r.height)) {
                return err('Region dimensions must be positive integers', ErrorCode.INVALID_INPUT);
            }
            if (r.x < 0 || r.y < 0 || r.x + r.width > meta.width || r.y + r.height > meta.height) {
                return err('Blur region out of bounds', ErrorCode.OUT_OF_BOUNDS);
            }
            const radius = r.radius ?? 10;
            if (radius <= 0)
                return err('Blur radius must be positive', ErrorCode.INVALID_INPUT);
            const blurredRegion = await sharp(buffer)
                .extract({ left: Math.floor(r.x), top: Math.floor(r.y), width: Math.floor(r.width), height: Math.floor(r.height) })
                .blur(radius)
                .toBuffer();
            composites.push({
                input: blurredRegion,
                left: Math.floor(r.x),
                top: Math.floor(r.y),
                blend: 'over'
            });
        }
        if (composites.length === 0) {
            return ok(buffer);
        }
        const output = await sharp(buffer)
            .composite(composites)
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
//# sourceMappingURL=blur-region.js.map