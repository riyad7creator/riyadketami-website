import mongoose, { Document, Model } from 'mongoose';
import type { MediaFolder } from '@/types/media';

export interface IMediaFile extends Document {
  filename: string;
  originalName: string;
  url: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  folder: MediaFolder;
  altText: string;
  usedIn: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FOLDERS = ['blog', 'hero', 'links', 'icons', 'og', 'uncategorized'] as const;

const MediaFileSchema = new mongoose.Schema<IMediaFile>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    storagePath: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    width: { type: Number, min: 1 },
    height: { type: Number, min: 1 },
    folder: { type: String, enum: FOLDERS, default: 'uncategorized' },
    altText: { type: String, default: '' },
    usedIn: [{ type: String }],
  },
  { timestamps: true }
);

MediaFileSchema.index({ folder: 1, createdAt: -1 });
MediaFileSchema.index({ originalName: 'text', altText: 'text' });

const MediaFileModel: Model<IMediaFile> =
  mongoose.models.MediaFile || mongoose.model<IMediaFile>('MediaFile', MediaFileSchema);

export default MediaFileModel;
