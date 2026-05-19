import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { requireAdmin, serverError, zodFail } from '@/lib/api-helpers';
import { translatePostContent } from '@/lib/translate';
import DOMPurify from 'isomorphic-dompurify';

type TargetLang = 'fr' | 'ar';

interface TranslationResult {
  id?: string;
  status: 'ok' | 'error' | 'skipped';
  error?: string;
  reason?: string;
}

const preTranslatedSchema = z.object({
  title: z.string().min(1).max(100),
  excerpt: z.string().max(300),
  content: z.string().min(1),
});

const translatePostSchema = z.object({
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid postId'),
  langs: z.array(z.enum(['fr', 'ar'])).optional(),
  lang: z.enum(['fr', 'ar']).optional(),
  data: preTranslatedSchema.optional(),
  /** Set true to overwrite a manually-edited translation */
  force: z.boolean().optional(),
});

/**
 * GET /api/admin/translate-post?postId=xxx
 *   — fetch existing translations for a single post
 *
 * GET /api/admin/translate-post?postIds=id1,id2,...
 *   — batch lookup: returns { [postId]: Translation[] }
 */
export async function GET(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    const postIds = searchParams.get('postIds');

    await dbConnect();

    // Batch mode — one DB query for all posts
    if (postIds) {
      const ids = postIds.split(',').filter(Boolean).slice(0, 100); // cap at 100
      const translations = await Post.find({ translated_from: { $in: ids } })
        .select('_id language translated_from')
        .lean();

      const map: Record<string, string[]> = {};
      for (const t of translations) {
        const fromId = String(t.translated_from);
        if (!map[fromId]) map[fromId] = [];
        map[fromId].push(t.language);
      }
      return NextResponse.json(map);
    }

    // Single mode (legacy)
    if (!postId) return NextResponse.json({ error: 'postId or postIds required' }, { status: 400 });

    const translations = await Post.find({ translated_from: postId })
      .select('_id title excerpt content language translated_at manually_edited updatedAt slug')
      .lean();

    return NextResponse.json(translations);
  } catch (error) {
    return serverError('Failed to fetch translations', error);
  }
}

/**
 * POST /api/admin/translate-post
 *
 * Option A — auto-translate via AI:
 *   { postId: string, langs: ('fr'|'ar')[] }
 *
 * Option B — save pre-translated data:
 *   { postId: string, lang: 'fr'|'ar', data: { title, excerpt, content } }
 */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();

    const parsed = translatePostSchema.safeParse(await req.json());
    if (!parsed.success) return zodFail(parsed.error);
    const { postId, langs, lang, data: preTranslated, force } = parsed.data;

    // Fetch the source EN post
    const sourcePost = await Post.findById(postId).lean();
    if (!sourcePost) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Determine which languages to process
    const targetLangs: TargetLang[] = langs ?? (lang ? [lang] : []);
    if (targetLangs.length === 0) {
      return NextResponse.json({ error: 'langs or lang required' }, { status: 400 });
    }

    const now = new Date();
    const results: Record<string, TranslationResult> = {};

    await Promise.all(
      targetLangs.map(async (targetLang) => {
        try {
          // Skip if a manually-edited translation already exists (unless force=true)
          const existing = await Post.findOne({
            translated_from: postId,
            language: targetLang,
          }).select('_id slug manually_edited').lean();

          if (existing?.manually_edited && !force) {
            results[targetLang] = {
              id: String(existing._id),
              status: 'skipped',
              reason: 'manually_edited',
            };
            return;
          }

          let translated: { title: string; excerpt: string; content: string };

          if (preTranslated) {
            translated = preTranslated;
          } else {
            translated = await translatePostContent({
              title: sourcePost.title,
              excerpt: sourcePost.excerpt ?? '',
              content: sourcePost.content,
              targetLang,
            });
          }

          const safeContent = DOMPurify.sanitize(translated.content);
          // Only set slug on first creation — preserves existing FR/AR URLs when EN slug is edited
          const slugFields = existing
            ? {}
            : { slug: `${sourcePost.slug}-${targetLang}` };

          const saved = await Post.findOneAndUpdate(
            { translated_from: postId, language: targetLang },
            {
              ...slugFields,
              title: translated.title,
              excerpt: translated.excerpt,
              content: safeContent,
              language: targetLang,
              status: 'published',
              category: sourcePost.category,
              tags: sourcePost.tags,
              featuredImage: sourcePost.featuredImage,
              readTime: sourcePost.readTime,
              translated_from: postId,
              translated_at: now,
              manually_edited: false,
              author: sourcePost.author,
            },
            { upsert: true, new: true, runValidators: true }
          );

          results[targetLang] = { id: String(saved._id), status: 'ok' };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          results[targetLang] = { status: 'error', error: msg };
        }
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    return serverError('Translation failed', error);
  }
}
