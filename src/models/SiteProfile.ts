import mongoose, { Document, Model } from 'mongoose';

export interface ISocialEntry {
  url: string;
  count: string;
  channelId?: string; // YouTube only
}

export interface ISiteProfile extends Omit<Document, '_id'> {
  _id: string;
  name: string;
  tagline: string;
  statusLine?: string;
  statusEnabled: boolean;
  subscriberCount: number;
  socials: {
    tiktok?: ISocialEntry;
    youtube?: ISocialEntry;
    instagram?: ISocialEntry;
  };
  updatedAt: Date;
}

const SocialEntrySchema = new mongoose.Schema<ISocialEntry>(
  {
    url: { type: String, required: true },
    count: { type: String, required: true },
    channelId: { type: String },
  },
  { _id: false }
);

const SiteProfileSchema = new mongoose.Schema<ISiteProfile>(
  {
    _id: { type: String },
    name: { type: String, required: true, maxlength: 100 },
    tagline: { type: String, required: true, maxlength: 200 },
    statusLine: { type: String, maxlength: 200 },
    statusEnabled: { type: Boolean, default: false },
    subscriberCount: { type: Number, default: 5000, min: 0 },
    socials: {
      tiktok: { type: SocialEntrySchema },
      youtube: { type: SocialEntrySchema },
      instagram: { type: SocialEntrySchema },
    },
  },
  { timestamps: true, _id: false }
);

const SiteProfileModel: Model<ISiteProfile> =
  (mongoose.models.SiteProfile as Model<ISiteProfile>) ||
  mongoose.model<ISiteProfile>('SiteProfile', SiteProfileSchema);

export default SiteProfileModel;
