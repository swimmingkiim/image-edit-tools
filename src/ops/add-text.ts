import sharp from 'sharp';
import { TextLayer, TextSpan, ImageInput, ImageResult, ErrorCode, TextAnchor } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata } from '../utils/validate.js';
import { resolveFontUrl } from '../utils/font-loader.js';

/**
 * Wraps text into lines that fit within a maximum pixel width.
 * Uses a character-width approximation of `fontSize * 0.6`.
 *
 * @param text - The text to wrap
 * @param fontSize - Font size in pixels
 * @param maxWidth - Maximum line width in pixels (optional)
 * @returns Array of text lines
 */
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

/**
 * Escapes special XML characters to prevent SVG injection.
 *
 * @param text - Raw text to escape
 * @returns XML-safe string
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Computes SVG text-anchor and y-offset based on the anchor setting.
 * librsvg only reliably supports `dominant-baseline: auto` (alphabetic),
 * so vertical alignment is achieved via manual y-offset.
 *
 * @param anchor - The text anchor position
 * @param fontSize - Font size for offset calculation
 * @returns Object with `textAnchor` SVG attribute and `yOffset` pixel shift
 */
function getAnchorProps(anchor: TextAnchor = 'top-left', fontSize: number = 24): { textAnchor: string, yOffset: number } {
  const parts = anchor.split('-');
  const yAlign = parts.length === 2 ? parts[0] : parts[0] === 'center' ? 'middle' : parts[0];
  const xAlign = parts.length === 2 ? parts[1] : parts[0] === 'center' ? 'center' : 'left';

  let yOffset = 0;
  if (yAlign === 'top') {
    yOffset = Math.round(fontSize * 0.8);
  } else if (yAlign === 'middle' || yAlign === 'center') {
    yOffset = Math.round(fontSize * 0.35);
  }

  let textAnchor = 'start';
  if (xAlign === 'center') textAnchor = 'middle';
  else if (xAlign === 'right') textAnchor = 'end';

  return { textAnchor, yOffset };
}

/**
 * Builds SVG `<tspan>` elements from an array of inline spans.
 * Handles style inheritance, `\n` line breaks, and highlight rects.
 *
 * @param spans - Array of TextSpan objects
 * @param layer - Parent TextLayer for default values
 * @param renderY - The computed y position for the text element
 * @returns Object containing `tspanSvg`, `highlightSvg`, and `approxMaxWidth`
 */
function buildSpansSvg(
  spans: TextSpan[],
  layer: TextLayer,
  renderY: number,
): { tspanSvg: string; highlightSvg: string; approxMaxWidth: number } {
  const baseFontSize = layer.fontSize ?? 24;
  const baseColor = layer.color ?? '#000000';
  const lineHeight = layer.lineHeight ?? 1.2;

  let tspanSvg = '';
  let highlightSvg = '';

  // Track cursor position for highlight rects and line breaks
  let cursorX = layer.x;
  let currentLineY = renderY;
  let isFirstOnLine = true;
  let maxLineWidth = 0;
  let currentLineWidth = 0;

  for (const span of spans) {
    const spanFontSize = span.fontSize ?? baseFontSize;
    const spanColor = span.color ?? baseColor;

    // Split on \n to handle line breaks within a single span
    const segments = span.text.split('\n');

    for (let segIdx = 0; segIdx < segments.length; segIdx++) {
      // Handle line break (every segment after the first means a \n was found)
      if (segIdx > 0) {
        // Flush current line width
        if (currentLineWidth > maxLineWidth) maxLineWidth = currentLineWidth;
        currentLineWidth = 0;
        cursorX = layer.x;
        currentLineY += baseFontSize * lineHeight;
        isFirstOnLine = true;
      }

      const segText = segments[segIdx];
      if (segText.length === 0) continue;

      const segWidth = segText.length * spanFontSize * 0.6;

      // Highlight rect (rendered BEFORE text so it appears behind)
      if (span.highlight) {
        highlightSvg += `<rect x="${cursorX}" y="${currentLineY - spanFontSize * 0.8}" width="${segWidth}" height="${spanFontSize}" fill="${span.highlight}" />`;
      }

      // Build inline style overrides
      const styleAttrs: string[] = [];
      if (span.bold) styleAttrs.push('font-weight: bold');
      if (span.italic) styleAttrs.push('font-style: italic');
      if (span.color) styleAttrs.push(`fill: ${spanColor}`);
      if (span.fontSize) styleAttrs.push(`font-size: ${spanFontSize}px`);

      const styleAttr = styleAttrs.length > 0 ? ` style="${styleAttrs.join('; ')};"` : '';

      if (isFirstOnLine) {
        // First tspan on a line: reset x and apply dy for line break
        const dy = currentLineY === renderY ? 0 : baseFontSize * lineHeight;
        if (dy > 0) {
          tspanSvg += `<tspan x="${layer.x}" dy="${dy}"${styleAttr}>${escapeXml(segText)}</tspan>`;
        } else {
          tspanSvg += `<tspan${styleAttr}>${escapeXml(segText)}</tspan>`;
        }
        isFirstOnLine = false;
      } else {
        tspanSvg += `<tspan${styleAttr}>${escapeXml(segText)}</tspan>`;
      }

      cursorX += segWidth;
      currentLineWidth += segWidth;
    }
  }

  // Final line width check
  if (currentLineWidth > maxLineWidth) maxLineWidth = currentLineWidth;

  return {
    tspanSvg,
    highlightSvg,
    approxMaxWidth: maxLineWidth,
  };
}

