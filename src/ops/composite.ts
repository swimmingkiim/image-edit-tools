import sharp from 'sharp';
import { CompositeLayer, ImageInput, ImageResult, ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';

export async function composite(input: ImageInput, options: { layers: CompositeLayer[] }): Promise<ImageResult> {
  try {
    const buffer = await loadImage(input);
    
    if (!options.layers || !Array.isArray(options.layers)) {
      return err('Layers array required', ErrorCode.INVALID_INPUT);
    }

    const loadLayer = async (layer: CompositeLayer): Promise<sharp.OverlayOptions> => {
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

    // Detect potentially problematic opaque layers
    const warnings: string[] = [];
    const baseMeta = await sharp(buffer).metadata();
    const canvasArea = (baseMeta.width ?? 1) * (baseMeta.height ?? 1);

    for (let i = 0; i < options.layers.length; i++) {
      const layer = options.layers[i];
      const layerOpacity = layer.opacity ?? 1.0;
      if (layerOpacity >= 0.9) {
        try {
          const layerBuf = await loadImage(layer.image);
          const layerMeta = await sharp(layerBuf).metadata();
          const layerArea = (layerMeta.width ?? 0) * (layerMeta.height ?? 0);
          if (layerArea / canvasArea > 0.25) {
            warnings.push(
              `Layer ${i} is opaque (opacity=${layerOpacity}) and covers ${Math.round(layerArea / canvasArea * 100)}% of the canvas. It may hide content underneath.`
            );
          }
        } catch { /* skip analysis for unreadable layers */ }
      }
    }

    let output = buffer;
    if (overlays.length > 0) {
      output = await sharp(buffer)
        .composite(overlays)
        .toBuffer();
    }
    
    return ok(output, warnings);
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('HTTP')) return err(msg, ErrorCode.FETCH_FAILED);
    if (msg.includes('ENOENT')) return err('File not found', ErrorCode.INVALID_INPUT);
    if (msg.includes('unsupported image format')) return err('Corrupt or unsupported input', ErrorCode.INVALID_INPUT);
    return err(msg, ErrorCode.PROCESSING_FAILED);
  }
}
