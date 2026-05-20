import mongoose, { Document, Model } from 'mongoose';

export interface ICampaign extends Document {
  subject: string;
  previewText?: string;
  sentAt?: Date;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  createdAt: Date;
}

const CampaignSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, maxlength: 200 },
    previewText: { type: String, maxlength: 200 },
    sentAt: { type: Date },
    recipientCount: { type: Number, default: 0 },
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CampaignSchema.index({ createdAt: -1 });

const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
