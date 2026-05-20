import mongoose, { Document, Model } from 'mongoose';

export interface ICampaignEvent extends Document {
  campaignId: string;
  type: 'open' | 'click';
  emailHash: string;
  url?: string;
  createdAt: Date;
}

const CampaignEventSchema = new mongoose.Schema(
  {
    campaignId: { type: String, required: true },
    type: { type: String, required: true, enum: ['open', 'click'] },
    emailHash: { type: String, required: true },
    url: { type: String },
  },
  { timestamps: true }
);

// TTL: 90 days
CampaignEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
CampaignEventSchema.index({ campaignId: 1, type: 1 });

const CampaignEvent: Model<ICampaignEvent> =
  mongoose.models.CampaignEvent ||
  mongoose.model<ICampaignEvent>('CampaignEvent', CampaignEventSchema);

export default CampaignEvent;
