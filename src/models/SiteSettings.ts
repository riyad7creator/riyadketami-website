import mongoose, { Document, Model } from 'mongoose';

export interface ISiteSettings extends Document {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  updatedAt: Date;
}

const SiteSettingsSchema = new mongoose.Schema<ISiteSettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const doc = await SiteSettings.findOne({ key }).lean();
  return doc ? (doc.value as T) : null;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await SiteSettings.findOneAndUpdate(
    { key },
    { key, value },
    { upsert: true, new: true }
  );
}

export default SiteSettings;
