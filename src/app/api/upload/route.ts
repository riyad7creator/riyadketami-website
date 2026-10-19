import { NextResponse } from 'next/server';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import { detectMimeType, sanitizeSvg } from '@/lib/file-validation';

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const formData = await req.formData().catch(() => null);
    const file = formData?.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 4MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate magic bytes — reject if content doesn't match claimed type
    const detectedType = detectMimeType(buffer);
    if (!detectedType || !ALLOWED_TYPES.includes(detectedType) || detectedType !== file.type) {
      return NextResponse.json({ error: 'File content does not match its declared type.' }, { status: 400 });
    }

    let data = buffer;
    if (detectedType === 'image/svg+xml') {
      const clean = sanitizeSvg(buffer);
      if (!clean.ok) return NextResponse.json({ error: clean.error }, { status: 400 });
      data = Buffer.from(clean.svg, 'utf8');
    }

    // Use detected MIME type (not client-supplied) to build the data URL
    const url = `data:${detectedType};base64,${data.toString('base64')}`;

    return NextResponse.json({ success: true, url });
  } catch (error) {
    return serverError('Failed to upload file', error);
  }
}
