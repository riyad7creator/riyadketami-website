import mongoose, { Document, Model } from 'mongoose';

/** Delivery ids of processed webhooks, so a retried delivery is applied once */
export interface IWebhookEvent extends Document {
  id: string;
  type: string;
  createdAt: Date;
}

const WebhookEventSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    type: { type: String, maxlength: 60 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

WebhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 14 * 24 * 3600 });

const WebhookEvent: Model<IWebhookEvent> =
  mongoose.models.WebhookEvent || mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);

export default WebhookEvent;
