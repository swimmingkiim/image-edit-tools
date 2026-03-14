import sharp from 'sharp';
import { ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { getImageMetadata } from '../utils/validate.js';
import { err, ok } from '../utils/result.js';
export async function optimize(input, options) {
    try {
        const buffer = await loadImage(input);
        const meta = await getImageMetadata(buffer);
        let pipeline = sharp(buffer);
        let format = meta.format;
        const autoFormat = options.autoFormat ?? true;
        if (autoFormat) {
            format = meta.hasAlpha ? 'webp' : 'jpeg';
        }
        if (options.maxDimension) {
            if (options.maxDimension <= 0)
                return err('maxDimension must be positive', ErrorCode.INVALID_INPUT);
            if (meta.width > options.maxDimension || meta.height > options.maxDimension) {
                if (meta.width > meta.height) {
                    pipeline = pipeline.resize({ width: options.maxDimension, withoutEnlargement: true });
                }
                else {
                    pipeline = pipeline.resize({ height: options.maxDimension, withoutEnlargement: true });
                }
            }
        }
        const applyFormat = (p, f, q) => {
            if (f === 'webp')
                return p.webp({ quality: q });
            if (f === 'png')
                return p.png({ quality: q, compressionLevel: 9 });
            if (f === 'avif')
                return p.avif({ quality: q });
            return p.jpeg({ quality: q });
        };
        if (options.maxSizeKB) {
            if (options.maxSizeKB <= 0)
                return err('maxSizeKB must be positive', ErrorCode.INVALID_INPUT);
            const targetBytes = options.maxSizeKB * 1024;
            let minQ = 10, maxQ = 95;
            let bestBuffer = null;
            let bestDiff = Infinity;
            for (let i = 0; i < 7; i++) {
                const midQ = Math.floor((minQ + maxQ) / 2);
                const testBuf = await applyFormat(pipeline.clone(), format, midQ).toBuffer();
                const diff = targetBytes - testBuf.length;
                if (testBuf.length <= targetBytes && diff < bestDiff && diff >= 0) {
                    bestBuffer = testBuf;
                    bestDiff = diff;
                }
                if (testBuf.length > targetBytes) {
                    maxQ = midQ - 1;
                }
                else {
                    minQ = midQ + 1;
                }
            }
            if (bestBuffer)
                return ok(bestBuffer);
            const fallback = await applyFormat(pipeline.clone(), format, 10).toBuffer();
            return ok(fallback);
        }
        else {
            const output = await applyFormat(pipeline, format, 80).toBuffer();
            return ok(output);
        }
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
//# sourceMappingURL=optimize.js.map