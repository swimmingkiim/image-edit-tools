/**
 * Instagram Card News Generator
 * 
 * Demonstrates: addText, composite, sharp SVG generation
 * Output: 1080x1080 Instagram carousel slides (cover + 3 content + closing)
 * 
 * NOTE: librsvg cannot render color emoji. This example uses composite()
 *       with SVG-generated icon shapes instead of emoji in addText().
 * 
 * Usage:
 *   npx tsx examples/instagram-card-news.ts
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { addText } from '../src/ops/add-text.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, 'output');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Design Tokens ────────────────────────────────────────────────────────────
const SIZE = 1080;
const PALETTE = {
  bg:       '#0F172A',
  accent:   '#3B82F6',
  surface:  '#1E293B',
  text:     '#F8FAFC',
  muted:    '#94A3B8',
  highlight:'#F59E0B',
  purple:   '#8B5CF6',
};

// ── SVG Shape Helpers ────────────────────────────────────────────────────────
async function canvas(color: string): Promise<Buffer> {
  return sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: color } }).png().toBuffer();
}

async function roundedRect(w: number, h: number, color: string, radius: number, opacity = 1): Promise<Buffer> {
  const svg = `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="${color}" opacity="${opacity}"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function svgCircle(r: number, color: string): Promise<Buffer> {
  const d = r * 2;
  const svg = `<svg width="${d}" height="${d}"><circle cx="${r}" cy="${r}" r="${r}" fill="${color}"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function gradientBanner(w: number, h: number, rx = 0): Promise<Buffer> {
  const svg = `<svg width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${PALETTE.accent}"/>
      <stop offset="100%" stop-color="${PALETTE.purple}"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" rx="${rx}" fill="url(#g)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function numberBadge(num: number): Promise<Buffer> {
  const s = 80;
  const svg = `<svg width="${s}" height="${s}">
    <circle cx="${s/2}" cy="${s/2}" r="${s/2}" fill="${PALETTE.accent}"/>
    <text x="${s/2}" y="${s/2}" text-anchor="middle" dominant-baseline="central"
          font-family="sans-serif" font-weight="bold" font-size="36" fill="white">${num}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ── Icon Helpers (SVG shapes to replace emoji) ───────────────────────────────
async function iconArrow(size: number): Promise<Buffer> {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 48 48">
    <polygon points="10,24 38,24 28,14" fill="${PALETTE.accent}" stroke="${PALETTE.accent}" stroke-width="2" stroke-linejoin="round"/>
    <polygon points="10,24 38,24 28,34" fill="${PALETTE.accent}" stroke="${PALETTE.accent}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="10" y="20" width="28" height="8" rx="4" fill="${PALETTE.accent}"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function iconCrop(size: number): Promise<Buffer> {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 48 48">
    <path d="M12,4 L12,36 L44,36" stroke="${PALETTE.accent}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M36,44 L36,12 L4,12" stroke="${PALETTE.purple}" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function iconPalette(size: number): Promise<Buffer> {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="20" fill="none" stroke="${PALETTE.highlight}" stroke-width="3"/>
    <circle cx="16" cy="18" r="4" fill="#FF6B6B"/>
    <circle cx="28" cy="14" r="4" fill="#51CF66"/>
    <circle cx="34" cy="24" r="4" fill="#339AF0"/>
    <circle cx="18" cy="30" r="4" fill="${PALETTE.highlight}"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function iconDrop(size: number): Promise<Buffer> {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 48 48">
    <path d="M24,6 Q24,6 36,26 A14,14 0 1,1 12,26 Q24,6 24,6Z" fill="${PALETTE.accent}" opacity="0.8"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function iconLink(size: number): Promise<Buffer> {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 48 48">
    <path d="M18,30 L30,18" stroke="${PALETTE.purple}" stroke-width="4" stroke-linecap="round"/>
    <path d="M22,34 L14,34 A8,8 0 0,1 14,18 L20,18" stroke="${PALETTE.purple}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M26,14 L34,14 A8,8 0 0,1 34,30 L28,30" stroke="${PALETTE.purple}" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function iconTerminal(size: number): Promise<Buffer> {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 48 48">
    <rect x="4" y="8" width="40" height="32" rx="4" fill="#0D1117" stroke="${PALETTE.accent}" stroke-width="2"/>
    <path d="M12,20 L20,26 L12,32" stroke="#51CF66" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="24" y1="32" x2="36" y2="32" stroke="${PALETTE.muted}" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function iconBot(size: number): Promise<Buffer> {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 48 48">
    <rect x="10" y="16" width="28" height="24" rx="6" fill="${PALETTE.accent}"/>
    <circle cx="24" cy="12" r="4" fill="${PALETTE.accent}"/>
    <line x1="24" y1="8" x2="24" y2="4" stroke="${PALETTE.accent}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="18" cy="26" r="3" fill="white"/>
    <circle cx="30" cy="26" r="3" fill="white"/>
    <rect x="18" y="33" width="12" height="3" rx="1.5" fill="white"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function iconStar(size: number): Promise<Buffer> {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 48 48">
    <polygon points="24,4 29,18 44,18 32,28 36,42 24,34 12,42 16,28 4,18 19,18"
             fill="${PALETTE.highlight}" stroke="${PALETTE.highlight}" stroke-width="1"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 1: Cover
// ═══════════════════════════════════════════════════════════════════════════════
async function slide1_cover(): Promise<Buffer> {
  let bg = await canvas(PALETTE.bg);

  const topBar = await gradientBanner(SIZE, 8);
  const circle1 = await svgCircle(200, PALETTE.accent + '15');
  const circle2 = await svgCircle(140, PALETTE.highlight + '10');
  const card = await roundedRect(900, 500, PALETTE.surface, 32, 0.9);
  const arrow = await iconArrow(64);

  bg = await sharp(bg).composite([
    { input: topBar, top: 0, left: 0 },
    { input: circle1, top: -60, left: -60 },
    { input: circle2, top: 800, left: 880 },
    { input: card, top: 260, left: 90 },
    { input: arrow, top: 170, left: SIZE / 2 - 32 },
  ]).png().toBuffer();

  const result = await addText(bg, { layers: [
    { text: 'Image Edit Tools', x: SIZE / 2, y: 340, fontSize: 56, color: PALETTE.text, anchor: 'top-center' },
    { text: 'AI Agent Image Editing SDK', x: SIZE / 2, y: 420, fontSize: 32, color: PALETTE.highlight, anchor: 'top-center' },
    { text: 'TypeScript  /  Sharp  /  MCP', x: SIZE / 2, y: 520, fontSize: 28, color: PALETTE.muted, anchor: 'top-center' },
    { text: 'Swipe to learn more', x: SIZE / 2, y: 950, fontSize: 24, color: PALETTE.muted, anchor: 'top-center' },
  ]});
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 2: Features Overview
// ═══════════════════════════════════════════════════════════════════════════════
async function slide2_features(): Promise<Buffer> {
  let bg = await canvas(PALETTE.bg);

  const stripe = await gradientBanner(SIZE, 120);
  bg = await sharp(bg).composite([{ input: stripe, top: 0, left: 0 }]).png().toBuffer();

  const features = [
    { icon: iconCrop,    title: 'Crop + Resize',   desc: 'Absolute, ratio, aspect crop' },
    { icon: iconPalette, title: 'Adjust + Filter',  desc: 'Brightness, contrast, hue' },
    { icon: iconDrop,    title: 'Watermark',        desc: 'Text or image watermark' },
    { icon: iconLink,    title: 'Pipeline',          desc: 'Chain operations together' },
  ];

  const cardW = 420, cardH = 180, gap = 40;
  const startY = 180;
  const iconSize = 40;

  // Create feature cards and composite icons
  for (let i = 0; i < features.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * (cardW + gap);
    const y = startY + row * (cardH + gap);

    const card = await roundedRect(cardW, cardH, PALETTE.surface, 20);
    const icon = await features[i].icon(iconSize);
    bg = await sharp(bg).composite([
      { input: card, top: y, left: x },
      { input: icon, top: y + 25, left: x + 25 },
    ]).png().toBuffer();
  }

  // Text layers (no emoji)
  const textLayers = [
    { text: 'Key Features', x: SIZE / 2, y: 40, fontSize: 40, color: '#FFFFFF', anchor: 'top-center' as const },
  ];

  for (let i = 0; i < features.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * (cardW + gap);
    const y = startY + row * (cardH + gap);

    textLayers.push(
      { text: features[i].title, x: x + 80, y: y + 35, fontSize: 28, color: PALETTE.text, anchor: 'top-left' as const },
      { text: features[i].desc, x: x + 25, y: y + 110, fontSize: 22, color: PALETTE.muted, anchor: 'top-left' as const },
    );
  }

  textLayers.push(
    { text: '2 / 5', x: SIZE / 2, y: 980, fontSize: 20, color: PALETTE.muted, anchor: 'top-center' as const },
  );

  const res = await addText(bg, { layers: textLayers });
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 3: Code Example
// ═══════════════════════════════════════════════════════════════════════════════
async function slide3_code(): Promise<Buffer> {
  let bg = await canvas(PALETTE.bg);

  const codeCard = await roundedRect(920, 500, '#0D1117', 20);
  const termIcon = await iconTerminal(48);
  bg = await sharp(bg).composite([
    { input: codeCard, top: 250, left: 80 },
    { input: termIcon, top: 95, left: SIZE / 2 - 24 },
  ]).png().toBuffer();

  const codeLines = [
    'import resize, addText from',
    "  'image-edit-tools'",
    '',
    'const img = await resize(',
    "  'photo.jpg',",
    '  width: 1080, height: 1080',
    ')',
    '',
    'const card = await addText(',
    '  img.data,',
    "  layers: [text: 'Hello!']",
    ')',
  ];

  const codeLayers: Parameters<typeof addText>[1]['layers'] = [
    { text: 'Code Example', x: SIZE / 2, y: 160, fontSize: 40, color: PALETTE.text, anchor: 'top-center' },
    { text: 'Edit images in just a few lines', x: SIZE / 2, y: 215, fontSize: 24, color: PALETTE.muted, anchor: 'top-center' },
  ];

  codeLines.forEach((line, i) => {
    if (!line) return;
    let color = PALETTE.text;
    if (line.includes('import') || line.includes('const') || line.includes('await')) color = '#FF7B72';
    if (line.startsWith("  '") || line.includes("'")) color = '#A5D6FF';
    if (line.includes('width') || line.includes('height') || line.includes('layers')) color = '#FFA657';

    codeLayers.push({
      text: line, x: 120, y: 285 + i * 38,
      fontSize: 24, color, anchor: 'top-left',
    });
  });

  codeLayers.push(
    { text: '3 / 5', x: SIZE / 2, y: 980, fontSize: 20, color: PALETTE.muted, anchor: 'top-center' },
  );

  const res = await addText(bg, { layers: codeLayers });
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 4: MCP Integration
// ═══════════════════════════════════════════════════════════════════════════════
async function slide4_mcp(): Promise<Buffer> {
  let bg = await canvas(PALETTE.bg);

  const badge1 = await numberBadge(1);
  const badge2 = await numberBadge(2);
  const badge3 = await numberBadge(3);
  const stepCard = await roundedRect(820, 140, PALETTE.surface, 16);
  const botIcon = await iconBot(56);

  bg = await sharp(bg).composite([
    { input: stepCard, top: 280, left: 130 },
    { input: stepCard, top: 480, left: 130 },
    { input: stepCard, top: 680, left: 130 },
    { input: badge1, top: 310, left: 60 },
    { input: badge2, top: 510, left: 60 },
    { input: badge3, top: 710, left: 60 },
    { input: botIcon, top: 65, left: SIZE / 2 - 28 },
  ]).png().toBuffer();

  const res = await addText(bg, { layers: [
    { text: 'MCP Integration', x: SIZE / 2, y: 140, fontSize: 44, color: PALETTE.text, anchor: 'top-center' },
    { text: 'Use directly from AI agents', x: SIZE / 2, y: 200, fontSize: 26, color: PALETTE.muted, anchor: 'top-center' },

    { text: 'npm install', x: 170, y: 310, fontSize: 26, color: PALETTE.highlight, anchor: 'top-left' },
    { text: 'Install image-edit-tools', x: 170, y: 355, fontSize: 22, color: PALETTE.muted, anchor: 'top-left' },

    { text: 'Add MCP config', x: 170, y: 510, fontSize: 26, color: PALETTE.highlight, anchor: 'top-left' },
    { text: 'Edit claude_desktop_config.json', x: 170, y: 555, fontSize: 22, color: PALETTE.muted, anchor: 'top-left' },

    { text: 'Ask the AI', x: 170, y: 710, fontSize: 26, color: PALETTE.highlight, anchor: 'top-left' },
    { text: 'Crop this photo to 1080x1080', x: 170, y: 755, fontSize: 22, color: PALETTE.muted, anchor: 'top-left' },

    { text: '4 / 5', x: SIZE / 2, y: 980, fontSize: 20, color: PALETTE.muted, anchor: 'top-center' },
  ]});
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 5: Closing CTA
// ═══════════════════════════════════════════════════════════════════════════════
async function slide5_cta(): Promise<Buffer> {
  let bg = await canvas(PALETTE.bg);

  const bigCircle = await svgCircle(300, PALETTE.accent + '20');
  const ctaBtn = await roundedRect(500, 80, PALETTE.accent, 40);
  const star = await iconStar(80);

  bg = await sharp(bg).composite([
    { input: bigCircle, top: SIZE / 2 - 300, left: SIZE / 2 - 300 },
    { input: star, top: 220, left: SIZE / 2 - 40 },
    { input: ctaBtn, top: 650, left: SIZE / 2 - 250 },
  ]).png().toBuffer();

  const res = await addText(bg, { layers: [
    { text: 'Get Started', x: SIZE / 2, y: 380, fontSize: 48, color: PALETTE.text, anchor: 'top-center' },
    { text: 'npm install image-edit-tools', x: SIZE / 2, y: 480, fontSize: 30, color: PALETTE.highlight, anchor: 'top-center' },
    { text: 'Install Now', x: SIZE / 2, y: 670, fontSize: 28, color: '#FFFFFF', anchor: 'top-center' },
    { text: 'github.com/swimmingkiim/image-edit-tools', x: SIZE / 2, y: 820, fontSize: 22, color: PALETTE.muted, anchor: 'top-center' },
    { text: '5 / 5', x: SIZE / 2, y: 980, fontSize: 20, color: PALETTE.muted, anchor: 'top-center' },
  ]});
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('Generating Instagram card news slides...\n');

  const slides = [
    { name: 'slide-1-cover',    fn: slide1_cover },
    { name: 'slide-2-features', fn: slide2_features },
    { name: 'slide-3-code',     fn: slide3_code },
    { name: 'slide-4-mcp',      fn: slide4_mcp },
    { name: 'slide-5-cta',      fn: slide5_cta },
  ];

  for (const slide of slides) {
    const buf = await slide.fn();
    const outPath = join(OUTPUT_DIR, `${slide.name}.png`);
    writeFileSync(outPath, buf);
    console.log(`  OK ${slide.name}.png (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`\nDone! ${slides.length} slides saved to examples/output/`);
}

main().catch(console.error);
