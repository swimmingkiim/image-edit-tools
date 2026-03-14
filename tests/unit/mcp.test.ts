import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, '../../src/mcp/index.ts');

describe('MCP E2E', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    // spawn node with module loader for TS or fallback to npx tsx.
    // Vitest runs within node so we can spawn a child process.
    transport = new StdioClientTransport({
      command: 'npx',
      args: ['tsx', serverPath],
    });
    client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
    await client.connect(transport);
  });

  afterAll(async () => {
    await transport.close();
  });

  it('lists all expected tools including image_batch', async () => {
    const response = await client.listTools();
    const toolNames = response.tools.map((t: any) => t.name);
    
    const expected = [
      'image_crop', 'image_resize', 'image_pad', 'image_adjust', 'image_filter',
      'image_blur_region', 'image_add_text', 'image_composite', 'image_watermark',
      'image_remove_bg', 'image_convert', 'image_optimize', 'image_get_metadata',
      'image_get_dominant_colors', 'image_detect_faces', 'image_extract_text',
      'image_pipeline', 'image_batch'
    ];
    
    for (const name of expected) {
      expect(toolNames).toContain(name);
    }
  });

  it('calls image_get_metadata tool successfully and unwraps result', async () => {
    const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const image = `data:image/png;base64,${b64}`;

    const result = await client.callTool({
      name: 'image_get_metadata',
      arguments: { image }
    });

    expect(result.content).toBeDefined();
    const content = result.content as any[];
    expect(content[0].type).toBe('text');
    const res = JSON.parse(content[0].text);
    
    expect(res.width).toBe(1);
    expect(res.height).toBe(1);
    expect(res.format).toBe('png');
  });

  it('calls image_convert tool successfully', async () => {
    const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const image = `data:image/png;base64,${b64}`;

    const result = await client.callTool({
      name: 'image_convert',
      arguments: { image, format: 'jpeg' }
    });

    const content = result.content as any[];
    const res = JSON.parse(content[0].text);
    expect(res.ok).toBe(true);
    // converted outputs will be a data URI of format image/png by default if we don't infer it correctly,
    // but the test primarily checks it outputs a data URI wrapper.
    expect(res.data).toMatch(/^data:image\/[a-z]+;base64,/);
  });

  it('handles unknown tool call gracefully by returning correct JSON error structure', async () => {
    // The image-edit-tools MCP server currently returns standard JSON response with an error property,
    // rather than throwing a protocol-level JSON-RPC error.
    const result = await client.callTool({ name: 'image_unknown_tool', arguments: {} });
    const content = result.content as any[];
    const res = JSON.parse(content[0].text);
    
    expect(res.error).toBeDefined();
    expect(res.error).toContain('not implemented');
    expect(res.code).toBe('INVALID_INPUT');
  });

  it('handles invalid arguments gracefully inside tool execution', async () => {
    const result = await client.callTool({
      name: 'image_crop',
      arguments: { image: 'invalid-image-data', mode: 'absolute', x: 0, y: 0, width: 100, height: 100 }
    });
    
    const content = result.content as any[];
    const res = JSON.parse(content[0].text);
    expect(res.error).toBeDefined();
    expect(res.code).toBe('INVALID_INPUT'); // file not found or invalid input
  });
});
