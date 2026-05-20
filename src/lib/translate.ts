const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-flash-2.5';

const INSTRUCTIONS: Record<'fr' | 'ar', string> = {
  fr: `You are translating a blog post for Riyad Ketami, an Algerian digital entrepreneur and AI consultant. Translate to French. Use sharp, direct, modern French as written by a North African tech entrepreneur — NOT academic or formal Parisian French. Keep all HTML tags exactly as-is. Only translate visible text content. Preserve formatting.`,
  ar: `You are translating a blog post for Riyad Ketami, a North African digital entrepreneur. Translate to Arabic. Use accessible Modern Standard Arabic (MSA) with Maghrebi-friendly tone — direct, practical, modern. NOT formal Gulf Arabic. Keep all HTML tags exactly as-is. Only translate visible text content. The output will be displayed RTL. Preserve formatting.`,
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
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ketami.net',
      'X-Title': 'Riyad Ketami Blog',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: INSTRUCTIONS[targetLang] },
        {
          role: 'user',
          content: `Translate the following. Return a JSON object with keys: title, excerpt, content. No explanation, just the JSON.\n\nTitle: ${title}\n\nExcerpt: ${excerpt}\n\nContent HTML:\n${content}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenRouter error ${response.status}: ${text}`);
  }

  const data = await response.json() as { choices?: { message?: { content?: string } }[] };
  const raw = (data.choices?.[0]?.message?.content ?? '').trim();

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid translation response — no JSON found');

  return JSON.parse(jsonMatch[0]) as { title: string; excerpt: string; content: string };
}
