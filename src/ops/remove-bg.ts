import sharp from 'sharp';
import { RemoveBgOptions, ImageInput, ImageResult, ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata } from '../utils/validate.js';
import { AutoModel, AutoProcessor, RawImage } from '@xenova/transformers';

export async function removeBg(input: ImageInput, options: RemoveBgOptions = {}): Promise<ImageResult> {
  try {
    const buffer = await loadImage(input);
    const meta = await getImageMetadata(buffer);
    
    let model: any, processor: any;
    try {
      model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
        config: { model_type: 'custom' },
        quantized: true // Use quantized for speed and avoiding OOM
      });
      processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
        config: {
          do_normalize: true,
          do_pad: false,
          do_rescale: true,
          do_resize: true,
          image_mean: [0.5, 0.5, 0.5],
          image_std: [1, 1, 1],
          resample: 2,
          size: { width: 1024, height: 1024 },
        }
      });
    } catch (e: any) {
      return err('Model unavailable. Run: npx image-edit-tools download-models', ErrorCode.MODEL_NOT_FOUND);
    }

    // Process image
    const rawImage = await RawImage.fromURL(URL.createObjectURL(new Blob([buffer]))); // Alternative for node:
    // RawImage from buffer is easier using sharp. We need uint8 array of RGB or RGBA.
    const rawRgb = await sharp(buffer).ensureAlpha().raw().toBuffer();
    const img = new RawImage(new Uint8ClampedArray(rawRgb), meta.width, meta.height, 4);

    const { pixel_values } = await processor(img);
    const { output } = await model({ input: pixel_values });

    // Output is a mask tensor. Resize mask back to original dimensions using sharp.
    // The model outputs size 1024x1024.
    const maskData = new Uint8Array(output.data.length);
    for (let i = 0; i < output.data.length; ++i) {
      maskData[i] = Math.max(0, Math.min(255, Math.round(output.data[i] * 255))); // Assume output is 0.0 to 1.0 floats
    }

    const maskBuffer = await sharp(Buffer.from(maskData), { raw: { width: 1024, height: 1024, channels: 1 } })
      .resize(meta.width, meta.height, { fit: 'fill' }) // match original size
      .toBuffer();

    let outputBuf = await sharp(buffer)
      .ensureAlpha()
      .joinChannel(maskBuffer) // join mask as alpha channel
      .png()
      .toBuffer();

    // Replace color or image
    if (options.replaceColor) {
      outputBuf = await sharp(outputBuf)
        .flatten({ background: options.replaceColor })
        .toBuffer();
    } else if (options.replaceImage) {
      const bgBuf = await loadImage(options.replaceImage);
      // Resize background to match image if needed, or simply composite subject over background
      const sizedBgBuf = await sharp(bgBuf).resize(meta.width, meta.height, { fit: 'cover' }).toBuffer();
      outputBuf = await sharp(sizedBgBuf)
        .composite([{ input: outputBuf, blend: 'over' }])
        .toBuffer();
    }
    
    return ok(outputBuf);
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('HTTP')) return err(msg, ErrorCode.FETCH_FAILED);
    if (msg.includes('ENOENT')) return err('File not found', ErrorCode.INVALID_INPUT);
    return err(msg, ErrorCode.PROCESSING_FAILED);
  }
}
