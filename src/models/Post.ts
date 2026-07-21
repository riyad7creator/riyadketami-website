import mongoose, { Document, Model } from 'mongoose';
export { BLOG_CATEGORIES, BLOG_CATEGORY_VALUES, POST_LANGUAGES, POST_STATUSES } from '@/lib/constants';
import { BLOG_CATEGORY_VALUES, POST_LANGUAGES, POST_STATUSES } from '@/lib/constants';

export type BlogCategory = (typeof BLOG_CATEGORY_VALUES)[number];
export type PostLanguage = (typeof POST_LANGUAGES)[number];
export type PostStatus = (typeof POST_STATUSES)[number];

export interface IPost extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  category?: BlogCategory;
  tags: string[];
  status: PostStatus;
  language: PostLanguage;
  views: number;
  author: mongoose.Types.ObjectId;
  readTime?: number;
  translated_from?: mongoose.Types.ObjectId | null;
  translated_at?: Date | null;
  manually_edited?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: { type: String, maxlength: 300 },
    content: { type: String, required: true },
    featuredImage: { type: String },
    category: { type: String, enum: BLOG_CATEGORY_VALUES },
    tags: [{ type: String }],
    status: { type: String, enum: POST_STATUSES, default: 'draft' },
    language: { type: String, enum: POST_LANGUAGES, default: 'en', required: true },
    views: { type: Number, default: 0 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    readTime: { type: Number, default: 1 },
    translated_from: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    translated_at: { type: Date, default: null },
    manually_edited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound query-performance indexes
PostSchema.index({ language: 1, status: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ category: 1, language: 1 });
PostSchema.index({ translated_from: 1 }); // translation lookup
PostSchema.index({ slug: 1, language: 1, status: 1 }); // getBlogPost() lookup path
PostSchema.index({ status: 1, createdAt: -1 }); // admin listing filter

const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;
