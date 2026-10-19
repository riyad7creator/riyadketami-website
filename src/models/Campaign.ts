import mongoose, { Document, Model } from 'mongoose';

export const CAMPAIGN_LANGS = ['en', 'fr', 'ar'] as const;
export type CampaignLang = (typeof CAMPAIGN_LANGS)[number];
export const CAMPAIGN_STATUSES = ['draft', 'scheduled', 'sending', 'sent', 'failed'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export interface ICampaignEdition {
  lang: CampaignLang;
  subject: string;
  previewText?: string;
  bodyHtml: string;
  resendBroadcastId?: string;
  recipientCount?: number;
  status?: 'pending' | 'sent' | 'failed' | 'skipped';
  error?: string;
  /** Copy of the English edition sent to a language without its own edition */
  fallback?: boolean;
}

export interface ICampaign extends Document {
  /** Listing title (the English subject, or the first edition's) */
  subject: string;
  previewText?: string;
  status?: CampaignStatus;
  editions: ICampaignEdition[];
  /** Segments without their own edition receive the English one */
  fallbackToEnglish?: boolean;
  /** Shown in the public archive at /<lang>/newsletter/<slug> */
  isPublic?: boolean;
  slug?: string;
  origin?: 'manual' | 'digest';
  scheduledAt?: Date;
  sentAt?: Date;
  recipientCount: number;
  deliveredCount?: number;
  openCount: number;
  uniqueOpenCount?: number;
  clickCount: number;
  uniqueClickCount?: number;
  bounceCount?: number;
  complaintCount?: number;
  failedCount: number;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EditionSchema = new mongoose.Schema(
  {
    lang: { type: String, enum: CAMPAIGN_LANGS, required: true },
    subject: { type: String, maxlength: 200, default: '' },
    previewText: { type: String, maxlength: 200 },
    bodyHtml: { type: String, maxlength: 200_000, default: '' },
    resendBroadcastId: { type: String },
    recipientCount: { type: Number },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'skipped'] },
    error: { type: String, maxlength: 500 },
    fallback: { type: Boolean },
  },
  { _id: false }
);

const CampaignSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, maxlength: 200 },
    previewText: { type: String, maxlength: 200 },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: 'draft' },
    editions: { type: [EditionSchema], default: [] },
    fallbackToEnglish: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
    slug: { type: String, lowercase: true, trim: true, maxlength: 120 },
    origin: { type: String, enum: ['manual', 'digest'], default: 'manual' },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    recipientCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    openCount: { type: Number, default: 0 },
    uniqueOpenCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    uniqueClickCount: { type: Number, default: 0 },
    bounceCount: { type: Number, default: 0 },
    complaintCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    /** Client-generated per send attempt; a second send with the same key is refused */
    idempotencyKey: { type: String, maxlength: 100 },
  },
  { timestamps: true }
);

CampaignSchema.index({ createdAt: -1 });
CampaignSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
CampaignSchema.index({ slug: 1 }, { unique: true, sparse: true });
CampaignSchema.index({ 'editions.resendBroadcastId': 1 }, { sparse: true });
CampaignSchema.index({ status: 1, sentAt: -1 });

const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
