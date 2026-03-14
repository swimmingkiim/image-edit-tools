import sharp from 'sharp';
import { TextLayer, ImageInput, ImageResult, ErrorCode, TextAnchor } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata } from '../utils/validate.js';

function wrapText(text: string, fontSize: number, maxWidth?: number): string[] {
  if (!maxWidth) return [text];
  const charWidth = fontSize * 0.6; // Approximation
  const maxChars = Math.max(1, Math.floor(maxWidth / charWidth));
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getAnchorProps(anchor: TextAnchor = 'top-left', fontSize: number = 24): { textAnchor: string, yOffset: number } {
  const parts = anchor.split('-');
  const yAlign = parts.length === 2 ? parts[0] : parts[0] === 'center' ? 'middle' : parts[0];
  const xAlign = parts.length === 2 ? parts[1] : parts[0] === 'center' ? 'center' : 'left';

  // librsvg does NOT reliably support dominant-baseline values other than 'auto' (alphabetic).
  // Instead of relying on dominant-baseline, we compute a y-offset to position text correctly.
  // With 'auto' (alphabetic baseline), y = text baseline (bottom of caps).
  // To make y = text top, we shift down by ~0.8 * fontSize.
  // To make y = text middle, we shift down by ~0.35 * fontSize.
  let yOffset = 0;
  if (yAlign === 'top') {
    yOffset = Math.round(fontSize * 0.8);
  } else if (yAlign === 'middle' || yAlign === 'center') {
    yOffset = Math.round(fontSize * 0.35);
  }
  // 'bottom' / 'auto' → yOffset = 0 (alphabetic baseline is already at y)

  let textAnchor = 'start';
  if (xAlign === 'center') textAnchor = 'middle';
  else if (xAlign === 'right') textAnchor = 'end';

  return { textAnchor, yOffset };
}

export async function addText(input: ImageInput, options: { layers: TextLayer[] }): Promise<ImageResult> {
  try {
    const buffer = await loadImage(input);
    const meta = await getImageMetadata(buffer);
    
    if (!options.layers || !Array.isArray(options.layers)) {
      return err('Layers array required', ErrorCode.INVALID_INPUT);
    }

    const { width, height } = meta;

    let defs = '';
    let svgBody = '';
    let fontImports = new Set<string>();
    const warnings: string[] = [];
    let contentBottom = 0;

    for (let i = 0; i < options.layers.length; i++) {
      const layer = options.layers[i];
      const fontSize = layer.fontSize ?? 24;
      const color = layer.color ?? '#000000';
      const opacity = layer.opacity ?? 1.0;
      const fontFamily = layer.fontFamily ?? 'sans-serif';
      if (layer.fontUrl) fontImports.add(`@import url('${layer.fontUrl}');`);

      const lines = wrapText(layer.text, fontSize, layer.maxWidth);
      const lineHeight = layer.lineHeight ?? 1.2;
      const totalHeight = lines.length * fontSize * lineHeight;
      const approxMaxWidth = Math.max(...lines.map(l => l.length * fontSize * 0.6));

      const { textAnchor, yOffset } = getAnchorProps(layer.anchor, fontSize);
      const renderY = layer.y + yOffset;

      let align = textAnchor;
      if (layer.align) {
        align = layer.align === 'left' ? 'start' : layer.align === 'right' ? 'end' : 'middle';
      }

      // Always use dominant-baseline: auto (alphabetic) — the only value librsvg reliably supports
      let style = `font-family: ${fontFamily}; font-size: ${fontSize}px; fill: ${color}; opacity: ${opacity}; text-anchor: ${align}; dominant-baseline: auto;`;

      // Letter spacing
      if (layer.letterSpacing) {
        style += ` letter-spacing: ${layer.letterSpacing}px;`;
      }

      // Stroke (outline) — paint-order renders stroke behind fill
      if (layer.stroke) {
        style += ` stroke: ${layer.stroke.color}; stroke-width: ${layer.stroke.width}px; paint-order: stroke;`;
      }
      
      let layerSvg = '';

      if (layer.background) {
        const bg = layer.background;
        const pad = bg.padding ?? 0;
        const bgOpacity = bg.opacity ?? 1.0;
        const radius = bg.borderRadius ?? 0;

        // Background rect is positioned relative to the *intended* y (layer.y), not renderY
        let rectX = layer.x - pad;
        let rectY = layer.y - pad;
        
        if (textAnchor === 'middle') {
          rectX = layer.x - (approxMaxWidth / 2) - pad;
        } else if (textAnchor === 'end') {
          rectX = layer.x - approxMaxWidth - pad;
        }

        // Adjust for anchor vertical alignment
        const parts = (layer.anchor ?? 'top-left').split('-');
        const vAlign = parts.length === 2 ? parts[0] : parts[0] === 'center' ? 'middle' : parts[0];
        if (vAlign === 'middle' || vAlign === 'center') {
          rectY = layer.y - (totalHeight / 2) - pad;
        } else if (vAlign === 'bottom') {
          rectY = layer.y - totalHeight - pad + fontSize;
        }

        layerSvg += `<rect x="${rectX}" y="${rectY}" width="${approxMaxWidth + pad * 2}" height="${totalHeight + pad * 2}" fill="${bg.color}" opacity="${bgOpacity}" rx="${radius}" ry="${radius}" />`;
      }

      // Text shadow: render a duplicate text behind the main text
      if (layer.textShadow) {
        const ts = layer.textShadow;
        const shadowStyle = `font-family: ${fontFamily}; font-size: ${fontSize}px; fill: ${ts.color}; opacity: ${opacity}; text-anchor: ${align}; dominant-baseline: auto;${layer.letterSpacing ? ` letter-spacing: ${layer.letterSpacing}px;` : ''}`;
        const sx = layer.x + ts.offsetX;
        const sy = renderY + ts.offsetY;
        layerSvg += `<text x="${sx}" y="${sy}" style="${shadowStyle}">`;
        lines.forEach((line, idx) => {
          let dy = idx === 0 ? 0 : fontSize * lineHeight;
          layerSvg += `<tspan x="${sx}" dy="${dy}">${escapeXml(line)}</tspan>`;
        });
        layerSvg += `</text>`;
      }

      layerSvg += `<text x="${layer.x}" y="${renderY}" style="${style}">`;
      lines.forEach((line, idx) => {
        let dy = idx === 0 ? 0 : fontSize * lineHeight;
        layerSvg += `<tspan x="${layer.x}" dy="${dy}">${escapeXml(line)}</tspan>`;
      });
      layerSvg += `</text>`;

      svgBody += `<g style="isolation: isolate">${layerSvg}</g>`;

      // Compute bounding box for overflow detection (using intended y, not renderY)
      let boxX = layer.x;
      let boxY = layer.y;
      if (textAnchor === 'middle') boxX -= approxMaxWidth / 2;
      else if (textAnchor === 'end') boxX -= approxMaxWidth;
      
      const anchorParts = (layer.anchor ?? 'top-left').split('-');
      const vAlignBox = anchorParts.length === 2 ? anchorParts[0] : anchorParts[0] === 'center' ? 'middle' : anchorParts[0];
      if (vAlignBox === 'middle' || vAlignBox === 'center') boxY -= totalHeight / 2;
      else if (vAlignBox === 'bottom') boxY -= totalHeight - fontSize;

      const boxBottom = boxY + totalHeight;
      const boxRight = boxX + approxMaxWidth;
      if (boxBottom > contentBottom) contentBottom = boxBottom;

      if (boxX < 0 || boxY < 0 || boxRight > width || boxBottom > height) {
        warnings.push(
          `Text layer ${i} ("${layer.text.slice(0, 20)}...") extends beyond canvas bounds.`
        );
      }
    }

    const fontStyle = fontImports.size > 0 ? `<style>${Array.from(fontImports).join('\n')}</style>` : '';

    const svgString = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${fontStyle}
      ${defs}
      ${svgBody}
    </svg>`;

    const output = await sharp(buffer)
      .composite([{ input: Buffer.from(svgString), blend: 'over' }])
      .toBuffer();
    
    const result = ok(output, warnings);
    (result as any).bounds = { contentBottom: Math.round(contentBottom) };
    return result;
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('HTTP')) return err(msg, ErrorCode.FETCH_FAILED);
    if (msg.includes('ENOENT')) return err('File not found', ErrorCode.INVALID_INPUT);
    if (msg.includes('unsupported image format')) return err('Corrupt or unsupported input', ErrorCode.INVALID_INPUT);
    return err(msg, ErrorCode.PROCESSING_FAILED);
  }
}
