import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import { getOpenRouterKey, getModel, logUsage, OPENROUTER_URL } from '@/lib/ai-config';

interface SEOResult {
  score: number;
  issues: string[];
  suggestions: string[];
  metaDescription?: string;
  suggestedTags?: string[];
}

/** POST /api/admin/ai/seo-doctor — analyze a post for SEO */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const apiKey = await getOpenRouterKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter key not configured.' }, { status: 500 });
    }

    const body = await req.json() as { postId: string };
    if (!body.postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    await dbConnect();
    const post = await Post.findById(body.postId).lean() as {
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

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://riyadketami.com',
        'X-Title': 'Riyad Ketami Admin',
      },
      body: JSON.stringify({
        model,
        stream: false,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `AI error: ${text}` }, { status: res.status });
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const raw = data.choices?.[0]?.message?.content ?? '{}';

    logUsage({
      model,
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      route: 'seo-doctor',
    });

    let result: SEOResult = { score: 0, issues: [], suggestions: [] };
    try {
      result = JSON.parse(raw) as SEOResult;
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ result, post: { title: post.title, slug: post.slug } });
  } catch (error) {
    return serverError('SEO analysis failed', error);
  }
}
