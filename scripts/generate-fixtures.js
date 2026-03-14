import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixDir = path.join(__dirname, '../tests/fixtures');

fs.mkdirSync(fixDir, { recursive: true });

async function run() {
  await sharp({ create: { width: 400, height: 300, channels: 3, background: { r: 255, g: 0, b: 0 } } })
    .jpeg()
    .toFile(path.join(fixDir, 'sample.jpg'));
    
  await sharp({ create: { width: 400, height: 300, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 0.5 } } })
    .png()
    .toFile(path.join(fixDir, 'sample.png'));
    
  await sharp({ create: { width: 400, height: 300, channels: 3, background: { r: 0, g: 0, b: 255 } } })
    .webp()
    .toFile(path.join(fixDir, 'sample.webp'));
    
  await sharp({ create: { width: 100, height: 100, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: Buffer.from('<svg><circle cx="50" cy="50" r="40" fill="red" /></svg>'), left: 0, top: 0 }])
    .png()
    .toFile(path.join(fixDir, 'logo.png'));

  console.log('Fixtures generated successfully.');
}

run().catch(console.error);
