import sharp from 'sharp';
/**
 * Helper to ensure a value is a positive integer.
 */
export function isPositiveInt(val) {
    return typeof val === 'number' && Number.isInteger(val) && val > 0;
}
/**
 * Helper to get basic dimensions securely via sharp metadata
 */
export async function getImageMetadata(buffer) {
    const metadata = await sharp(buffer).metadata();
    return {
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
        hasAlpha: metadata.hasAlpha ?? false,
        format: metadata.format ?? 'unknown'
    };
}
//# sourceMappingURL=validate.js.map