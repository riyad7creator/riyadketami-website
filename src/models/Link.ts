import mongoose, { Document, Model } from 'mongoose';

export interface ILink extends Document {
  title: string;
  url: string;
  icon?: string;
  /** URL of a custom icon image (overrides the lucide icon name) */
  icon_url?: string;
  description?: string;
  order: number;
  isVisible: boolean;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 60 },
    url: { type: String, required: true },
    icon: { type: String, default: 'link' },
    icon_url: { type: String, default: null },
    description: { type: String, maxlength: 100 },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Link: Model<ILink> = mongoose.models.Link || mongoose.model<ILink>('Link', LinkSchema);

export default Link;
