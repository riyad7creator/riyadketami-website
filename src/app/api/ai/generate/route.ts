import { requireAdmin, serverError } from '@/lib/api-helpers';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3.5-sonnet';

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

    const body = await req.json() as { title?: string; prompt?: string; language?: string };
    const { title, prompt, language = 'en' } = body;

    const systemPrompt = `You are an expert content writer. Write a high-quality, engaging blog post in ${language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English'}.
Format the output as clean HTML using only: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <code>, <pre>.
Do NOT include <html>, <body>, <head>, or any wrapper tags.
Write in a clear, authoritative, and practical style. Aim for 600-1000 words.`;

    const userMessage = prompt
      ? `Write a blog post about: ${prompt}`
      : `Write a blog post with the title: "${title ?? 'Untitled'}"`;

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
        stream: true,
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

    // Stream the response back to the client
    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return serverError('AI generation failed', error);
  }
}
