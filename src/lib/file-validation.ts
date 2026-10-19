import DOMPurify from 'isomorphic-dompurify';
import type { MediaFolder } from '@/types/media';

/** Folders the media library accepts (mirrors the MediaFile schema enum) */
export const MEDIA_FOLDERS: readonly MediaFolder[] = ['blog', 'hero', 'links', 'icons', 'og', 'uncategorized'];

export function isMediaFolder(v: unknown): v is MediaFolder {
  return typeof v === 'string' && (MEDIA_FOLDERS as readonly string[]).includes(v);
}

/** Validate file magic bytes to prevent MIME-type spoofing */
export function detectMimeType(buf: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
  // GIF: GIF87a or GIF89a
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  // WebP: RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp';
  // MP4 / MOV family: "ftyp" box at offset 4
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return 'video/mp4';
  // WebM / Matroska: 1A 45 DF A3
  if (buf[0] === 0x1A && buf[1] === 0x45 && buf[2] === 0xDF && buf[3] === 0xA3) return 'video/webm';

  // Text formats: skip a UTF-8 BOM and leading whitespace
  const head = buf.toString('utf8', 0, Math.min(buf.length, 2048)).replace(/^﻿/, '').trimStart();
  if (head.startsWith('<') && /<svg[\s>]/i.test(head)) return 'image/svg+xml';
  if (head.startsWith('{')) return 'application/json';
  return null;
}

/** Script, event handlers, foreignObject and javascript: URLs are refused outright */
const SVG_DANGER = /<script|<foreignObject|\son[a-z]+\s*=|javascript:|<!ENTITY/i;

/**
 * Check + sanitize an uploaded SVG. Returns the cleaned markup, or an error
 * when the file carries active content (it is then rejected, not silently fixed).
 */
export function sanitizeSvg(buf: Buffer): { ok: true; svg: string } | { ok: false; error: string } {
  const text = buf.toString('utf8');
  if (SVG_DANGER.test(text)) {
    return { ok: false, error: 'SVG contains scripts, event handlers or embedded HTML and was rejected.' };
  }
  const svg = DOMPurify.sanitize(text, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['foreignObject', 'script'],
  });
  if (!/<svg[\s>]/i.test(svg)) return { ok: false, error: 'Not a valid SVG file.' };
  return { ok: true, svg };
}
