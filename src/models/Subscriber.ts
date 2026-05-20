import mongoose, { Document, Model } from 'mongoose';

export interface ISubscriber extends Document {
  email: string;
  preferredLanguage?: 'ar' | 'en' | 'fr';
  unsubscribed: boolean;
  unsubscribedAt?: Date;
  source?: string;
  createdAt: Date;
}

const SOURCES = ['homepage', 'blog-cta', 'links-page', 'import', 'other'] as const;

const SubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    preferredLanguage: { type: String, enum: ['ar', 'en', 'fr'] },
    unsubscribed: { type: Boolean, default: false },
    unsubscribedAt: { type: Date },
    source: { type: String, enum: SOURCES },
  },
  { timestamps: true }
);

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
