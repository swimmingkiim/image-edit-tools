import sharp from 'sharp';

/**
 * Helper to ensure a value is a positive integer.
 */
export function isPositiveInt(val: any): boolean {
  return typeof val === 'number' && Number.isInteger(val) && val > 0;
}

/**
 * Helper to get basic dimensions securely via sharp metadata
 */
export async function getImageMetadata(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    hasAlpha: metadata.hasAlpha ?? false,
    format: metadata.format ?? 'unknown'
  };
}
