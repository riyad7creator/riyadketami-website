import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import MediaFileModel from '@/models/MediaFile';
import { requireAdmin, serverError, escapeRegex } from '@/lib/api-helpers';
import type { MediaFolder } from '@/types/media';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB — BSON doc limit safety margin
// SVG intentionally excluded — arbitrary <script> inside an SVG stored as a
// data: URL is a stored-XSS vector, and nothing on this site currently uses SVG uploads.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Validate file magic bytes so a renamed/relabeled file can't spoof its declared MIME type */
function detectMimeType(buf: Buffer): string | null {
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp';
  return null;
}

/** GET /api/admin/media — paginated list OR ?stats=true for aggregated counts */
export async function GET(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const { searchParams } = new URL(req.url);

    // Stats aggregation mode
    if (searchParams.get('stats') === 'true') {
      const [byFolderRaw, totalRaw] = await Promise.all([
        MediaFileModel.aggregate<{ _id: string; count: number; sizeBytes: number }>([
          { $group: { _id: '$folder', count: { $sum: 1 }, sizeBytes: { $sum: '$sizeBytes' } } },
        ]),
        MediaFileModel.aggregate<{ totalFiles: number; totalSizeBytes: number }>([
          { $group: { _id: null, totalFiles: { $sum: 1 }, totalSizeBytes: { $sum: '$sizeBytes' } } },
        ]),
      ]);

      const byFolder: Record<string, { count: number; sizeBytes: number }> = {};
      for (const row of byFolderRaw) {
        byFolder[row._id] = { count: row.count, sizeBytes: row.sizeBytes };
      }

      const { totalFiles = 0, totalSizeBytes = 0 } = totalRaw[0] ?? {};
      return NextResponse.json({ totalFiles, totalSizeBytes, byFolder });
    }

    // Normal paginated list
    const folder = searchParams.get('folder') as MediaFolder | null;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
    const search = searchParams.get('search')?.trim();

    const query: Record<string, unknown> = {};
    if (folder) query.folder = folder;
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { originalName: { $regex: safeSearch, $options: 'i' } },
        { altText: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const [files, total] = await Promise.all([
      MediaFileModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      MediaFileModel.countDocuments(query),
    ]);

    return NextResponse.json({ files, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return serverError('Failed to fetch media files', error);
  }
}

/** POST /api/admin/media — upload file + record metadata in DB */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 4 MB.` },
        { status: 400 }
      );
    }

    const folder = (formData.get('folder') as MediaFolder | null) ?? 'uncategorized';
    const altText = (formData.get('altText') as string | null) ?? '';
    const width = formData.get('width') ? parseInt(formData.get('width') as string, 10) : undefined;
    const height = formData.get('height') ? parseInt(formData.get('height') as string, 10) : undefined;

    const buffer = Buffer.from(await file.arrayBuffer());

    const detectedType = detectMimeType(buffer);
    if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
      return NextResponse.json({ error: 'File content does not match its declared type.' }, { status: 400 });
    }

    const url = `data:${detectedType};base64,${buffer.toString('base64')}`;

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    const storagePath = `${folder}/${timestamp}_${safeName}`;
    const filename = `${timestamp}_${safeName}`;

    await dbConnect();

    const doc = await MediaFileModel.create({
      filename,
      originalName: file.name,
      url,
      storagePath,
      mimeType: detectedType,
      sizeBytes: file.size,
      width,
      height,
      folder,
      altText,
      usedIn: [],
    });

    return NextResponse.json(doc.toObject(), { status: 201 });
  } catch (error) {
    return serverError('Failed to upload media', error);
  }
}
