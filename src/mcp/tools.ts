import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as api from '../index.js';
import { ImageInput } from '../types.js';

export const allTools: Tool[] = [
  {
    name: 'image_crop',
    description: 'Crops an image. Supports absolute coords, ratio, aspect ratio, or subject mode.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64 data URI, HTTP URL, or local path' },
        mode: { type: 'string', enum: ['absolute', 'ratio', 'aspect', 'subject'] },
        x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' },
        left: { type: 'number' }, top: { type: 'number' }, right: { type: 'number' }, bottom: { type: 'number' },
        aspectRatio: { type: 'string' }, anchor: { type: 'string' }
      },
      required: ['image']
    }
  },
  {
    name: 'image_resize',
    description: 'Resizes an image. Specify width/height or a scale multiplier.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        width: { type: 'number' }, height: { type: 'number' }, scale: { type: 'number' },
        fit: { type: 'string', enum: ['cover', 'contain', 'fill', 'inside', 'outside'] },
        kernel: { type: 'string' }
      },
      required: ['image']
    }
  },
  {
    name: 'image_pad',
    description: 'Pads an image edges. Supports absolute edges or square target size with custom color.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        top: { type: 'number' }, right: { type: 'number' }, bottom: { type: 'number' }, left: { type: 'number' },
        size: { type: 'number' }, color: { type: 'string' }
      },
      required: ['image']
    }
  },
  {
    name: 'image_adjust',
    description: 'Adjusts brightness, contrast, saturation, hue, sharpness, and temperature (-100 to 100).',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        brightness: { type: 'number', description: 'Range: -100 to 100' }, 
        contrast: { type: 'number', description: 'Range: -100 to 100' }, 
        saturation: { type: 'number', description: 'Range: -100 to 100' },
        hue: { type: 'number', description: 'Range: 0 to 360' }, 
        sharpness: { type: 'number', description: 'Range: 0 to 100' }, 
        temperature: { type: 'number', description: 'Range: -100 to 100' }
      },
      required: ['image']
    }
  },
  {
    name: 'image_filter',
    description: 'Applies preset filters: grayscale, sepia, invert, vintage, unsharp, or blur with radius.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        preset: { type: 'string', enum: ['grayscale', 'sepia', 'invert', 'vintage', 'unsharp', 'blur'] },
        radius: { type: 'number' }
      },
      required: ['image', 'preset']
    }
  },
  {
    name: 'image_blur_region',
    description: 'Blurs specific absolute regions in the image.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        regions: { 
          type: 'array', 
          items: { 
            type: 'object',
            properties: { 
              x: { type: 'number' }, y: { type: 'number' }, 
              width: { type: 'number' }, height: { type: 'number' }, 
              radius: { type: 'number', description: 'Blur radius' } 
            },
            required: ['x', 'y', 'width', 'height']
          } 
        }
      },
      required: ['image']
    }
  },
  {
    name: 'image_add_text',
    description: 'Adds text layers. Requires x, y, text, font size, and optional alignment parameters.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        layers: { type: 'array', items: { type: 'object' } }
      },
      required: ['image']
    }
  },
  {
    name: 'image_composite',
    description: 'Composites images together with blend modes.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        layers: { type: 'array', items: { type: 'object' } }
      },
      required: ['image']
    }
  },
  {
    name: 'image_watermark',
    description: 'Applies watermarks either text or image at discrete positions or tiled.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        type: { type: 'string', enum: ['text', 'image'] },
        text: { type: 'string' }, imageLayer: { type: 'string' },
        position: { type: 'string' }, opacity: { type: 'number' }
      },
      required: ['image', 'type']
    }
  },
  {
    name: 'image_remove_bg',
    description: 'Removes background using AI model RMBG-1.4. Optionally replaces with color or image.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        replaceColor: { type: 'string' },
        replaceImage: { type: 'string' }
      },
      required: ['image']
    }
  },
  {
    name: 'image_convert',
    description: 'Converts image to jpeg, png, webp, avif, or gif.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        format: { type: 'string', enum: ['jpeg', 'png', 'webp', 'avif', 'gif'] },
        quality: { type: 'number' },
        stripMetadata: { type: 'boolean' }
      },
      required: ['image', 'format']
    }
  },
  {
    name: 'image_optimize',
    description: 'Optimizes an image to fit max size in KB or max dimension.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        maxSizeKB: { type: 'number' }, maxDimension: { type: 'number' }, autoFormat: { type: 'boolean' }
      },
      required: ['image']
    }
  },
  {
    name: 'image_get_metadata',
    description: 'Returns image metadata like dimensions, format, hasAlpha.',
    inputSchema: { type: 'object', properties: { image: { type: 'string' } }, required: ['image'] }
  },
  {
    name: 'image_get_dominant_colors',
    description: 'Returns hex values of the primary colors in the image.',
    inputSchema: { type: 'object', properties: { image: { type: 'string' }, count: { type: 'number' } }, required: ['image'] }
  },
  {
    name: 'image_detect_faces',
    description: 'Detects bounding boxes around faces/people in the image using AI.',
    inputSchema: { type: 'object', properties: { image: { type: 'string' } }, required: ['image'] }
  },
  {
    name: 'image_extract_text',
    description: 'Runs OCR using tesseract.js to extract text from the image.',
    inputSchema: { type: 'object', properties: { image: { type: 'string' }, lang: { type: 'string' } }, required: ['image'] }
  },
  {
    name: 'image_pipeline',
    description: 'Runs a sequence of operations on the image seamlessly in memory.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        operations: { type: 'array', items: { type: 'object' } }
      },
      required: ['image', 'operations']
    }
  },
  {
    name: 'image_batch',
    description: 'Runs a single operation on multiple images.',
    inputSchema: {
      type: 'object',
      properties: {
        images: { type: 'array', items: { type: 'string' } },
        operation: { type: 'string' },
        options: { type: 'object' }
      },
      required: ['images', 'operation', 'options']
    }
  },
  {
    name: 'image_rotate',
    description: 'Rotates an image by an arbitrary angle. Exposed areas are transparent by default.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        angle: { type: 'number', description: 'Rotation angle in degrees (0-360), clockwise' },
        background: { type: 'string', description: 'Background color for exposed areas. Default: transparent' }
      },
      required: ['image', 'angle']
    }
  },
  {
    name: 'image_gradient_overlay',
    description: 'Applies a gradient overlay for text readability. Great for placing text over photos.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        direction: { type: 'string', enum: ['top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'] },
        color: { type: 'string', description: 'Gradient color. Default: #000000' },
        opacity: { type: 'number', description: '0-1. Default: 0.7' },
        coverage: { type: 'number', description: '0-1 how much of image is covered. Default: 0.5' }
      },
      required: ['image']
    }
  },
  {
    name: 'image_clip_to_shape',
    description: 'Clips an image to a shape: circle, ellipse, or rounded-rect. Perfect for profile photos.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        shape: { type: 'string', enum: ['circle', 'ellipse', 'rounded-rect'] },
        borderRadius: { type: 'number', description: 'For rounded-rect. Default: 32' }
      },
      required: ['image', 'shape']
    }
  },
  {
    name: 'image_draw_shape',
    description: 'Creates a new image containing a shape (rect, circle, ellipse, line). Use with composite to layer.',
    inputSchema: {
      type: 'object',
      properties: {
        width: { type: 'number' }, height: { type: 'number' },
        shape: { type: 'string', enum: ['rect', 'circle', 'ellipse', 'line'] },
        fill: { type: 'string' }, fillOpacity: { type: 'number' },
        stroke: { type: 'string' }, strokeWidth: { type: 'number' },
        borderRadius: { type: 'number' },
        cx: { type: 'number' }, cy: { type: 'number' }, r: { type: 'number' }, ry: { type: 'number' },
        x1: { type: 'number' }, y1: { type: 'number' }, x2: { type: 'number' }, y2: { type: 'number' }
      },
      required: ['width', 'height', 'shape']
    }
  },
  {
    name: 'image_drop_shadow',
    description: 'Adds a drop shadow behind the image. Expands canvas to fit shadow.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        color: { type: 'string', description: 'Shadow color. Default: rgba(0,0,0,0.5)' },
        offsetX: { type: 'number', description: 'Default: 4' },
        offsetY: { type: 'number', description: 'Default: 4' },
        blur: { type: 'number', description: 'Blur radius. Default: 8' },
        expand: { type: 'boolean', description: 'Expand canvas. Default: true' }
      },
      required: ['image']
    }
  }
];

