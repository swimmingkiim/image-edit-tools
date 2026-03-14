import { ErrorCode } from '../types.js';
import { crop } from './crop.js';
import { resize } from './resize.js';
import { pad } from './pad.js';
import { adjust } from './adjust.js';
import { filter } from './filter.js';
import { blurRegion } from './blur-region.js';
import { addText } from './add-text.js';
import { composite } from './composite.js';
import { watermark } from './watermark.js';
import { convert } from './convert.js';
import { optimize } from './optimize.js';
import { removeBg } from './remove-bg.js';
export async function pipeline(input, operations) {
    let currentImage = input;
    for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        let result;
        try {
            switch (op.op) {
                case 'crop':
                    result = await crop(currentImage, op);
                    break;
                case 'resize':
                    result = await resize(currentImage, op);
                    break;
                case 'pad':
                    result = await pad(currentImage, op);
                    break;
                case 'adjust':
                    result = await adjust(currentImage, op);
                    break;
                case 'filter':
                    result = await filter(currentImage, op);
                    break;
                case 'blurRegion':
                    result = await blurRegion(currentImage, { regions: op.regions });
                    break;
                case 'addText':
                    result = await addText(currentImage, { layers: op.layers });
                    break;
                case 'composite':
                    result = await composite(currentImage, { layers: op.layers });
                    break;
                case 'watermark':
                    result = await watermark(currentImage, op);
                    break;
                case 'convert':
                    result = await convert(currentImage, op);
                    break;
                case 'optimize':
                    result = await optimize(currentImage, op);
                    break;
                case 'removeBg':
                    result = await removeBg(currentImage, op);
                    break;
                default:
                    return { ok: false, error: `Unknown operation`, code: ErrorCode.INVALID_INPUT, step: i };
            }
            if (!result.ok) {
                return { ...result, step: i };
            }
            currentImage = result.data;
        }
        catch (e) {
            return { ok: false, error: e.message, code: ErrorCode.PROCESSING_FAILED, step: i };
        }
    }
    if (operations.length === 0) {
        const { loadImage } = await import('../utils/load-image.js');
        try {
            const buf = await loadImage(input);
            return { ok: true, data: buf };
        }
        catch (e) {
            return { ok: false, error: 'Failed to load initial image', code: ErrorCode.INVALID_INPUT, step: 0 };
        }
    }
    return { ok: true, data: currentImage };
}
//# sourceMappingURL=pipeline.js.map