import { BRAND } from '@/lib/brand';
import { getAIKey, missingKeyMessage, getModel, aiJson } from '@/lib/ai-config';

// Identity comes from BRAND so the prompt follows the title swap (brief §1).
const WHO = `${BRAND.name} (${BRAND.title}, ${BRAND.proofLine}), based in ${BRAND.location.city}, ${BRAND.location.country}`;

const INSTRUCTIONS: Record<'fr' | 'ar', string> = {
  fr: `You are translating a blog post for ${WHO}. Translate to French. Use sharp, direct, modern French as written by a North African tech entrepreneur, NOT academic or formal Parisian French. Keep all HTML tags exactly as-is. Only translate visible text content. Preserve formatting.`,
  ar: `You are translating a blog post for ${WHO}. Translate to Arabic. Use accessible Modern Standard Arabic (MSA) with Maghrebi-friendly tone: direct, practical, modern. NOT formal Gulf Arabic. Keep all HTML tags exactly as-is. Only translate visible text content. The output will be displayed RTL. Preserve formatting.`,
};

export async function translatePostContent({
  title,
  excerpt,
  content,
  targetLang,
}: {
  title: string;
  excerpt: string;
  content: string;
  targetLang: 'fr' | 'ar';
}): Promise<{ title: string; excerpt: string; content: string }> {
  // Same key resolution (env first, then the key saved in Settings > AI) and
  // the same configured translation model as the rest of the studio.
  const apiKey = await getAIKey();
  if (!apiKey) throw new Error(await missingKeyMessage());
  const model = await getModel('translation');

  const result = await aiJson<{ title?: unknown; excerpt?: unknown; content?: unknown }>({
    apiKey,
    model,
    route: 'translate-post',
    temperature: 0.2,
    messages: [
      { role: 'system', content: INSTRUCTIONS[targetLang] },
      {
        role: 'user',
        content: `Translate the following. Return a JSON object with keys: title, excerpt, content. No explanation, just the JSON.\n\nTitle: ${title}\n\nExcerpt: ${excerpt}\n\nContent HTML:\n${content}`,
      },
    ],
  });
  if (!result.ok) throw new Error(result.error);

  const out = {
    title: typeof result.data.title === 'string' ? result.data.title.trim().slice(0, 100) : '',
    excerpt: typeof result.data.excerpt === 'string' ? result.data.excerpt.trim().slice(0, 300) : '',
    content: typeof result.data.content === 'string' ? result.data.content : '',
  };
  if (!out.title || !out.content) throw new Error('Invalid translation response: title or content missing');
  return out;
}
