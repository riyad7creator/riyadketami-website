import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { getAIKey, missingKeyMessage, getModel, checkBudget, aiStream } from '@/lib/ai-config';

export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const apiKey = await getAIKey();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: await missingKeyMessage() }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const overBudget = await checkBudget();
    if (overBudget) return overBudget;

    const body = await readJson(req) as { title?: string; prompt?: string; language?: string };
    const { title, prompt, language = 'en' } = body;

    const model = await getModel('writing');

    const systemPrompt = `You are an expert content writer. Write a high-quality, engaging blog post in ${language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English'}.
Format the output as clean HTML using only: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <code>, <pre>.
Do NOT include <html>, <body>, <head>, or any wrapper tags.
Write in a clear, authoritative, and practical style. Aim for 600-1000 words.`;

    const userMessage = prompt
      ? `Write a blog post about: ${prompt}`
      : `Write a blog post with the title: "${title ?? 'Untitled'}"`;

    return await aiStream({
      apiKey,
      model,
      route: 'generate',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });
  } catch (error) {
    return serverError('AI generation failed', error);
  }
}
