import { ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata } from '../utils/validate.js';
import sharp from 'sharp';
import { AutoModel, AutoProcessor, RawImage } from '@xenova/transformers';
export async function detectSubject(input) {
    try {
        const buffer = await loadImage(input);
        const meta = await getImageMetadata(buffer);
        let model, processor;
        try {
            model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
                config: { model_type: 'custom' },
                quantized: true
            });
            processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
                config: {
                    do_normalize: true, do_pad: false, do_rescale: true, do_resize: true,
                    image_mean: [0.5, 0.5, 0.5], image_std: [1, 1, 1], resample: 2, size: { width: 1024, height: 1024 },
                }
            });
        }
        catch (e) {
            return err('Model unavailable. Run: npx image-edit-tools download-models', ErrorCode.MODEL_NOT_FOUND);
        }
        const rawRgb = await sharp(buffer).ensureAlpha().raw().toBuffer();
        const img = new RawImage(new Uint8ClampedArray(rawRgb), meta.width, meta.height, 4);
        const { pixel_values } = await processor(img);
        const { output } = await model({ input: pixel_values });
        const maskData = new Uint8Array(output.data.length);
        for (let i = 0; i < output.data.length; ++i) {
            maskData[i] = Math.max(0, Math.min(255, Math.round(output.data[i] * 255)));
        }
        const maskBuffer = await sharp(Buffer.from(maskData), { raw: { width: 1024, height: 1024, channels: 1 } })
            .resize(meta.width, meta.height, { fit: 'fill' })
            .raw()
            .toBuffer();
        let minX = meta.width, minY = meta.height, maxX = 0, maxY = 0;
        let found = false;
        // maskBuffer has 1 channel, size meta.width * meta.height
        for (let y = 0; y < meta.height; y++) {
            for (let x = 0; x < meta.width; x++) {
                const val = maskBuffer[y * meta.width + x];
                if (val > 128) { // Threshold for subject
                    found = true;
                    if (x < minX)
                        minX = x;
                    if (x > maxX)
                        maxX = x;
                    if (y < minY)
                        minY = y;
                    if (y > maxY)
                        maxY = y;
                }
            }
        }
        if (!found) {
            return ok([]);
        }
        return ok([{
                x: minX,
                y: minY,
                width: maxX - minX + 1,
                height: maxY - minY + 1,
                confidence: 1.0
            }]);
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
//# sourceMappingURL=detect-subject.js.map