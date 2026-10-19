import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { getOpenRouterKey, getModel, checkBudget, openRouterJson } from '@/lib/ai-config';

interface SEOResult {
  score: number;
  issues: string[];
  suggestions: string[];
  metaDescription?: string;
  suggestedTags?: string[];
}

/** POST /api/admin/ai/seo-doctor: analyze a post for SEO */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const apiKey = await getOpenRouterKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter key not configured.' }, { status: 500 });
    }

    const overBudget = await checkBudget();
    if (overBudget) return overBudget;

    const body = await readJson<{ postId?: unknown }>(req);
    const postId = typeof body?.postId === 'string' ? body.postId.trim() : '';
    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }
    if (!/^[0-9a-fA-F]{24}$/.test(postId)) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await dbConnect();
    const post = await Post.findById(postId).lean() as {
      title: string;
      excerpt?: string;
      content: string;
      slug: string;
      tags?: string[];
      category?: string;
      language: string;
    } | null;

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const model = await getModel('seo');

    // Strip HTML tags for word count
    const textContent = post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(' ').length;

    const userMessage = `You are an SEO expert. Analyze this blog post and return a JSON object.

Title: ${post.title}
Slug: ${post.slug}
Excerpt: ${post.excerpt ?? '(none)'}
Tags: ${post.tags?.join(', ') ?? '(none)'}
Category: ${post.category ?? '(none)'}
Word count: ~${wordCount}
Content preview (first 1000 chars): ${textContent.slice(0, 1000)}

Return JSON with:
{
  "score": 0-100,
  "issues": ["list of SEO problems found"],
  "suggestions": ["list of actionable improvements"],
  "metaDescription": "suggested meta description under 160 chars",
  "suggestedTags": ["up to 5 relevant tags"]
}`;

    const ai = await openRouterJson<Partial<SEOResult>>({
      apiKey,
      model,
      route: 'seo-doctor',
      messages: [{ role: 'user', content: userMessage }],
    });
    if (!ai.ok) return NextResponse.json({ error: ai.error }, { status: ai.status });

    const result: SEOResult = {
      score: Math.max(0, Math.min(100, Number(ai.data.score) || 0)),
      issues: Array.isArray(ai.data.issues) ? ai.data.issues.map(String) : [],
      suggestions: Array.isArray(ai.data.suggestions) ? ai.data.suggestions.map(String) : [],
      metaDescription: typeof ai.data.metaDescription === 'string' ? ai.data.metaDescription : undefined,
      suggestedTags: Array.isArray(ai.data.suggestedTags) ? ai.data.suggestedTags.map(String).slice(0, 5) : undefined,
    };

    return NextResponse.json({ result, post: { title: post.title, slug: post.slug } });
  } catch (error) {
    return serverError('SEO analysis failed', error);
  }
}
