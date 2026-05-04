import mongoose, { Document, Model } from 'mongoose';

export interface ILink extends Document {
  title: string;
  url: string;
  icon?: string;
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
    description: { type: String, maxlength: 100 },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Link: Model<ILink> = mongoose.models.Link || mongoose.model<ILink>('Link', LinkSchema);

export default Link;
