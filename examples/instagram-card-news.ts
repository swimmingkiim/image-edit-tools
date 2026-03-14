/**
 * Instagram Card News Generator
 * 
 * Demonstrates: resize, pad, addText, composite, convert, pipeline
 * Output: 1080×1080 Instagram carousel slides (cover + 3 content slides + closing)
 * 
 * Usage:
 *   npx tsx examples/instagram-card-news.ts
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { addText } from '../src/ops/add-text.js';
import { composite } from '../src/ops/composite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, 'output');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Design Tokens ────────────────────────────────────────────────────────────
const SIZE = 1080;
const PALETTE = {
  bg:       '#0F172A', // slate-900
  accent:   '#3B82F6', // blue-500
  surface:  '#1E293B', // slate-800
  text:     '#F8FAFC', // slate-50
  muted:    '#94A3B8', // slate-400
  highlight:'#F59E0B', // amber-500
};

// ── Helper: create a solid-color 1080×1080 canvas ────────────────────────────
async function canvas(color: string): Promise<Buffer> {
  return sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: color }
  }).png().toBuffer();
}

// ── Helper: create a rounded rectangle shape ─────────────────────────────────
async function roundedRect(
  w: number, h: number, color: string, radius: number, opacity = 1
): Promise<Buffer> {
  const svg = `<svg width="${w}" height="${h}">
    <rect width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="${color}" opacity="${opacity}"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ── Helper: create a circle ──────────────────────────────────────────────────
async function circle(r: number, color: string): Promise<Buffer> {
  const d = r * 2;
  const svg = `<svg width="${d}" height="${d}">
    <circle cx="${r}" cy="${r}" r="${r}" fill="${color}"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ── Helper: create a gradient banner ─────────────────────────────────────────
async function gradientBanner(w: number, h: number): Promise<Buffer> {
  const svg = `<svg width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${PALETTE.accent}"/>
        <stop offset="100%" stop-color="#8B5CF6"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" rx="24" ry="24" fill="url(#g)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ── Helper: number badge ─────────────────────────────────────────────────────
async function numberBadge(num: number): Promise<Buffer> {
  const size = 80;
  const svg = `<svg width="${size}" height="${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${PALETTE.accent}"/>
    <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central"
          font-family="sans-serif" font-weight="bold" font-size="36" fill="white">${num}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 1: Cover
// ═══════════════════════════════════════════════════════════════════════════════
async function slide1_cover(): Promise<Buffer> {
  let bg = await canvas(PALETTE.bg);

  // Accent gradient bar at top
  const topBar = await gradientBanner(SIZE, 8);
  bg = await sharp(bg).composite([{ input: topBar, top: 0, left: 0 }]).png().toBuffer();

  // Decorative circles
  const circle1 = await circle(200, PALETTE.accent + '15');
  const circle2 = await circle(140, PALETTE.highlight + '10');
  bg = await sharp(bg).composite([
    { input: circle1, top: -60, left: -60 },
    { input: circle2, top: 800, left: 880 },
  ]).png().toBuffer();

  // Surface card
  const card = await roundedRect(900, 500, PALETTE.surface, 32, 0.9);
  bg = await sharp(bg).composite([{ input: card, top: 260, left: 90 }]).png().toBuffer();

  // Main title text
  const result = await addText(bg, { layers: [
    {
      text: '🚀',
      x: SIZE / 2, y: 180,
      fontSize: 80,
      color: PALETTE.text,
      anchor: 'top-center',
    },
    {
      text: 'Image Edit Tools',
      x: SIZE / 2, y: 340,
      fontSize: 56,
      color: PALETTE.text,
      anchor: 'top-center',
    },
    {
      text: 'AI 에이전트를 위한',
      x: SIZE / 2, y: 430,
      fontSize: 36,
      color: PALETTE.highlight,
      anchor: 'top-center',
    },
    {
      text: '이미지 편집 SDK',
      x: SIZE / 2, y: 480,
      fontSize: 36,
      color: PALETTE.highlight,
      anchor: 'top-center',
    },
    {
      text: 'TypeScript · Sharp · MCP',
      x: SIZE / 2, y: 580,
      fontSize: 28,
      color: PALETTE.muted,
      anchor: 'top-center',
    },
    {
      text: '← 스와이프하여 알아보기',
      x: SIZE / 2, y: 950,
      fontSize: 24,
      color: PALETTE.muted,
      anchor: 'top-center',
    },
  ]});
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 2: Features Overview
// ═══════════════════════════════════════════════════════════════════════════════
async function slide2_features(): Promise<Buffer> {
  let bg = await canvas(PALETTE.bg);

  // Header stripe
  const stripe = await gradientBanner(SIZE, 120);
  bg = await sharp(bg).composite([{ input: stripe, top: 0, left: 0 }]).png().toBuffer();

  // Feature cards
  const features = [
    { icon: 'A', title: 'Crop + Resize', desc: '절대/비율/종횡비 크롭' },
    { icon: 'B', title: 'Adjust + Filter', desc: '밝기, 대비, 채도, 온도' },
    { icon: 'C', title: 'Watermark', desc: '텍스트/이미지 워터마크' },
    { icon: 'D', title: 'Pipeline', desc: '체인 파이프라인 처리' },
  ];

  const cardW = 420, cardH = 180, gap = 40;
  const startY = 180;

  for (let i = 0; i < features.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * (cardW + gap);
    const y = startY + row * (cardH + gap);

    const card = await roundedRect(cardW, cardH, PALETTE.surface, 20);
    bg = await sharp(bg).composite([{ input: card, top: y, left: x }]).png().toBuffer();
  }

  // Add text for header and each feature
  const textLayers = [
    { text: '주요 기능', x: SIZE / 2, y: 50, fontSize: 40, color: '#FFFFFF', anchor: 'top-center' as const },
  ];

  for (let i = 0; i < features.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * (cardW + gap);
    const y = startY + row * (cardH + gap);

    textLayers.push(
      { text: features[i].icon, x: x + 30, y: y + 30, fontSize: 40, color: PALETTE.text, anchor: 'top-left' as const },
      { text: features[i].title, x: x + 90, y: y + 35, fontSize: 28, color: PALETTE.text, anchor: 'top-left' as const },
      { text: features[i].desc, x: x + 30, y: y + 100, fontSize: 22, color: PALETTE.muted, anchor: 'top-left' as const },
    );
  }

  // Bottom slide counter
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

  // Code block background
  const codeCard = await roundedRect(920, 500, '#0D1117', 20);
  bg = await sharp(bg).composite([{ input: codeCard, top: 250, left: 80 }]).png().toBuffer();

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

  const codeLayers = [
    {
      text: '💻 코드 예시',
      x: SIZE / 2, y: 100,
      fontSize: 44, color: PALETTE.text,
      anchor: 'top-center' as const,
    },
    {
      text: '단 몇 줄로 이미지 편집 완료',
      x: SIZE / 2, y: 170,
      fontSize: 26, color: PALETTE.muted,
      anchor: 'top-center' as const,
    },
  ];

  codeLines.forEach((line, i) => {
    if (!line) return;
    let color = PALETTE.text;
    if (line.includes('import') || line.includes('const') || line.includes('await')) color = '#FF7B72';
    if (line.startsWith("  '") || line.includes("'")) color = '#A5D6FF';
    if (line.includes('width') || line.includes('height') || line.includes('layers')) color = '#FFA657';

    codeLayers.push({
      text: line,
      x: 120,
      y: 285 + i * 38,
      fontSize: 24,
      color,
      anchor: 'top-left' as const,
    });
  });

  codeLayers.push({
    text: '3 / 5', x: SIZE / 2, y: 980,
    fontSize: 20, color: PALETTE.muted, anchor: 'top-center' as const,
  });

  const res = await addText(bg, { layers: codeLayers });
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 4: MCP Integration
// ═══════════════════════════════════════════════════════════════════════════════
async function slide4_mcp(): Promise<Buffer> {
  let bg = await canvas(PALETTE.bg);

  // Badges
  const badge1 = await numberBadge(1);
  const badge2 = await numberBadge(2);
  const badge3 = await numberBadge(3);

  // Step cards
  const stepCard = await roundedRect(820, 140, PALETTE.surface, 16);
  bg = await sharp(bg).composite([
    { input: stepCard, top: 280, left: 130 },
    { input: stepCard, top: 480, left: 130 },
    { input: stepCard, top: 680, left: 130 },
    { input: badge1, top: 310, left: 60 },
    { input: badge2, top: 510, left: 60 },
    { input: badge3, top: 710, left: 60 },
  ]).png().toBuffer();

  const res = await addText(bg, { layers: [
    { text: '🤖 MCP 연동', x: SIZE / 2, y: 80, fontSize: 44, color: PALETTE.text, anchor: 'top-center' as const },
    { text: 'AI 에이전트에서 바로 사용', x: SIZE / 2, y: 150, fontSize: 26, color: PALETTE.muted, anchor: 'top-center' as const },

    { text: 'npm install', x: 170, y: 310, fontSize: 26, color: PALETTE.highlight, anchor: 'top-left' as const },
    { text: 'image-edit-tools 설치', x: 170, y: 355, fontSize: 22, color: PALETTE.muted, anchor: 'top-left' as const },

    { text: 'MCP 설정 추가', x: 170, y: 510, fontSize: 26, color: PALETTE.highlight, anchor: 'top-left' as const },
    { text: 'claude_desktop_config.json 수정', x: 170, y: 555, fontSize: 22, color: PALETTE.muted, anchor: 'top-left' as const },

    { text: 'AI에게 요청', x: 170, y: 710, fontSize: 26, color: PALETTE.highlight, anchor: 'top-left' as const },
    { text: '이 사진 1080x1080으로 크롭해줘', x: 170, y: 755, fontSize: 22, color: PALETTE.muted, anchor: 'top-left' as const },

    { text: '4 / 5', x: SIZE / 2, y: 980, fontSize: 20, color: PALETTE.muted, anchor: 'top-center' as const },
  ]});
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 5: Closing CTA
// ═══════════════════════════════════════════════════════════════════════════════
async function slide5_cta(): Promise<Buffer> {
  let bg = await canvas(PALETTE.bg);

  // Large decorative gradient circle
  const bigCircle = await circle(300, PALETTE.accent + '20');
  bg = await sharp(bg).composite([
    { input: bigCircle, top: SIZE / 2 - 300, left: SIZE / 2 - 300 },
  ]).png().toBuffer();

  // CTA button shape
  const ctaBtn = await roundedRect(500, 80, PALETTE.accent, 40);
  bg = await sharp(bg).composite([
    { input: ctaBtn, top: 650, left: SIZE / 2 - 250 },
  ]).png().toBuffer();

  const res = await addText(bg, { layers: [
    { text: '⭐', x: SIZE / 2, y: 250, fontSize: 100, color: PALETTE.text, anchor: 'top-center' as const },
    { text: '지금 시작하세요', x: SIZE / 2, y: 400, fontSize: 48, color: PALETTE.text, anchor: 'top-center' as const },
    { text: 'npm install image-edit-tools', x: SIZE / 2, y: 500, fontSize: 30, color: PALETTE.highlight, anchor: 'top-center' as const },
    { text: '설치하기', x: SIZE / 2, y: 670, fontSize: 28, color: '#FFFFFF', anchor: 'top-center' as const },
    { text: 'github.com/swimmingkiim/image-edit-tools', x: SIZE / 2, y: 820, fontSize: 22, color: PALETTE.muted, anchor: 'top-center' as const },
    { text: '5 / 5', x: SIZE / 2, y: 980, fontSize: 20, color: PALETTE.muted, anchor: 'top-center' as const },
  ]});
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('📸 Generating Instagram card news slides...\n');

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
    console.log(`  ✅ ${slide.name}.png (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`\n🎉 Done! ${slides.length} slides saved to examples/output/`);
}

main().catch(console.error);
