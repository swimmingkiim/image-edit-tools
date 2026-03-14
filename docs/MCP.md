# MCP Tools Reference

This package exposes 17 Model Context Protocol (MCP) tools for AI agents.

## Exposed Tools

### image_crop
**Description**: Crops an image. Supports absolute coords, ratio, aspect ratio, or subject mode.
**Parameters**:
- `image` (string, required): Base64 data URI, HTTP URL, or local path
- `mode` (string): 'absolute' | 'ratio' | 'aspect' | 'subject'
- `x`, `y`, `width`, `height` (number)
- `left`, `top`, `right`, `bottom` (number)
- `aspectRatio` (string), `anchor` (string)

### image_resize
**Description**: Resizes an image. Specify width/height or a scale multiplier.
**Parameters**:
- `image` (string, required)
- `width`, `height`, `scale` (number)
- `fit` (string): 'cover' | 'contain' | 'fill' | 'inside' | 'outside'

### image_pad
**Description**: Pads an image edges. Supports absolute edges or square target size with custom color.
**Parameters**:
- `image` (string, required)
- `top`, `right`, `bottom`, `left` (number)
- `size` (number)
- `color` (string)

### image_adjust
**Description**: Adjusts brightness, contrast, saturation, hue, sharpness, and temperature (-100 to 100).
**Parameters**:
- `image` (string, required)
- `brightness`, `contrast`, `saturation`, `hue`, `sharpness`, `temperature` (number)

### image_filter
**Description**: Applies preset filters: grayscale, sepia, invert, vintage, unsharp, or blur with radius.
**Parameters**:
- `image` (string, required)
- `preset` (string, required): 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'unsharp' | 'blur'
- `radius` (number)

### image_blur_region
**Description**: Blurs specific absolute regions in the image.
**Parameters**:
- `image` (string, required)
- `regions` (array of objects)

### image_add_text
**Description**: Adds text layers. Requires x, y, text, font size, and optional alignment parameters.
**Parameters**:
- `image` (string, required)
- `layers` (array of objects)

### image_composite
**Description**: Composites images together with blend modes.
**Parameters**:
- `image` (string, required)
- `layers` (array of objects)

### image_watermark
**Description**: Applies watermarks either text or image at discrete positions or tiled.
**Parameters**:
- `image` (string, required)
- `type` (string, required): 'text' | 'image'
- `text`, `imageLayer`, `position`, `opacity`

### image_remove_bg
**Description**: Removes background using AI model RMBG-1.4. Optionally replaces with color or image.
**Parameters**:
- `image` (string, required)
- `replaceColor`, `replaceImage` (string)

### image_convert
**Description**: Converts image to jpeg, png, webp, avif, or gif.
**Parameters**:
- `image` (string, required)
- `format` (string, required)
- `quality` (number), `stripMetadata` (boolean)

### image_optimize
**Description**: Optimizes an image to fit max size in KB or max dimension.
**Parameters**:
- `image` (string, required)
- `maxSizeKB`, `maxDimension` (number), `autoFormat` (boolean)

### image_get_metadata
**Description**: Returns image metadata.
**Parameters**: `image` (string, required)

### image_get_dominant_colors
**Description**: Returns hex values of the primary colors.
**Parameters**: `image` (string, required), `count` (number)

### image_detect_faces
**Description**: Detects bounding boxes around faces.
**Parameters**: `image` (string, required)

### image_extract_text
**Description**: Runs OCR to extract text.
**Parameters**: `image` (string, required), `lang` (string)

### image_pipeline
**Description**: Runs a sequence of operations seamlessly.
**Parameters**: `image` (string, required), `operations` (array of objects)
