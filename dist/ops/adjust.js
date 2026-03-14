import { ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import sharp from 'sharp';
export async function adjust(input, options) {
    try {
        const buffer = await loadImage(input);
        let pipeline = sharp(buffer);
        // Bounds checking
        if (options.brightness !== undefined && (options.brightness < -100 || options.brightness > 100)) {
            return err('Brightness must be between -100 and +100', ErrorCode.INVALID_INPUT);
        }
        if (options.contrast !== undefined && (options.contrast < -100 || options.contrast > 100)) {
            return err('Contrast must be between -100 and +100', ErrorCode.INVALID_INPUT);
        }
        if (options.saturation !== undefined && (options.saturation < -100 || options.saturation > 100)) {
            return err('Saturation must be between -100 and +100', ErrorCode.INVALID_INPUT);
        }
        if (options.hue !== undefined && (options.hue < 0 || options.hue > 360)) {
            return err('Hue must be between 0 and 360', ErrorCode.INVALID_INPUT);
        }
        if (options.sharpness !== undefined && (options.sharpness < 0 || options.sharpness > 100)) {
            return err('Sharpness must be between 0 and 100', ErrorCode.INVALID_INPUT);
        }
        if (options.temperature !== undefined && (options.temperature < -100 || options.temperature > 100)) {
            return err('Temperature must be between -100 and +100', ErrorCode.INVALID_INPUT);
        }
        const mod = {};
        if (options.brightness !== undefined)
            mod.brightness = 1 + (options.brightness / 100);
        if (options.saturation !== undefined)
            mod.saturation = 1 + (options.saturation / 100);
        if (options.hue !== undefined)
            mod.hue = options.hue;
        if (Object.keys(mod).length > 0)
            pipeline = pipeline.modulate(mod);
        if (options.contrast !== undefined) {
            const c = 1 + (options.contrast / 100);
            pipeline = pipeline.linear(c, -(128 * c) + 128);
        }
        if (options.sharpness !== undefined) {
            const sigma = (options.sharpness / 100) * 3;
            if (sigma > 0)
                pipeline = pipeline.sharpen({ sigma });
        }
        if (options.temperature !== undefined && options.temperature !== 0) {
            const t = options.temperature;
            let r = 255, g = 255, b = 255;
            if (t > 0) {
                b = Math.max(0, 255 - Math.round((t / 100) * 255));
            }
            else if (t < 0) {
                r = Math.max(0, 255 - Math.round((Math.abs(t) / 100) * 255));
            }
            pipeline = pipeline.tint({ r, g, b });
        }
        const output = await pipeline.toBuffer();
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
//# sourceMappingURL=adjust.js.map