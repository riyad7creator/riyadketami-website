import { NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { getAIKey, missingKeyMessage, getModel, checkBudget, aiJson } from '@/lib/ai-config';

type Lang = 'en' | 'fr' | 'ar';
const LANGS: Lang[] = ['en', 'fr', 'ar'];
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/** POST /api/admin/ai/newsletter-draft: draft a newsletter from recent posts */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const apiKey = await getAIKey();
    if (!apiKey) {
      return NextResponse.json({ error: await missingKeyMessage() }, { status: 500 });
    }
    const overBudget = await checkBudget();
    if (overBudget) return overBudget;

    const body = await readJson<{ postIds?: unknown; language?: string }>(req);
    const language: Lang = LANGS.includes(body?.language as Lang) ? (body.language as Lang) : 'en';
    const postIds = Array.isArray(body?.postIds)
      ? (body.postIds as unknown[]).filter((id): id is string => typeof id === 'string' && OBJECT_ID.test(id)).slice(0, 10)
      : [];

    await dbConnect();

    const posts = (postIds.length
      ? await Post.find({ _id: { $in: postIds } }).select('title excerpt slug language').lean()
      : await Post.find({ status: 'published', language })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('title excerpt slug language')
        .lean()) as Array<{ title: string; excerpt?: string; slug: string; language?: string }>;

    if (posts.length === 0) {
      return NextResponse.json({ error: 'No posts found to draft from.' }, { status: 400 });
    }

    const model = await getModel('agents');
    // Public URLs are locale-prefixed: /<lang>/blog/<slug>
    const postsContext = posts.map((p) =>
      `Title: ${p.title}\nExcerpt: ${p.excerpt ?? '(none)'}\nURL: https://ketami.net/${p.language ?? language}/blog/${p.slug}`
    ).join('\n\n');

    const langLabel = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English';

    const userMessage = `You are drafting a newsletter email for Riyad Ketami, a content creator in AI and business.

Based on these recent blog posts, write a compelling newsletter in ${langLabel}:

${postsContext}

Return a JSON object with these fields:
- "subject": email subject line (catchy, under 60 chars)
- "previewText": email preview text (under 90 chars)
- "htmlBody": HTML content using only <p>, <h2>, <ul>, <li>, <a>, <strong>, <em> tags. Include brief summaries of each post with links (use the URLs exactly as given). Close with a short personal note from Riyad. Max 400 words.`;

    const result = await aiJson<{ subject?: string; previewText?: string; htmlBody?: string }>({
      apiKey,
      model,
      route: 'newsletter-draft',
      messages: [{ role: 'user', content: userMessage }],
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const draft = {
      subject: String(result.data.subject ?? ''),
      previewText: String(result.data.previewText ?? ''),
      htmlBody: DOMPurify.sanitize(String(result.data.htmlBody ?? '')),
    };

    return NextResponse.json({ draft, postsUsed: posts.length });
  } catch (error) {
    return serverError('Newsletter draft failed', error);
  }
}
