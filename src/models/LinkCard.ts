import mongoose, { Document, Model } from 'mongoose';

export const LINK_CARD_SECTIONS = ['sponsored', 'resource', 'service', 'fallback'] as const;
export const PILL_VARIANTS = ['sponsored', 'new', 'free', 'booking', 'affiliate', 'custom'] as const;

export type LinkCardSection = (typeof LINK_CARD_SECTIONS)[number];
export type PillVariant = (typeof PILL_VARIANTS)[number];

export interface ILinkCard extends Document {
  section: LinkCardSection;
  title: string;
  description?: string;
  href: string;
  icon?: string;
  thumbnail?: string;
  pillLabel?: string;
  pillVariant?: PillVariant;
  pillColor?: string;
  order: number;
  active: boolean;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LinkCardSchema = new mongoose.Schema<ILinkCard>(
  {
    section: { type: String, enum: LINK_CARD_SECTIONS, required: true },
    title: { type: String, required: true, minlength: 1, maxlength: 80 },
    description: { type: String, maxlength: 200 },
    href: { type: String, required: true },
    icon: { type: String },
    thumbnail: { type: String },
    pillLabel: { type: String, maxlength: 20 },
    pillVariant: { type: String, enum: PILL_VARIANTS },
    pillColor: { type: String },
    order: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { timestamps: true }
);

LinkCardSchema.index({ section: 1, order: 1 });
LinkCardSchema.index({ section: 1, active: 1 });

const LinkCardModel: Model<ILinkCard> =
  (mongoose.models.LinkCard as Model<ILinkCard>) ||
  mongoose.model<ILinkCard>('LinkCard', LinkCardSchema);

export default LinkCardModel;
