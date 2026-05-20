import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import { getOpenRouterKey, getModel, logUsage, OPENROUTER_URL } from '@/lib/ai-config';

interface PostIdea {
  title: string;
  hook: string;
  category: string;
}

/** POST /api/admin/ai/post-ideas — suggest 5 post ideas based on recent content */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const apiKey = await getOpenRouterKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter key not configured.' }, { status: 500 });
    }

    const body = await req.json() as { count?: number; language?: string };
    const count = Math.min(body.count ?? 5, 10);
    const language = (body.language ?? 'en') as 'en' | 'fr' | 'ar';

    await dbConnect();

    const recentPosts = await Post.find({ status: 'published', language })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title category tags')
      .lean() as Array<{ title: string; category?: string; tags?: string[] }>;

    const model = await getModel('agents');
    const recentContext = recentPosts.map(p => `- ${p.title} (${p.category ?? 'general'})`).join('\n');

    const systemPrompt = `You are a content strategist for a personal brand website. Generate creative, specific blog post ideas. Respond with a JSON array only.`;
    const userMessage = `Generate ${count} fresh blog post ideas for a content creator specializing in AI, business strategy, and creator economy.

Recent posts (for context, avoid similar topics):
${recentContext || 'No recent posts.'}

Language: ${language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English'}

Respond with a JSON array of objects: [{"title": "...", "hook": "one sentence teaser", "category": "technology|business|ai|creator|productivity"}]`;

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
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
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
    const raw = data.choices?.[0]?.message?.content ?? '[]';

    logUsage({
      model,
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      route: 'post-ideas',
    });

    let ideas: PostIdea[] = [];
    try {
      const parsed = JSON.parse(raw) as PostIdea[] | { ideas?: PostIdea[] };
      ideas = Array.isArray(parsed) ? parsed : (parsed.ideas ?? []);
    } catch {
      ideas = [];
    }

    return NextResponse.json({ ideas });
  } catch (error) {
    return serverError('Post ideas generation failed', error);
  }
}
