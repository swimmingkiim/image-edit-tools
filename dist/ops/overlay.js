import sharp from 'sharp';
import { ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
export async function overlay(input, overlayImage, options = {}) {
    try {
        const buffer = await loadImage(input);
        let layerBuf = await loadImage(overlayImage);
        if (options.opacity !== undefined && options.opacity >= 0 && options.opacity < 1) {
            layerBuf = await sharp(layerBuf)
                .ensureAlpha()
                .composite([
                {
                    input: Buffer.from([255, 255, 255, Math.round(options.opacity * 255)]),
                    raw: { width: 1, height: 1, channels: 4 },
                    tile: true,
                    blend: 'dest-in'
                }
            ])
                .toBuffer();
        }
        let gravity = options.gravity ? options.gravity.toLowerCase() : undefined;
        const compositeOpts = {
            input: layerBuf,
            blend: options.blend || 'over'
        };
        if (gravity) {
            compositeOpts.gravity = gravity;
        }
        else {
            if (options.offsetX !== undefined)
                compositeOpts.left = Math.floor(options.offsetX);
            if (options.offsetY !== undefined)
                compositeOpts.top = Math.floor(options.offsetY);
        }
        const output = await sharp(buffer)
            .composite([compositeOpts])
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
//# sourceMappingURL=overlay.js.map