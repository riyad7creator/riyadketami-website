import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { getAIKey, missingKeyMessage, getModel, checkBudget, aiJson } from '@/lib/ai-config';

const LANG_LABELS: Record<string, string> = {
  fr: 'French',
  ar: 'Arabic',
  en: 'English',
};

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

    const body = await readJson<{ content?: unknown; targetLanguage?: unknown; title?: unknown; excerpt?: unknown }>(req);
    const content = typeof body?.content === 'string' ? body.content : '';
    const targetLanguage = typeof body?.targetLanguage === 'string' ? body.targetLanguage : '';
    const title = typeof body?.title === 'string' ? body.title : undefined;
    const excerpt = typeof body?.excerpt === 'string' ? body.excerpt : undefined;

    if (!content || !LANG_LABELS[targetLanguage]) {
      return new Response(JSON.stringify({ error: 'content and targetLanguage are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const langLabel = LANG_LABELS[targetLanguage];
    const model = await getModel('translation');

    const systemPrompt = `You are a professional translator specializing in blog content.
Translate the provided HTML blog post content into ${langLabel}.
Preserve all HTML tags exactly as they appear; only translate the text content between tags.
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

    const result = await aiJson<{ title?: string; excerpt?: string; content?: string }>({
      apiKey,
      model,
      route: 'translate',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      title: String(result.data.title ?? ''),
      excerpt: String(result.data.excerpt ?? ''),
      content: String(result.data.content ?? ''),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return serverError('Translation failed', error);
  }
}
