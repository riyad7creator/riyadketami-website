import mongoose, { Document, Model } from 'mongoose';

export type AnalyticsEventType = 'view' | 'click';

export interface IAnalyticsEvent extends Document {
  type: AnalyticsEventType;
  postId?: string;
  referrer?: string;
  path: string;
  lang?: string;
  createdAt: Date;
}

const AnalyticsEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ['view', 'click'] },
    postId: { type: String },
    referrer: { type: String },
    path: { type: String, required: true },
    lang: { type: String },
  },
  { timestamps: true }
);

// TTL: auto-delete after 90 days
AnalyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
AnalyticsEventSchema.index({ postId: 1, createdAt: -1 });
AnalyticsEventSchema.index({ type: 1, createdAt: -1 });

const AnalyticsEvent: Model<IAnalyticsEvent> =
  mongoose.models.AnalyticsEvent ||
  mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);

export default AnalyticsEvent;
