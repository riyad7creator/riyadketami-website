import mongoose, { Document, Model } from 'mongoose';

export const LATEST_SOURCE_TYPES = ['youtube', 'blog', 'tiktok', 'instagram'] as const;
export type LatestSourceType = (typeof LATEST_SOURCE_TYPES)[number];

export interface ILatestSource extends Document {
  type: LatestSourceType;
  label: string;
  rssUrl?: string;
  manualUrl?: string;
  manualTitle?: string;
  manualThumb?: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const LatestSourceSchema = new mongoose.Schema<ILatestSource>(
  {
    type: { type: String, enum: LATEST_SOURCE_TYPES, required: true },
    label: { type: String, required: true, maxlength: 50 },
    rssUrl: { type: String },
    manualUrl: { type: String },
    manualTitle: { type: String, maxlength: 200 },
    manualThumb: { type: String },
    active: { type: Boolean, default: true },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

LatestSourceSchema.index({ order: 1 });

const LatestSourceModel: Model<ILatestSource> =
  (mongoose.models.LatestSource as Model<ILatestSource>) ||
  mongoose.model<ILatestSource>('LatestSource', LatestSourceSchema);

export default LatestSourceModel;
