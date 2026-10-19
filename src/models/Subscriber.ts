import mongoose, { Document, Model } from 'mongoose';

export const SUBSCRIBER_SOURCES = ['homepage', 'blog-cta', 'links-page', 'subscribe-page', 'archive', 'import', 'other'] as const;
export type SubscriberSource = (typeof SUBSCRIBER_SOURCES)[number];
export const UNSUBSCRIBE_REASONS = ['user', 'bounce', 'complaint', 'suppressed', 'inactive', 'admin'] as const;
export type UnsubscribeReason = (typeof UNSUBSCRIBE_REASONS)[number];

export interface ISubscriber extends Document {
  email: string;
  preferredLanguage?: 'ar' | 'en' | 'fr';
  /** false while waiting for the double opt-in click; absent on legacy rows (treated as confirmed) */
  confirmed?: boolean;
  confirmedAt?: Date;
  confirmSentAt?: Date;
  consent?: {
    at: Date;
    ip?: string;
    userAgent?: string;
    form?: string;
    textVersion?: string;
    language?: string;
  };
  unsubscribed: boolean;
  unsubscribedAt?: Date;
  unsubscribeReason?: UnsubscribeReason;
  source?: SubscriberSource;
  utm?: { source?: string; medium?: string; campaign?: string };
  /** Welcome series: number of emails already sent (0 to 3) and when the next one is due */
  welcomeStep?: number;
  welcomeNextAt?: Date;
  lastClickAt?: Date;
  winbackSentAt?: Date;
  /** Last successful sync of this row to Resend contacts */
  resendSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    preferredLanguage: { type: String, enum: ['ar', 'en', 'fr'] },
    confirmed: { type: Boolean },
    confirmedAt: { type: Date },
    confirmSentAt: { type: Date },
    consent: {
      at: { type: Date },
      ip: { type: String, maxlength: 64 },
      userAgent: { type: String, maxlength: 300 },
      form: { type: String, maxlength: 40 },
      textVersion: { type: String, maxlength: 20 },
      language: { type: String, maxlength: 5 },
    },
    unsubscribed: { type: Boolean, default: false },
    unsubscribedAt: { type: Date },
    unsubscribeReason: { type: String, enum: UNSUBSCRIBE_REASONS },
    source: { type: String, enum: SUBSCRIBER_SOURCES },
    utm: {
      source: { type: String, maxlength: 80 },
      medium: { type: String, maxlength: 80 },
      campaign: { type: String, maxlength: 120 },
    },
    welcomeStep: { type: Number, min: 0, max: 3 },
    welcomeNextAt: { type: Date },
    lastClickAt: { type: Date },
    winbackSentAt: { type: Date },
    resendSyncedAt: { type: Date },
  },
  { timestamps: true }
);

SubscriberSchema.index({ unsubscribed: 1, confirmed: 1, preferredLanguage: 1 });
SubscriberSchema.index({ welcomeNextAt: 1 }, { sparse: true });
SubscriberSchema.index({ createdAt: -1 });

/** Mongo filter for people who should receive the newsletter */
export const ACTIVE_FILTER = { unsubscribed: { $ne: true }, confirmed: { $ne: false } } as const;
/** Waiting for the confirmation click */
export const PENDING_FILTER = { confirmed: false } as const;

export type SubscriberStatus = 'active' | 'pending' | 'unsubscribed';
export function subscriberStatus(s: { confirmed?: boolean; unsubscribed?: boolean }): SubscriberStatus {
  if (s.confirmed === false) return 'pending';
  if (s.unsubscribed) return 'unsubscribed';
  return 'active';
}

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
