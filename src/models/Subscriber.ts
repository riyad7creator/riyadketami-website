import mongoose, { Document, Model } from 'mongoose';

export interface ISubscriber extends Document {
  email: string;
  unsubscribed: boolean;
  unsubscribedAt?: Date;
  createdAt: Date;
}

const SubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    unsubscribed: { type: Boolean, default: false },
    unsubscribedAt: { type: Date },
  },
  { timestamps: true }
);

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
