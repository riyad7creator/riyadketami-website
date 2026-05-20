/**
 * Client-side media storage service.
 *
 * All operations go through Next.js API routes at /api/admin/media.
 * Backed by MongoDB (MediaFile collection) — no Supabase required.
 */

import type { MediaFile, MediaFolder, MediaListParams, MediaListResult } from '@/types/media';

const BASE = '/api/admin/media';

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Upload an image blob/file to the media library.
 *
 * @param file     Blob (from processImage) or raw File
 * @param folder   Destination folder
 * @param options  Optional alt text, pre-measured dimensions
 * @returns        Saved MediaFile document
 */
export async function uploadMedia(
  file: Blob | File,
  folder: MediaFolder,
  options: { altText?: string; filename?: string; width?: number; height?: number } = {}
): Promise<MediaFile> {
  const name = options.filename ?? (file instanceof File ? file.name : `upload-${Date.now()}.webp`);

  const form = new FormData();
  form.append('file', file, name);
  form.append('folder', folder);
  if (options.altText) form.append('altText', options.altText);
  if (options.width != null) form.append('width', String(options.width));
  if (options.height != null) form.append('height', String(options.height));

  const res = await fetch(BASE, { method: 'POST', body: form });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error((payload as { error?: string }).error ?? 'Upload failed');
  }
  return res.json() as Promise<MediaFile>;
}

// ---------------------------------------------------------------------------
// List / search
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated list of media files, optionally filtered by folder.
 *
 * @example
 * const { files, total } = await getMediaFiles({ folder: 'blog', page: 1, limit: 24 });
 */
export async function getMediaFiles(params: MediaListParams = {}): Promise<MediaListResult> {
  const qs = new URLSearchParams();
  if (params.folder) qs.set('folder', params.folder);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);

  const res = await fetch(`${BASE}?${qs}`);
  if (!res.ok) throw new Error('Failed to fetch media files');
  return res.json() as Promise<MediaListResult>;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Update a media file's metadata (alt text, folder).
 */
export async function updateMedia(
  id: string,
  data: { altText?: string; folder?: MediaFolder }
): Promise<MediaFile> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: 'Update failed' }));
    throw new Error((payload as { error?: string }).error ?? 'Update failed');
  }
  return res.json() as Promise<MediaFile>;
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/** Remove a media file record from the database. */
export async function deleteMedia(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: 'Delete failed' }));
    throw new Error((payload as { error?: string }).error ?? 'Delete failed');
  }
}

// ---------------------------------------------------------------------------
// Mark usage
// ---------------------------------------------------------------------------

/**
 * Record that a post/link is using a media file.
 * Adds `referenceId` to the file's `usedIn` array if not already present.
 */
export async function markMediaUsed(id: string, referenceId: string): Promise<void> {
  await fetch(`${BASE}/${id}/used`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referenceId }),
  });
}
