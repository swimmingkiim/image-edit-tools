import { describe, it, expect } from 'vitest';
import { allTools, handleTool } from '../../src/mcp/tools.js';

describe('MCP Tools', () => {
  it('exports all expected tools', () => {
    const expected = [
      'image_crop', 'image_resize', 'image_pad', 'image_adjust', 'image_filter',
      'image_blur_region', 'image_add_text', 'image_composite', 'image_watermark',
      'image_remove_bg', 'image_convert', 'image_optimize', 'image_get_metadata',
      'image_get_dominant_colors', 'image_detect_faces', 'image_extract_text',
      'image_pipeline'
    ];
    const toolNames = allTools.map(t => t.name);
    for (const name of expected) {
      expect(toolNames).toContain(name);
    }
  });

  it('handleTool returns JSON string for get_metadata', async () => {
     // A minimal 1x1 transparent PNG data URI
     const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
     const image = `data:image/png;base64,${b64}`;
     
     const resJson = await handleTool('image_get_metadata', { image });
     const res = JSON.parse(resJson);
     
     expect(res.ok).toBe(true);
     expect(res.data.width).toBe(1);
     expect(res.data.height).toBe(1);
     expect(res.data.format).toBe('png');
  });

  it('handleTool formats image outputs as data URIs', async () => {
     const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
     const image = `data:image/png;base64,${b64}`;
     
     const resJson = await handleTool('image_resize', { image, width: 2, height: 2 });
     const res = JSON.parse(resJson);
     
     expect(res.ok).toBe(true);
     expect(res.data).toMatch(/^data:image\/[a-z]+;base64,/);
  });
});
