import { z } from 'zod';
import { BLOG_CATEGORY_VALUES, POST_STATUSES, POST_LANGUAGES } from '@/models/Post';
import { SOCIAL_PLATFORMS } from '@/models/SocialAccount';
import { USER_ROLES } from '@/models/User';

export const contactFormSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  subject: z.string().min(5).max(100),
  message: z.string().min(10).max(1000),
  budget: z.string().optional(),
});

export const postSchema = z.object({
  title: z.string().min(3).max(100),
  slug: z.string().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  content: z.string().min(10),
  excerpt: z.string().max(300).optional().or(z.literal('')),
  category: z.enum(BLOG_CATEGORY_VALUES).optional(),
  status: z.enum(POST_STATUSES).optional(),
  language: z.enum(POST_LANGUAGES).optional(),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().optional().or(z.literal('')),
  readTime: z.number().optional(),
});

export const linkSchema = z.object({
  title: z.string().min(1).max(50),
  url: z.string().url(),
  icon: z.string().min(1),
  isVisible: z.boolean().optional(),
  order: z.number().optional(),
  description: z.string().max(100).optional(),
});

export const socialAccountSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  handle: z.string().min(1).max(100),
  url: z.string().url(),
  follower_count: z.number().min(0).optional(),
  order: z.number().optional(),
  visible: z.boolean().optional(),
});

export const teamMemberSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  password: z.string().min(8),
});
