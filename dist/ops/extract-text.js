import { ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import Tesseract from 'tesseract.js';
export async function extractText(input, options = {}) {
    try {
        const buffer = await loadImage(input);
        const lang = options.lang || 'eng';
        const result = await Tesseract.recognize(buffer, lang);
        return ok(result.data.text);
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
//# sourceMappingURL=extract-text.js.map