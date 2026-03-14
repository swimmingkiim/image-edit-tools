import sharp from 'sharp';
import { WatermarkOptions, ImageInput, ImageResult, ErrorCode, TextAnchor } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata } from '../utils/validate.js';
import { addText } from './add-text.js';
import { resize } from './resize.js';

const posToGravity: Record<string, string> = {
  'top-left': 'northwest',
  'top-center': 'north',
  'top-right': 'northeast',
  'center': 'center',
  'bottom-left': 'southwest',
  'bottom-center': 'south',
  'bottom-right': 'southeast'
};

const posToAnchor: Record<string, TextAnchor> = {
  'top-left': 'top-left',
  'top-center': 'top-center',
  'top-right': 'top-right',
  'center': 'center',
  'bottom-left': 'bottom-left',
  'bottom-center': 'bottom-center',
  'bottom-right': 'bottom-right' 
};

export async function watermark(input: ImageInput, options: WatermarkOptions): Promise<ImageResult> {
  try {
    const buffer = await loadImage(input);
    const meta = await getImageMetadata(buffer);
    const position = options.position || 'bottom-right';

    if (options.type === 'text') {
      if (position === 'tile') {
        const spacing = options.tileSpacing ?? 50;
        const fontSize = options.fontSize ?? 24;
        const color = options.color ?? '#ffffff';
        const opacity = options.opacity ?? 0.5;
        
        const charWidth = fontSize * 0.6;
        const w = options.text.length * charWidth;
        const h = fontSize;

        const cols = Math.ceil(meta.width / Math.max(1, (w + spacing)));
        const rows = Math.ceil(meta.height / Math.max(1, (h + spacing)));
        
        const layers: any[] = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            layers.push({
              text: options.text,
              x: c * (w + spacing),
              y: r * (h + spacing),
              fontSize,
              color,
              opacity,
              anchor: 'top-left'
            });
          }
        }
        return addText(buffer, { layers });
      } else {
        const anchor = posToAnchor[position] || 'bottom-right';
        let x = 0, y = 0;
        const pad = 10;
        const fontSize = options.fontSize ?? 24;
        
        if (position.includes('left')) x = pad;
        else if (position.includes('right')) x = meta.width - pad;
        else x = meta.width / 2;

        if (position.includes('top')) y = pad;
        else if (position.includes('bottom')) y = meta.height - pad;
        else y = meta.height / 2;

        return addText(buffer, {
          layers: [{
            text: options.text,
            x, y, anchor,
            fontSize,
            color: options.color ?? '#ffffff',
            opacity: options.opacity ?? 0.5
          }]
        });
      }
    } else if (options.type === 'image') {
      let wmBuf = await loadImage(options.image);
      const wmMeta = await getImageMetadata(wmBuf);
      
      if (options.scale && options.scale !== 1.0) {
        const r = await resize(wmBuf, { scale: options.scale });
        if (!r.ok) return r as ImageResult;
        wmBuf = r.data;
      }

      if (options.opacity !== undefined && options.opacity >= 0 && options.opacity < 1) {
        wmBuf = await sharp(wmBuf)
          .ensureAlpha()
          .composite([
            {
              input: Buffer.from([255, 255, 255, Math.round(options.opacity * 255)]),
              raw: { width: 1, height: 1, channels: 4 },
              tile: true,
              blend: 'dest-in'
            }
          ])
          .toBuffer();
      }

      if (position === 'tile') {
        const spacing = options.tileSpacing ?? 0;
        if (spacing > 0) {
           wmBuf = await sharp(wmBuf)
             .ensureAlpha()
             .extend({ bottom: spacing, right: spacing, background: {r:0,g:0,b:0,alpha:0} })
             .toBuffer();
        }
        const output = await sharp(buffer)
          .composite([{ input: wmBuf, tile: true, blend: 'over' }])
          .toBuffer();
        return ok(output);
      } else {
        const gravity = posToGravity[position] || 'southeast';
        const output = await sharp(buffer)
          .composite([{ input: wmBuf, gravity, blend: 'over' }])
          .toBuffer();
        return ok(output);
      }
    }
    
    return err('Invalid watermark type', ErrorCode.INVALID_INPUT);
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('HTTP')) return err(msg, ErrorCode.FETCH_FAILED);
    if (msg.includes('ENOENT')) return err('File not found', ErrorCode.INVALID_INPUT);
    if (msg.includes('unsupported image format')) return err('Corrupt or unsupported input', ErrorCode.INVALID_INPUT);
    return err(msg, ErrorCode.PROCESSING_FAILED);
  }
}
