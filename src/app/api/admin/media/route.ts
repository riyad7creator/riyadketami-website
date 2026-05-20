import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import MediaFileModel from '@/models/MediaFile';
import { requireAdmin, serverError, escapeRegex } from '@/lib/api-helpers';
import type { MediaFolder, MediaType } from '@/types/media';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;   // 4 MB for images
const MAX_BINARY_SIZE = 50 * 1024 * 1024; // 50 MB for video/Lottie

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
const LOTTIE_TYPE = 'application/json';

const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES, LOTTIE_TYPE];

function detectMediaType(mimeType: string): MediaType {
  if (VIDEO_TYPES.includes(mimeType)) return 'video';
  if (mimeType === LOTTIE_TYPE) return 'lottie';
  return 'image';
}

async function isLottieJson(buffer: Buffer): Promise<boolean> {
  try {
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 2048));
    const parsed = JSON.parse(text) as Record<string, unknown>;
    // Lottie files have a version field "v" and a "layers" array
    return typeof parsed.v !== 'undefined' && Array.isArray(parsed.layers);
  } catch {
    return false;
  }
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

    const isVideoOrJson = VIDEO_TYPES.includes(file.type) || file.type === LOTTIE_TYPE;
    const maxSize = isVideoOrJson ? MAX_BINARY_SIZE : MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${(maxSize / 1024 / 1024).toFixed(0)} MB.` },
        { status: 400 }
      );
    }

    const folder = (formData.get('folder') as MediaFolder | null) ?? 'uncategorized';
    const altText = (formData.get('altText') as string | null) ?? '';
    const width = formData.get('width') ? parseInt(formData.get('width') as string, 10) : undefined;
    const height = formData.get('height') ? parseInt(formData.get('height') as string, 10) : undefined;

    const buffer = Buffer.from(await file.arrayBuffer());

    // For application/json, verify it's actually a Lottie file
    if (file.type === LOTTIE_TYPE && !(await isLottieJson(buffer))) {
      return NextResponse.json({ error: 'JSON file does not appear to be a valid Lottie animation' }, { status: 400 });
    }

    const mediaType = detectMediaType(file.type);
    const url = `data:${file.type};base64,${buffer.toString('base64')}`;

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
      mimeType: file.type,
      sizeBytes: file.size,
      width,
      height,
      folder,
      altText,
      usedIn: [],
      mediaType,
    });

    return NextResponse.json(doc.toObject(), { status: 201 });
  } catch (error) {
    return serverError('Failed to upload media', error);
  }
}
