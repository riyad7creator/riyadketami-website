import mongoose, { Document, Model } from 'mongoose';

export const SOCIAL_PLATFORMS = [
  'tiktok',
  'instagram',
  'facebook',
  'youtube',
  'x',
  'linkedin',
  'github',
  'other',
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface ISocialAccount extends Document {
  platform: SocialPlatform;
  handle: string;
  url: string;
  follower_count: number;
  last_updated: Date;
  order: number;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SocialAccountSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: SOCIAL_PLATFORMS,
      required: true,
      unique: true,
    },
    handle: { type: String, required: true, maxlength: 100 },
    url: { type: String, required: true },
    follower_count: { type: Number, default: 0, min: 0 },
    last_updated: { type: Date, default: Date.now },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SocialAccount: Model<ISocialAccount> =
  mongoose.models.SocialAccount ||
  mongoose.model<ISocialAccount>('SocialAccount', SocialAccountSchema);

export default SocialAccount;
