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
    // Default avatar: brand kit A01 (the old portrait-clean.png default 404'd)
    image: { type: String, default: '/brand/profile-picture_800.v5.jpg' },
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

/**
 * Records a failed login for visibility only. The account is never locked from
 * unauthenticated traffic (that let anyone lock the admin out); brute force is
 * throttled per email + IP in auth.ts instead. lockUntil stays in the schema but
 * is no longer set; a successful login clears any old value.
 */
UserSchema.methods.incLoginAttempts = async function (): Promise<mongoose.UpdateWriteOpResult> {
  return this.updateOne({ $inc: { loginAttempts: 1 } });
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
