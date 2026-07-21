import { requireAdmin, serverError } from '@/lib/api-helpers';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3.5-sonnet';

const LANG_LABELS: Record<string, string> = {
  fr: 'French',
  ar: 'Arabic',
  en: 'English',
};

export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY is not configured' }), {
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
        'HTTP-Referer': 'https://ketami.net',
        'X-Title': 'Riyad Ketami Admin',
      },
      body: JSON.stringify({
        model: MODEL,
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

    const data = await upstream.json() as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content ?? '{}';

    return new Response(raw, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return serverError('Translation failed', error);
  }
}
