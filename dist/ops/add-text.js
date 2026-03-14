import sharp from 'sharp';
import { ErrorCode } from '../types.js';
import { loadImage } from '../utils/load-image.js';
import { err, ok } from '../utils/result.js';
import { getImageMetadata } from '../utils/validate.js';
function wrapText(text, fontSize, maxWidth) {
    if (!maxWidth)
        return [text];
    const charWidth = fontSize * 0.6; // Approximation
    const maxChars = Math.max(1, Math.floor(maxWidth / charWidth));
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxChars) {
            currentLine = (currentLine + ' ' + word).trim();
        }
        else {
            if (currentLine)
                lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine)
        lines.push(currentLine);
    return lines;
}
function getAnchorProps(anchor = 'top-left') {
    const parts = anchor.split('-');
    const yAlign = parts.length === 2 ? parts[0] : parts[0] === 'center' ? 'middle' : parts[0];
    const xAlign = parts.length === 2 ? parts[1] : parts[0] === 'center' ? 'center' : 'left';
    let dominantBaseline = 'hanging'; // top
    if (yAlign === 'bottom')
        dominantBaseline = 'auto'; // bottom is harder, usually means using y directly on baseline, but we can do mathematical offset. We'll rely on SVG baselines.
    else if (yAlign === 'middle' || yAlign === 'center')
        dominantBaseline = 'middle';
    else if (yAlign === 'auto')
        dominantBaseline = 'auto';
    // Sharp's librsvg supports dominant-baseline: text-before-edge (top), middle, alphabetic (bottom)
    const baselineMap = { top: 'text-before-edge', middle: 'middle', bottom: 'alphabetic', center: 'middle' };
    let textAnchor = 'start';
    if (xAlign === 'center')
        textAnchor = 'middle';
    else if (xAlign === 'right')
        textAnchor = 'end';
    return { textAnchor, dominantBaseline: baselineMap[yAlign] || 'text-before-edge' };
}
export async function addText(input, options) {
    try {
        const buffer = await loadImage(input);
        const meta = await getImageMetadata(buffer);
        if (!options.layers || !Array.isArray(options.layers)) {
            return err('Layers array required', ErrorCode.INVALID_INPUT);
        }
        const { width, height } = meta;
        let defs = '';
        let svgBody = '';
        let fontImports = new Set();
        for (let i = 0; i < options.layers.length; i++) {
            const layer = options.layers[i];
            const fontSize = layer.fontSize ?? 24;
            const color = layer.color ?? '#000000';
            const opacity = layer.opacity ?? 1.0;
            const fontFamily = layer.fontFamily ?? 'sans-serif';
            if (layer.fontUrl)
                fontImports.add(`@import url('${layer.fontUrl}');`);
            const lines = wrapText(layer.text, fontSize, layer.maxWidth);
            const lineHeight = layer.lineHeight ?? 1.2;
            const totalHeight = lines.length * fontSize * lineHeight;
            const approxMaxWidth = Math.max(...lines.map(l => l.length * fontSize * 0.6));
            const { textAnchor, dominantBaseline } = getAnchorProps(layer.anchor);
            let align = textAnchor;
            if (layer.align) {
                align = layer.align === 'left' ? 'start' : layer.align === 'right' ? 'end' : 'middle';
            }
            const style = `font-family: ${fontFamily}; font-size: ${fontSize}px; fill: ${color}; opacity: ${opacity}; text-anchor: ${align}; dominant-baseline: ${dominantBaseline};`;
            let layerSvg = '';
            if (layer.background) {
                const bg = layer.background;
                const pad = bg.padding ?? 0;
                const bgOpacity = bg.opacity ?? 1.0;
                const radius = bg.borderRadius ?? 0;
                let rectX = layer.x - pad;
                let rectY = layer.y - pad;
                if (textAnchor === 'middle') {
                    rectX = layer.x - (approxMaxWidth / 2) - pad;
                }
                else if (textAnchor === 'end') {
                    rectX = layer.x - approxMaxWidth - pad;
                }
                if (dominantBaseline === 'middle') {
                    rectY = layer.y - (totalHeight / 2) - pad;
                }
                else if (dominantBaseline === 'alphabetic') { // bottom
                    rectY = layer.y - totalHeight - pad + fontSize;
                }
                layerSvg += `<rect x="${rectX}" y="${rectY}" width="${approxMaxWidth + pad * 2}" height="${totalHeight + pad * 2}" fill="${bg.color}" opacity="${bgOpacity}" rx="${radius}" ry="${radius}" />`;
            }
            layerSvg += `<text x="${layer.x}" y="${layer.y}" style="${style}">`;
            lines.forEach((line, idx) => {
                let dy = idx === 0 ? 0 : fontSize * lineHeight;
                layerSvg += `<tspan x="${layer.x}" dy="${dy}">${line}</tspan>`;
            });
            layerSvg += `</text>`;
            svgBody += `<g style="isolation: isolate">${layerSvg}</g>`;
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
        return ok(output);
    }
    catch (e) {
        const msg = e.message || '';
        if (msg.includes('HTTP'))
            return err(msg, ErrorCode.FETCH_FAILED);
        if (msg.includes('ENOENT'))
            return err('File not found', ErrorCode.INVALID_INPUT);
        if (msg.includes('unsupported image format'))
            return err('Corrupt or unsupported input', ErrorCode.INVALID_INPUT);
        return err(msg, ErrorCode.PROCESSING_FAILED);
    }
}
//# sourceMappingURL=add-text.js.map