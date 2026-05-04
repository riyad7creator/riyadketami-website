import mongoose, { Document, Model } from 'mongoose';

export const BLOG_CATEGORIES = [
  { value: 'business', label: 'Business' },
  { value: 'digital-marketing', label: 'Digital Marketing' },
  { value: 'ai', label: 'AI' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'creativity', label: 'Creativity' },
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]['value'];
export const BLOG_CATEGORY_VALUES = BLOG_CATEGORIES.map((c) => c.value) as [BlogCategory, ...BlogCategory[]];

export const POST_LANGUAGES = ['en', 'fr', 'ar'] as const;
export type PostLanguage = (typeof POST_LANGUAGES)[number];

export const POST_STATUSES = ['draft', 'published'] as const;
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
  },
  { timestamps: true }
);

const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;
