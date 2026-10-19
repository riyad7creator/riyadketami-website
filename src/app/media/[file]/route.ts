import dbConnect from '@/lib/db/connect';
import MediaFileModel from '@/models/MediaFile';

/**
 * GET /media/<mediaId>.<ext>: serves an image from the media library as a real
 * file, so site images replaced in rk-studio (Content) get a short, cacheable,
 * site-relative URL instead of a base64 data URL inlined into every page.
 * The extension matters: next/image skips optimisation for ".svg", and the
 * middleware lets paths with an extension through untouched.
 */
const ID_RE = /^([a-f0-9]{24})(?:\.[a-z0-9]{2,5})?$/i;
const DATA_URL_RE = /^data:([^;,]+);base64,([\s\S]*)$/;

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const id = ID_RE.exec(file)?.[1];
  if (!id) return new Response('Not found', { status: 404 });

  try {
    await dbConnect();
    const doc = await MediaFileModel.findById(id).select('url mimeType').lean();
    if (!doc?.url) return new Response('Not found', { status: 404 });

    // Storage may later move to a CDN: then the stored URL is already a real file
    if (/^https:\/\//i.test(doc.url)) return Response.redirect(doc.url, 302);

    const [, rawType, base64] = DATA_URL_RE.exec(doc.url) ?? [];
    if (!rawType || !base64) return new Response('Not found', { status: 404 });
    const mimeType = rawType.toLowerCase();
    if (!mimeType.startsWith('image/')) return new Response('Not found', { status: 404 });

    const body = Buffer.from(base64, 'base64');
    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Content-Length': String(body.length),
      // An id never points at different bytes, so the file can be cached for good
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    };
    // An SVG opened directly must never run script on this origin
    if (mimeType === 'image/svg+xml') {
      headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
    }
    return new Response(new Uint8Array(body), { status: 200, headers });
  } catch {
    return new Response('Unavailable', { status: 503 });
  }
}