export async function handleTool(name: string, args: Record<string, any>): Promise<string> {
  const image = args.image as ImageInput;
  let result: any;
  
  if (name === 'image_pipeline') result = await api.pipeline(image, args.operations);
  else if (name === 'image_batch') result = await api.batch(args.images, args.operation, args.options);
  else if (name === 'image_crop') result = await api.crop(image, args as any);
  else if (name === 'image_resize') result = await api.resize(image, args as any);
  else if (name === 'image_pad') result = await api.pad(image, args as any);
  else if (name === 'image_adjust') result = await api.adjust(image, args as any);
  else if (name === 'image_filter') result = await api.filter(image, args as any);
  else if (name === 'image_blur_region') result = await api.blurRegion(image, args as any);
  else if (name === 'image_add_text') result = await api.addText(image, args as any);
  else if (name === 'image_composite') result = await api.composite(image, args as any);
  else if (name === 'image_watermark') {
    const opts = { ...args };
    if (opts.type === 'image' && opts.imageLayer) opts.image = opts.imageLayer;
    result = await api.watermark(image, opts as any);
  }
  else if (name === 'image_remove_bg') result = await api.removeBg(image, args as any);
  else if (name === 'image_convert') result = await api.convert(image, args as any);
  else if (name === 'image_optimize') result = await api.optimize(image, args as any);
  else if (name === 'image_get_metadata') {
    const meta = await api.getMetadata(image);
    return JSON.stringify(meta.ok ? meta.data : { error: meta.error, code: meta.code });
  }
  else if (name === 'image_get_dominant_colors') {
    const cols = await api.getDominantColors(image, args.count);
    return JSON.stringify(cols);
  }
  else if (name === 'image_detect_faces') {
    const faces = await api.detectFaces(image);
    return JSON.stringify(faces);
  }
  else if (name === 'image_extract_text') {
    const txt = await api.extractText(image, args);
    return JSON.stringify(txt);
  }
  else if (name === 'image_rotate') result = await api.rotate(image, args as any);
  else if (name === 'image_gradient_overlay') result = await api.gradientOverlay(image, args as any);
  else if (name === 'image_clip_to_shape') result = await api.clipToShape(image, args as any);
  else if (name === 'image_draw_shape') {
    result = await api.drawShape(args as any);
    if (result && result.ok && Buffer.isBuffer(result.data)) {
      const b64 = result.data.toString('base64');
      return JSON.stringify({ ok: true, data: `data:image/png;base64,${b64}` });
    }
    return JSON.stringify(result);
  }
  else if (name === 'image_drop_shadow') result = await api.dropShadow(image, args as any);
  else {
    return JSON.stringify({ error: `Tool ${name} not implemented`, code: 'INVALID_INPUT' });
  }

  if (result && !result.ok) {
    return JSON.stringify({ error: result.error, code: result.code });
  } else if (result && Buffer.isBuffer(result.data)) {
    const fmt = args.format || 'png';
    const b64 = result.data.toString('base64');
    return JSON.stringify({ ok: true, data: `data:image/${fmt};base64,${b64}` });
  }

  return JSON.stringify(result);
}
