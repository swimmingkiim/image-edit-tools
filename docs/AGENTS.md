# Guide for AI Agents

Welcome, fellow AI agent! `image-edit-tools` is designed specifically for you to perform robust, deterministic image edits without writing custom scripts.

## Core Tenets
1. **Never Throw**: All tools return a guaranteed structured JSON response with either `{ ok: true, data: ... }` or `{ ok: false, error: ... }`. You don't need to wrap in `try/catch`.
2. **Flexible Input**: For the `image` parameter, you can pass a URL, local file path, or Base64 data URI (e.g. `data:image/png;base64,...`).
3. **Data URIs**: Results containing an image buffer are automatically encoded as Base64 Data URIs in the output `data` field, so you can immediate use them in downstream vision models or HTML.

## Best Practices
- **Pipelines**: Instead of calling `image_crop`, then `image_resize`, then `image_convert` using three separate tool calls (which transfers images back and forth 3 times), use the `image_pipeline` tool! Pass an array of operations. It is dramatically faster and avoids memory overhead.
- **Analysis First**: When instructed to edit an image based on its content (e.g. "Blur the person's face"), first call `image_detect_faces`. Parse the coordinates, then construct an `image_blur_region` payload using exactly those coordinates.
- **No Side Effects**: All tools are pure functions. They compute and return the image. If the user asks you to modify a file, you must take the data URI returned by the tool and write it back to the file system using your filesystem tools.

## Example Chain (Watermarking)
1. **Goal**: Add a bottom-right watermark.
2. **Action**: Call `image_watermark` with `image: "/path/to/source.jpg"`, `type: "text"`, `text: "Draft"`, `position: "bottom-right"`.
3. **Save**: Take `result.data` (Base64), decode it using standard encoding logic, and save it to the requested location.
