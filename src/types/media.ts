export type MediaFolder = 'blog' | 'hero' | 'links' | 'icons' | 'og' | 'uncategorized';

export interface MediaFile {
  _id: string;
  filename: string;
  originalName: string;
  /** base64 data URL (or CDN URL if storage is later upgraded) */
  url: string;
  /** logical path within the folder, e.g. "blog/1700000000000_hero.webp" */
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  folder: MediaFolder;
  altText: string;
  /** IDs of posts/links that reference this file */
  usedIn: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaUploadOptions {
  folder?: MediaFolder;
  altText?: string;
  width?: number;
  height?: number;
}

export interface MediaListParams {
  folder?: MediaFolder;
  page?: number;
  limit?: number;
  search?: string;
}

export interface MediaListResult {
  files: MediaFile[];
  total: number;
  page: number;
  totalPages: number;
}
