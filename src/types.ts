// ─── Input ────────────────────────────────────────────────────────────────────

/**
 * Accepted image input formats.
 * - Buffer: raw image bytes
 * - string starting with 'http': fetched via HTTP
 * - string starting with 'data:': base64 data URI
 * - string (other): treated as filesystem path
 */
export type ImageInput = Buffer | string;

// ─── Result ───────────────────────────────────────────────────────────────────

export type Ok<T> = { ok: true; data: T; warnings?: string[] };
export type Err = { ok: false; error: string; code: ErrorCode };
export type Result<T> = Ok<T> | Err;
export type ImageResult = Result<Buffer>;

export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  OUT_OF_BOUNDS = 'OUT_OF_BOUNDS',
  FETCH_FAILED = 'FETCH_FAILED',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
}

// ─── Crop ─────────────────────────────────────────────────────────────────────

export type CropOptions =
  | { mode?: 'absolute'; x: number; y: number; width: number; height: number }
  | { mode: 'ratio'; left: number; top: number; right: number; bottom: number }
  | { mode: 'aspect'; aspectRatio: string; anchor?: 'center' | 'top' | 'bottom' | 'face' }
  | { mode: 'subject' };

// ─── Resize ───────────────────────────────────────────────────────────────────

export type ResizeFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
export type ResizeKernel = 'lanczos3' | 'nearest' | 'linear';

export interface ResizeOptions {
  width?: number;
  height?: number;
  scale?: number;
  fit?: ResizeFit;
  kernel?: ResizeKernel;
  /** Preserve aspect ratio when only one dimension is given. Default: true */
  withoutEnlargement?: boolean;
}

// ─── Pad ──────────────────────────────────────────────────────────────────────

export interface PadOptions {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  /** Square canvas shorthand: centers image and pads to this size */
  size?: number;
  /** CSS hex color or 'transparent'. Default: '#ffffff' */
  color?: string;
}

// ─── Adjust ───────────────────────────────────────────────────────────────────

export interface AdjustOptions {
  /** -100 to +100 */
  brightness?: number;
  /** -100 to +100 */
  contrast?: number;
  /** -100 to +100 */
  saturation?: number;
  /** 0 to 360 degrees */
  hue?: number;
  /** 0 to 100 */
  sharpness?: number;
  /** -100 (cool) to +100 (warm) */
  temperature?: number;
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export type FilterPreset = 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'unsharp';

export type FilterOptions =
  | { preset: Exclude<FilterPreset, 'blur'> }
  | { preset: 'blur'; radius: number };

// ─── BlurRegion ───────────────────────────────────────────────────────────────

export interface BlurRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Blur strength (sigma). Default: 10 */
  radius?: number;
}

// ─── AddText ──────────────────────────────────────────────────────────────────

export type TextAnchor =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface TextBackground {
  color: string;
  padding?: number;
  opacity?: number;
  borderRadius?: number;
}

export interface TextLayer {
  text: string;
  x: number;
  y: number;
  anchor?: TextAnchor;
  fontSize?: number;
  fontFamily?: string;
  /** Google Fonts URL or local file path */
  fontUrl?: string;
  color?: string;
  opacity?: number;
  align?: 'left' | 'center' | 'right';
  /** Wrap text at this pixel width */
  maxWidth?: number;
  lineHeight?: number;
  background?: TextBackground;
}

// ─── Composite ────────────────────────────────────────────────────────────────

export type BlendMode = 'over' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';

export interface CompositeLayer {
  image: ImageInput;
  x?: number;
  y?: number;
  blend?: BlendMode;
  opacity?: number;
}

// ─── Watermark ────────────────────────────────────────────────────────────────

export type WatermarkPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'tile';

export type WatermarkOptions =
  | {
      type: 'text';
      text: string;
      position?: WatermarkPosition;
      fontSize?: number;
      color?: string;
      opacity?: number;
      tileSpacing?: number;
    }
  | {
      type: 'image';
      image: ImageInput;
      position?: WatermarkPosition;
      opacity?: number;
      scale?: number;
      tileSpacing?: number;
    };

// ─── Overlay ──────────────────────────────────────────────────────────────────

export type Gravity =
  | 'NorthWest' | 'North' | 'NorthEast'
  | 'West' | 'Center' | 'East'
  | 'SouthWest' | 'South' | 'SouthEast';

export interface OverlayOptions {
  gravity?: Gravity;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  blend?: BlendMode;
}

// ─── RemoveBg ─────────────────────────────────────────────────────────────────

export type RemoveBgEngine = 'onnx' | 'webai';

export interface RemoveBgOptions {
  engine?: RemoveBgEngine;
  /** Replace transparency with this solid color instead */
  replaceColor?: string;
  /** Replace background with this image */
  replaceImage?: ImageInput;
}

// ─── DetectSubject ────────────────────────────────────────────────────────────

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

// ─── Convert ──────────────────────────────────────────────────────────────────

export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif';

export interface ConvertOptions {
  format: OutputFormat;
  /** 0–100. Default: 80 */
  quality?: number;
  /** PNG only. 0–9. Default: 6 */
  compressionLevel?: number;
  /** Strip all metadata. Default: true */
  stripMetadata?: boolean;
}

// ─── Optimize ─────────────────────────────────────────────────────────────────

export interface OptimizeOptions {
  /** Target file size in KB. Quality is adjusted automatically */
  maxSizeKB?: number;
  /** Resize so the longest dimension does not exceed this value */
  maxDimension?: number;
  /** Auto-select format (WebP if alpha, JPEG otherwise). Default: true */
  autoFormat?: boolean;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  fileSize: number;
  colorSpace?: string;
  hasAlpha: boolean;
  channels: number;
  density?: number;
  exif?: Record<string, unknown>;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export type PipelineOperation =
  | ({ op: 'crop' } & CropOptions)
  | ({ op: 'resize' } & ResizeOptions)
  | ({ op: 'pad' } & PadOptions)
  | ({ op: 'adjust' } & AdjustOptions)
  | ({ op: 'filter' } & FilterOptions)
  | ({ op: 'blurRegion'; regions: BlurRegion[] })
  | ({ op: 'addText'; layers: TextLayer[] })
  | ({ op: 'composite'; layers: CompositeLayer[] })
  | ({ op: 'watermark' } & WatermarkOptions)
  | ({ op: 'convert' } & ConvertOptions)
  | ({ op: 'optimize' } & OptimizeOptions)
  | ({ op: 'removeBg' } & RemoveBgOptions);

export interface BatchOptions {
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
}
