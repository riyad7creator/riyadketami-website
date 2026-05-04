import mongoose, { Document, Model } from 'mongoose';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  bio?: string;
  tagline?: string;
  role: UserRole;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isLocked: () => boolean;
  incLoginAttempts: () => Promise<mongoose.UpdateWriteOpResult>;
}

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, maxlength: 100, lowercase: true },
    password: { type: String, select: false },
    image: { type: String, default: '/portraits/portrait-clean.png' },
    bio: { type: String, maxlength: 500 },
    tagline: { type: String, maxlength: 100 },
    role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
    lastLoginAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.methods.incLoginAttempts = async function (): Promise<mongoose.UpdateWriteOpResult> {
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }

  const updates: Record<string, unknown> = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    Object.assign(updates, { $set: { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) } });
  }

  return this.updateOne(updates);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
