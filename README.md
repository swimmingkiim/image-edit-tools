# Image Edit Tools

A TypeScript-first, deterministic, purely functional image editing SDK designed for AI Agents (Cursor, Windsurf, Claude).

- **Pure Functions**: No side effects, no mutations, all strict structural typing.
- **Agent Native**: Includes a built-in Model Context Protocol (MCP) server so AI agents can use all operations natively!
- **Never Throws**: Every function returns `{ok, data}` or `{ok, false, error}`.
- **Versatile**: Crop, resize, pad, adjust colors, watermark, composite, AI background removal, OCR, face detection, and more.

## Installation
```bash
npm install image-edit-tools
```

> **Note**: AI features (`removeBg`, `detectFaces`, `detectSubject`) require `@xenova/transformers`, which is an optional dependency. All other 16+ operations work out of the box on any platform with just Node.js and sharp.

## Quick Start (Code)
```typescript
import { crop, resize, pad } from 'image-edit-tools';

const result = await resize('/path/to/img.jpg', { width: 800 });
if (!result.ok) {
    console.error(result.error);
    return;
}
// Returns a Buffer.
// Can be saved, piped, or passed explicitly!
```

## Running the MCP Server
If you are an AI assistant integrating this context provider natively:
```json
{
  "mcpServers": {
    "image-edit-tools": {
      "command": "npx",
      "args": ["-y", "image-edit-tools"]
    }
  }
}
```

Learn more about mapping AI behaviors in [AGENTS.md](./docs/AGENTS.md).
