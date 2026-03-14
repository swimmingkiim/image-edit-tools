import { createHash } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, access } from 'fs/promises';
import fetch from 'node-fetch';

const CACHE_DIR = tmpdir();
const CACHE_PREFIX = 'iet-font-';

/**
 * Generates a deterministic cache file path for a given URL.
 * Uses SHA-256 hash truncated to 16 hex chars to avoid filename collisions.
 *
 * @param url - The font binary URL to hash
 * @returns Absolute path without extension in the OS temp directory
 */
function cacheKey(url: string): string {
  return join(
    CACHE_DIR,
    CACHE_PREFIX + createHash('sha256').update(url).digest('hex').slice(0, 16),
  );
}

/**
 * Extracts the file extension from a URL, stripping query parameters.
 *
 * @param url - URL to extract extension from
 * @returns File extension (e.g. 'woff2', 'ttf') or 'woff2' as default
 */
function extractExtension(url: string): string {
  const lastSegment = url.split('/').pop() ?? '';
  const withoutQuery = lastSegment.split('?')[0];
  const ext = withoutQuery.split('.').pop() ?? 'woff2';
  return ext;
}

/**
 * Resolves a fontUrl to a local `file://` path usable by librsvg.
 *
 * Handles three cases:
 * - `file://` or absolute path → returned as `file://` URI
 * - `https://fonts.googleapis.com/css*` → fetches CSS, extracts font URL, downloads binary
 * - Direct binary URL (`.woff`, `.woff2`, `.ttf`, `.otf`) → downloads and caches
 *
 * Cache is stored in `os.tmpdir()` with prefix `iet-font-`. No TTL (font files are immutable).
 *
 * @param fontUrl - The font URL to resolve
 * @returns A `file://` URI pointing to a local font file
 * @throws {Error} If network fetch fails or CSS contains no font URLs
 *
 * @example
 * // Google Fonts CSS URL
 * const path = await resolveFontUrl('https://fonts.googleapis.com/css2?family=Jua');
 * // → 'file:///tmp/iet-font-abcdef1234567890.woff2'
 *
 * @example
 * // Direct font binary URL
 * const path = await resolveFontUrl('https://example.com/font.woff2');
 * // → 'file:///tmp/iet-font-0123456789abcdef.woff2'
 */
export async function resolveFontUrl(fontUrl: string): Promise<string> {
  // Already a local path — pass through
  if (fontUrl.startsWith('file://')) {
    return fontUrl;
  }
  if (fontUrl.startsWith('/')) {
    return `file://${fontUrl}`;
  }

  // Determine the actual binary URL to download
  let binaryUrl = fontUrl;

  if (fontUrl.includes('fonts.googleapis.com/css')) {
    // Google Fonts CSS endpoint — fetch CSS and extract the font binary URL
    const cssRes = await fetch(fontUrl, {
      headers: {
        // Desktop UA ensures we get woff2 (most compact modern format)
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!cssRes.ok) {
      throw new Error(`Google Fonts CSS fetch failed: ${cssRes.status}`);
    }

    const css = await cssRes.text();

    // Extract all url() references pointing to font binary files
    const urls = [...css.matchAll(/url\((https[^)]+\.(?:woff2?|ttf|otf)[^)]*)\)/g)].map(
      (m) => m[1],
    );

    if (urls.length === 0) {
      throw new Error('No font URL found in Google Fonts CSS');
    }

    // Prefer woff2 for smaller file size, fallback to first match
    binaryUrl = urls.find((u) => u.endsWith('.woff2')) ?? urls[0];
  }

  // Check cache before downloading
  const ext = extractExtension(binaryUrl);
  const cacheFile = `${cacheKey(binaryUrl)}.${ext}`;

  try {
    await access(cacheFile);
    // Cache hit
    return `file://${cacheFile}`;
  } catch {
    // Cache miss — download the binary
    const res = await fetch(binaryUrl);
    if (!res.ok) {
      throw new Error(`Font download failed: ${res.status} ${binaryUrl}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(cacheFile, buf);
    return `file://${cacheFile}`;
  }
}
