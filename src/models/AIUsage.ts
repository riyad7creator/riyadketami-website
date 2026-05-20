import mongoose, { Document, Model } from 'mongoose';

export interface IAIUsage extends Document {
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  route: string;
  createdAt: Date;
}

const AIUsageSchema = new mongoose.Schema(
  {
    modelName: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    costUsd: { type: Number, default: 0 },
    route: { type: String, required: true },
  },
  { timestamps: true }
);

// TTL: auto-delete after 90 days
AIUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
AIUsageSchema.index({ createdAt: -1, modelName: 1 });

const AIUsage: Model<IAIUsage> =
  mongoose.models.AIUsage || mongoose.model<IAIUsage>('AIUsage', AIUsageSchema);

export default AIUsage;
