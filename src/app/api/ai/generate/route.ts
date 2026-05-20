import { requireAdmin, serverError } from '@/lib/api-helpers';
import { getOpenRouterKey, getModel, OPENROUTER_URL } from '@/lib/ai-config';

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

    const body = await req.json() as { title?: string; prompt?: string; language?: string };
    const { title, prompt, language = 'en' } = body;

    const model = await getModel('writing');

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
        'HTTP-Referer': 'https://riyadketami.com',
        'X-Title': 'Riyad Ketami Admin',
      },
      body: JSON.stringify({
        model,
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
