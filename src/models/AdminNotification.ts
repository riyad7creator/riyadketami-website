import mongoose, { Document, Model } from 'mongoose';

export type NotificationType = 'subscriber_new' | 'contact_new' | 'send_failure' | 'storage_warning';

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
    type: { type: String, required: true, enum: ['subscriber_new', 'contact_new', 'send_failure', 'storage_warning'] },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 400 },
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