/**
 * Adds text layers onto an image using SVG overlay compositing.
 *
 * Supports two rendering modes:
 * 1. **Plain text** — uses `layer.text` with optional `maxWidth` wrapping
 * 2. **Inline spans** — uses `layer.spans[]` for mixed-style rendering
 *
 * Font loading: if `layer.fontUrl` starts with `https://`, the font is
 * automatically downloaded and cached locally for librsvg compatibility.
 *
 * @param input - Source image (Buffer, URL, data-URI, or file path)
 * @param options - Object containing `layers` array of `TextLayer`
 * @returns ImageResult with the composited image buffer
 *
 * @example
 * // Plain text
 * await addText(buffer, { layers: [{ text: 'Hello', x: 10, y: 50 }] });
 *
 * @example
 * // Inline spans
 * await addText(buffer, { layers: [{
 *   x: 10, y: 50, fontSize: 28, color: '#333',
 *   spans: [
 *     { text: 'normal ' },
 *     { text: 'bold', bold: true, color: '#000' },
 *   ]
 * }] });
 */
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

      // ── Font loading ──────────────────────────────────────────────
      if (layer.fontUrl) {
        const localUrl = await resolveFontUrl(layer.fontUrl);
        fontImports.add(`@font-face { font-family: '${fontFamily}'; src: url('${localUrl}'); }`);
      }

      const lineHeight = layer.lineHeight ?? 1.2;
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
      let totalHeight: number;
      let approxMaxWidth: number;
      let layerTextPreview: string;

      // ── Spans mode vs plain text mode ─────────────────────────────
      if (layer.spans && layer.spans.length > 0) {
        // Emit warnings for spans mode edge cases
        if (layer.text) {
          warnings.push('text field ignored when spans is provided');
        }
        if (layer.maxWidth) {
          warnings.push('maxWidth is not supported with spans');
        }

        const spansResult = buildSpansSvg(layer.spans, layer, renderY);
        approxMaxWidth = spansResult.approxMaxWidth;

        // Count line breaks to compute totalHeight
        const fullText = layer.spans.map((s) => s.text).join('');
        const lineCount = (fullText.match(/\n/g) ?? []).length + 1;
        totalHeight = lineCount * fontSize * lineHeight;

        layerTextPreview = fullText.slice(0, 20);

        // Background rect
        if (layer.background) {
          const bg = layer.background;
          const pad = bg.padding ?? 0;
          const bgOpacity = bg.opacity ?? 1.0;
          const radius = bg.borderRadius ?? 0;

          let rectX = layer.x - pad;
          let rectY = layer.y - pad;
          
          if (textAnchor === 'middle') {
            rectX = layer.x - (approxMaxWidth / 2) - pad;
          } else if (textAnchor === 'end') {
            rectX = layer.x - approxMaxWidth - pad;
          }

          const parts = (layer.anchor ?? 'top-left').split('-');
          const vAlign = parts.length === 2 ? parts[0] : parts[0] === 'center' ? 'middle' : parts[0];
          if (vAlign === 'middle' || vAlign === 'center') {
            rectY = layer.y - (totalHeight / 2) - pad;
          } else if (vAlign === 'bottom') {
            rectY = layer.y - totalHeight - pad + fontSize;
          }

          layerSvg += `<rect x="${rectX}" y="${rectY}" width="${approxMaxWidth + pad * 2}" height="${totalHeight + pad * 2}" fill="${bg.color}" opacity="${bgOpacity}" rx="${radius}" ry="${radius}" />`;
        }

        // Highlight rects (behind text)
        layerSvg += spansResult.highlightSvg;

        // Shadow for spans mode
        if (layer.textShadow) {
          const ts = layer.textShadow;
          const shadowStyle = `font-family: ${fontFamily}; font-size: ${fontSize}px; fill: ${ts.color}; opacity: ${opacity}; text-anchor: ${align}; dominant-baseline: auto;${layer.letterSpacing ? ` letter-spacing: ${layer.letterSpacing}px;` : ''}`;
          const sx = layer.x + ts.offsetX;
          const sy = renderY + ts.offsetY;
          layerSvg += `<text x="${sx}" y="${sy}" style="${shadowStyle}">${spansResult.tspanSvg}</text>`;
        }

        // Main text element with spans
        layerSvg += `<text x="${layer.x}" y="${renderY}" style="${style}">${spansResult.tspanSvg}</text>`;
      } else {
        // ── Plain text mode (existing logic) ─────────────────────────
        const lines = wrapText(layer.text, fontSize, layer.maxWidth);
        totalHeight = lines.length * fontSize * lineHeight;
        approxMaxWidth = Math.max(...lines.map(l => l.length * fontSize * 0.6));
        layerTextPreview = layer.text.slice(0, 20);

        if (layer.background) {
          const bg = layer.background;
          const pad = bg.padding ?? 0;
          const bgOpacity = bg.opacity ?? 1.0;
          const radius = bg.borderRadius ?? 0;

          let rectX = layer.x - pad;
          let rectY = layer.y - pad;
          
          if (textAnchor === 'middle') {
            rectX = layer.x - (approxMaxWidth / 2) - pad;
          } else if (textAnchor === 'end') {
            rectX = layer.x - approxMaxWidth - pad;
          }

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
      }

      svgBody += `<g style="isolation: isolate">${layerSvg}</g>`;

      // ── Bounding box / overflow detection ──────────────────────────
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
          `Text layer ${i} ("${layerTextPreview}...") extends beyond canvas bounds.`
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
    if (msg.includes('Font download failed') || msg.includes('Google Fonts CSS fetch failed')) {
      return err(msg, ErrorCode.FETCH_FAILED);
    }
    return err(msg, ErrorCode.PROCESSING_FAILED);
  }
}
