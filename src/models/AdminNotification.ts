import mongoose, { Document, Model } from 'mongoose';

export const NOTIFICATION_TYPES = ['subscriber_new', 'contact_new', 'send_failure', 'storage_warning', 'newsletter_draft'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface IAdminNotification extends Document {
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const AdminNotificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: NOTIFICATION_TYPES },
    title: { type: String, required: true, maxlength: 120 },
    // Long enough for a full contact message (form max 1000 chars + sender line)
    body: { type: String, required: true, maxlength: 1500 },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL: auto-delete after 30 days
AdminNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });
AdminNotificationSchema.index({ read: 1, createdAt: -1 });

const AdminNotification: Model<IAdminNotification> =
  mongoose.models.AdminNotification ||
  mongoose.model<IAdminNotification>('AdminNotification', AdminNotificationSchema);

export default AdminNotification;
