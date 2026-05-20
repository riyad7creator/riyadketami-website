import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import { getOpenRouterKey, getModel, logUsage, OPENROUTER_URL } from '@/lib/ai-config';

/** POST /api/admin/ai/newsletter-draft — draft a newsletter from recent posts */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const apiKey = await getOpenRouterKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter key not configured.' }, { status: 500 });
    }

    const body = await req.json() as { postIds?: string[]; language?: string };
    const language = (body.language ?? 'en') as 'en' | 'fr' | 'ar';

    await dbConnect();

    let posts;
    if (body.postIds?.length) {
      posts = await Post.find({ _id: { $in: body.postIds } }).select('title excerpt slug').lean();
    } else {
      posts = await Post.find({ status: 'published', language })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('title excerpt slug')
        .lean() as Array<{ title: string; excerpt?: string; slug: string }>;
    }

    if (posts.length === 0) {
      return NextResponse.json({ error: 'No posts found to draft from.' }, { status: 400 });
    }

    const model = await getModel('agents');
    const postsContext = posts.map((p: { title: string; excerpt?: string; slug: string }) =>
      `Title: ${p.title}\nExcerpt: ${p.excerpt ?? '(none)'}\nURL: https://riyadketami.com/blog/${p.slug}`
    ).join('\n\n');

    const langLabel = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English';

    const userMessage = `You are drafting a newsletter email for Riyad Ketami, a content creator in AI and business.

Based on these recent blog posts, write a compelling newsletter in ${langLabel}:

${postsContext}

Return a JSON object with these fields:
- "subject": email subject line (catchy, under 60 chars)
- "previewText": email preview text (under 90 chars)
- "htmlBody": HTML content using only <p>, <h2>, <ul>, <li>, <a>, <strong>, <em> tags. Include brief summaries of each post with links. Close with a short personal note from Riyad. Max 400 words.`;

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
      route: 'newsletter-draft',
    });

    let draft: { subject: string; previewText: string; htmlBody: string } = { subject: '', previewText: '', htmlBody: '' };
    try {
      draft = JSON.parse(raw) as typeof draft;
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ draft, postsUsed: posts.length });
  } catch (error) {
    return serverError('Newsletter draft failed', error);
  }
}
