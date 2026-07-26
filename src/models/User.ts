import mongoose, { Document, Model } from 'mongoose';
export { USER_ROLES } from '@/lib/constants';
import { USER_ROLES } from '@/lib/constants';

export type UserRole = (typeof USER_ROLES)[number];

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

const stripPassword = (_doc: unknown, ret: Record<string, unknown>) => {
  delete ret['password'];
  return ret;
};

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, maxlength: 100, lowercase: true },
    password: { type: String, select: false },
    // portrait-hero.png is the only portrait that exists on disk — the old
    // portrait-clean.png default 404'd for every user without an uploaded image
    image: { type: String, default: '/portraits/portrait-hero.png' },
    bio: { type: String, maxlength: 500 },
    tagline: { type: String, maxlength: 100 },
    role: { type: String, enum: USER_ROLES, default: 'viewer' },
    lastLoginAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { transform: stripPassword },
    toObject: { transform: stripPassword },
  }
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
