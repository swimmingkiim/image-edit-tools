import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { addText } from '../../src/ops/add-text.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixture = (name: string) => readFileSync(join(__dirname, '../fixtures', name));

describe('fontUrl integration', () => {
  let samplePng: Buffer;

  beforeAll(() => {
    samplePng = fixture('sample.png');
  });

  it('renders text with Google Fonts URL (Korean)', async () => {
    const result = await addText(samplePng, {
      layers: [{
        text: '한국어 테스트',
        x: 20, y: 50,
        fontSize: 32, color: '#000',
        fontFamily: 'Jua',
        fontUrl: 'https://fonts.googleapis.com/css2?family=Jua&display=swap',
        anchor: 'top-left',
      }]
    });
    expect(result.ok).toBe(true);
  }, { timeout: 30000 });

  it('renders text with direct woff2 font URL', async () => {
    const result = await addText(samplePng, {
      layers: [{
        text: 'Direct Font Test',
        x: 20, y: 50,
        fontSize: 28, color: '#333',
        fontFamily: 'Inter',
        fontUrl: 'https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2',
        anchor: 'top-left',
      }]
    });
    expect(result.ok).toBe(true);
  }, { timeout: 15000 });

  it('renders spans with Google Fonts URL', async () => {
    const result = await addText(samplePng, {
      layers: [{
        text: '',
        x: 20, y: 50,
        fontSize: 28, color: '#333',
        fontFamily: 'Jua',
        fontUrl: 'https://fonts.googleapis.com/css2?family=Jua&display=swap',
        spans: [
          { text: '캠핑장, 북스테이 등 ' },
          { text: '다양한 주제별 숙소 추천', bold: true, color: '#1A1A1A' },
        ]
      }]
    });
    expect(result.ok).toBe(true);
  }, { timeout: 30000 });
});
