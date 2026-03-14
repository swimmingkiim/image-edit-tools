import sharp from 'sharp';
import { ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
export async function composite(input, options) {
    try {
        const buffer = await loadImage(input);
        if (!options.layers || !Array.isArray(options.layers)) {
            return err('Layers array required', ErrorCode.INVALID_INPUT);
        }
        const loadLayer = async (layer) => {
            let layerBuf = await loadImage(layer.image);
            if (layer.opacity !== undefined && layer.opacity >= 0 && layer.opacity < 1) {
                layerBuf = await sharp(layerBuf)
                    .ensureAlpha()
                    .composite([
                    {
                        input: Buffer.from([255, 255, 255, Math.round(layer.opacity * 255)]),
                        raw: { width: 1, height: 1, channels: 4 },
                        tile: true,
                        blend: 'dest-in'
                    }
                ])
                    .toBuffer();
            }
            return {
                input: layerBuf,
                left: layer.x !== undefined ? Math.floor(layer.x) : 0,
                top: layer.y !== undefined ? Math.floor(layer.y) : 0,
                blend: layer.blend || 'over'
            };
        };
        const overlays = await Promise.all(options.layers.map(loadLayer));
        let output = buffer;
        if (overlays.length > 0) {
            output = await sharp(buffer)
                .composite(overlays)
                .toBuffer();
        }
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
//# sourceMappingURL=composite.js.map