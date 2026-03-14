/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { ImageInput } from '../types.js';
/**
 * Resolves any ImageInput variant to a Buffer.
 * Handles: Buffer (passthrough), URL (fetch), base64 data URI (decode), file path (readFile).
 */
export declare function loadImage(input: ImageInput): Promise<Buffer>;
//# sourceMappingURL=load-image.d.ts.map