import { describe, it, expect } from 'vitest';
import { resolveFontUrl } from '../../src/utils/font-loader.js';

describe('resolveFontUrl', () => {
  it('passes through file:// URLs unchanged', async () => {
    const result = await resolveFontUrl('file:///usr/share/fonts/truetype/noto/NotoSans.ttf');
    expect(result).toBe('file:///usr/share/fonts/truetype/noto/NotoSans.ttf');
  });

  it('converts absolute paths to file:// URLs', async () => {
    const result = await resolveFontUrl('/home/user/fonts/MyFont.ttf');
    expect(result).toMatch(/^file:\/\//);
    expect(result).toContain('MyFont.ttf');
    expect(result).toBe('file:///home/user/fonts/MyFont.ttf');
  });

  it('downloads and caches a direct woff2 URL', async () => {
    // Use a real small font file from Google's CDN
    const url = 'https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2';
    const result = await resolveFontUrl(url);
    expect(result).toMatch(/^file:\/\//);
    expect(result).toMatch(/\.woff2$/);
  }, { timeout: 15000 });

  it('returns cached file on second call (no re-download)', async () => {
    const url = 'https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2';
    const first = await resolveFontUrl(url);
    const second = await resolveFontUrl(url);
    // Both should return identical paths (cache hit)
    expect(second).toBe(first);
  }, { timeout: 15000 });

  it('resolves Google Fonts CSS URL to local file', async () => {
    const url = 'https://fonts.googleapis.com/css2?family=Inter&display=swap';
    const result = await resolveFontUrl(url);
    expect(result).toMatch(/^file:\/\//);
    expect(result).toMatch(/\.woff2$/);
  }, { timeout: 15000 });
});
