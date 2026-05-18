/**
 * Browser-side image resize / crop / compress utility.
 * All operations run on an HTMLCanvasElement — no server round-trip.
 */

export interface ProcessImageOptions {
  /** Max output width in px (default 2048) */
  maxWidth?: number;
  /** Max output height in px (default 2048) */
  maxHeight?: number;
  /** JPEG/WebP quality 0–1 (default 0.85) */
  quality?: number;
  /** Output format (default 'webp') */
  format?: 'jpeg' | 'webp' | 'png';
  /**
   * 'contain' — fit within bounds, preserve aspect ratio, no crop.
   * 'cover'   — fill bounds exactly, crop excess from center.
   */
  fit?: 'contain' | 'cover';
}

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  /** Convenience data URL for <img> previews */
  dataUrl: string;
  mimeType: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

interface Dims {
  width: number;
  height: number;
  /** Source crop x (for cover mode) */
  sx: number;
  /** Source crop y (for cover mode) */
  sy: number;
  /** Source crop width */
  sw: number;
  /** Source crop height */
  sh: number;
}

function calcDimensions(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number,
  fit: 'contain' | 'cover'
): Dims {
  if (fit === 'contain') {
    const scale = Math.min(maxW / srcW, maxH / srcH, 1);
    return { width: Math.round(srcW * scale), height: Math.round(srcH * scale), sx: 0, sy: 0, sw: srcW, sh: srcH };
  }

  // cover: compute crop region that matches maxW×maxH aspect in source space
  const dstAspect = maxW / maxH;
  const srcAspect = srcW / srcH;
  let sw: number, sh: number, sx: number, sy: number;
  if (srcAspect > dstAspect) {
    sh = srcH;
    sw = Math.round(srcH * dstAspect);
    sx = Math.round((srcW - sw) / 2);
    sy = 0;
  } else {
    sw = srcW;
    sh = Math.round(srcW / dstAspect);
    sx = 0;
    sy = Math.round((srcH - sh) / 2);
  }
  return { width: maxW, height: maxH, sx, sy, sw, sh };
}

/**
 * Multi-pass downscaling: halve dimensions iteratively until within 1.5× of
 * target. This prevents the aliasing artifacts of a single large downscale.
 */
async function multiPassDownscale(
  source: HTMLCanvasElement | HTMLImageElement,
  targetW: number,
  targetH: number
): Promise<HTMLCanvasElement> {
  let cur = document.createElement('canvas');
  const srcW = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const srcH = 'naturalHeight' in source ? source.naturalHeight : source.height;
  cur.width = srcW;
  cur.height = srcH;
  cur.getContext('2d')!.drawImage(source, 0, 0);

  let curW = srcW;
  let curH = srcH;

  while (curW > targetW * 1.5 || curH > targetH * 1.5) {
    const nextW = Math.max(Math.round(curW * 0.5), targetW);
    const nextH = Math.max(Math.round(curH * 0.5), targetH);
    const next = document.createElement('canvas');
    next.width = nextW;
    next.height = nextH;
    const ctx = next.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, 0, 0, nextW, nextH);
    cur = next;
    curW = nextW;
    curH = nextH;
  }

  // Final precise step
  const out = document.createElement('canvas');
  out.width = targetW;
  out.height = targetH;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cur, 0, 0, targetW, targetH);
  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get natural pixel dimensions of an image File without processing it. */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      reject(new Error('Failed to read image dimensions'));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * Resize, optionally crop, and compress an image file entirely in the browser.
 *
 * @example
 * const result = await processImage(file, { maxWidth: 1200, quality: 0.85 });
 * const formData = new FormData();
 * formData.append('file', result.blob, 'image.webp');
 */
export async function processImage(
  file: File,
  options: ProcessImageOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
    format = 'webp',
    fit = 'contain',
  } = options;

  const mimeType = `image/${format}`;

  // SVGs and GIFs pass through unchanged (canvas mangles them)
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    const dataUrl = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(file);
    });
    return { blob: file, width: 0, height: 0, sizeBytes: file.size, dataUrl, mimeType: file.type };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const { width: srcW, height: srcH } = img;

    const { width, height, sx, sy, sw, sh } = calcDimensions(srcW, srcH, maxWidth, maxHeight, fit);

    // Build the (possibly cropped) source canvas
    let srcCanvas = document.createElement('canvas');
    srcCanvas.width = sw;
    srcCanvas.height = sh;
    srcCanvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    // If we needed to crop, reload into an image so multiPassDownscale can read dimensions
    let downscaleSource: HTMLCanvasElement | HTMLImageElement = srcCanvas;
    if (sx !== 0 || sy !== 0 || sw !== srcW || sh !== srcH) {
      downscaleSource = await loadImage(srcCanvas.toDataURL());
    }

    const finalCanvas = await multiPassDownscale(downscaleSource, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      finalCanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas.toBlob returned null'))),
        mimeType,
        quality
      );
    });

    const dataUrl = finalCanvas.toDataURL(mimeType, quality);
    return { blob, width, height, sizeBytes: blob.size, dataUrl, mimeType };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// ---------------------------------------------------------------------------
// Preset helpers
// ---------------------------------------------------------------------------

/** Blog post hero image — 1200×630, WebP, cover crop */
export const processBlogImage = (file: File) =>
  processImage(file, { maxWidth: 1200, maxHeight: 630, quality: 0.88, format: 'webp', fit: 'cover' });

/** Link icon — 128×128 square thumbnail, WebP, cover crop */
export const processLinkIcon = (file: File) =>
  processImage(file, { maxWidth: 128, maxHeight: 128, quality: 0.9, format: 'webp', fit: 'cover' });

/** OG / social share image — 1200×630, JPEG */
export const processOgImage = (file: File) =>
  processImage(file, { maxWidth: 1200, maxHeight: 630, quality: 0.9, format: 'jpeg', fit: 'cover' });

/** Hero portrait — 800×800, WebP, contain */
export const processHeroImage = (file: File) =>
  processImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.9, format: 'webp', fit: 'contain' });
