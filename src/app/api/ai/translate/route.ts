import { requireAdmin, serverError } from '@/lib/api-helpers';
import { getOpenRouterKey, getModel, logUsage, OPENROUTER_URL } from '@/lib/ai-config';

const LANG_LABELS: Record<string, string> = {
  fr: 'French',
  ar: 'Arabic',
  en: 'English',
};

export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const apiKey = await getOpenRouterKey();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenRouter API key is not configured. Set it in Admin → Settings → AI.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json() as { content: string; targetLanguage: string; title?: string; excerpt?: string };
    const { content, targetLanguage, title, excerpt } = body;

    if (!content || !targetLanguage) {
      return new Response(JSON.stringify({ error: 'content and targetLanguage are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const langLabel = LANG_LABELS[targetLanguage] ?? targetLanguage;
    const model = await getModel('translation');

    const systemPrompt = `You are a professional translator specializing in blog content.
Translate the provided HTML blog post content into ${langLabel}.
Preserve all HTML tags exactly as they appear — only translate the text content between tags.
Keep all HTML attributes, classes, and structure unchanged.
Respond with a JSON object in this exact format:
{
  "title": "translated title",
  "excerpt": "translated excerpt",
  "content": "translated HTML content"
}`;

    const userMessage = `Translate this blog post to ${langLabel}:

Title: ${title ?? ''}
Excerpt: ${excerpt ?? ''}
Content:
${content}`;

    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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

    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(JSON.stringify({ error: `OpenRouter error: ${text}` }), {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await upstream.json() as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const raw = data.choices?.[0]?.message?.content ?? '{}';

    logUsage({
      model,
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      route: 'translate',
    });

    return new Response(raw, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return serverError('Translation failed', error);
  }
}
