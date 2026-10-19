import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { getOpenRouterKey, getModel, checkBudget, openRouterJson } from '@/lib/ai-config';
import { BLOG_CATEGORY_VALUES } from '@/lib/constants';

interface PostIdea {
  title: string;
  hook: string;
  category: string;
}

const CATEGORIES = BLOG_CATEGORY_VALUES as readonly string[];

/** POST /api/admin/ai/post-ideas: suggest post ideas based on recent content */
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

    const body = await readJson<{ count?: number; language?: string }>(req);
    const count = Math.min(Math.max(1, Number(body?.count) || 5), 10);
    const language = (['en', 'fr', 'ar'].includes(String(body?.language)) ? body.language : 'en') as 'en' | 'fr' | 'ar';

    await dbConnect();

    const recentPosts = await Post.find({ status: 'published', language })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title category tags')
      .lean() as Array<{ title: string; category?: string; tags?: string[] }>;

    const model = await getModel('agents');
    const recentContext = recentPosts.map(p => `- ${p.title} (${p.category ?? 'general'})`).join('\n');

    const systemPrompt = `You are a content strategist for a personal brand website. Generate creative, specific blog post ideas. Respond with a JSON object only.`;
    const userMessage = `Generate ${count} fresh blog post ideas for a content creator specializing in AI, business strategy, and creator economy.

Recent posts (for context, avoid similar topics):
${recentContext || 'No recent posts.'}

Language: ${language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English'}

Respond with a JSON object: {"ideas": [{"title": "...", "hook": "one sentence teaser", "category": "${CATEGORIES.join('|')}"}]}`;

    const result = await openRouterJson<PostIdea[] | { ideas?: PostIdea[] }>({
      apiKey,
      model,
      route: 'post-ideas',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    const list = Array.isArray(result.data) ? result.data : (result.data.ideas ?? []);
    const ideas: PostIdea[] = list
      .filter((i) => i && typeof i.title === 'string' && i.title.trim())
      .slice(0, count)
      .map((i) => ({
        title: i.title.trim(),
        hook: typeof i.hook === 'string' ? i.hook.trim() : '',
        // Only categories the post editor accepts (BLOG_CATEGORIES)
        category: CATEGORIES.includes(String(i.category)) ? String(i.category) : 'ai',
      }));

    return NextResponse.json({ ideas });
  } catch (error) {
    return serverError('Post ideas generation failed', error);
  }
}
