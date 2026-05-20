import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import MediaFileModel from '@/models/MediaFile';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import { getOpenRouterKey, getModel, logUsage, OPENROUTER_URL } from '@/lib/ai-config';

const MAX_BATCH = 20;

/** POST /api/admin/ai/alt-text — auto-generate alt text for images missing it */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const apiKey = await getOpenRouterKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter key not configured. Set it in Settings → AI.' }, { status: 500 });
    }

    await dbConnect();

    const body = await req.json() as { mediaIds?: string[] };
    const query: Record<string, unknown> = body.mediaIds?.length
      ? { _id: { $in: body.mediaIds } }
      : { altText: { $in: ['', null] }, mediaType: { $ne: 'video' }, mimeType: { $not: /application\/json/ } };

    const images = await MediaFileModel.find(query).limit(MAX_BATCH).lean() as Array<{
      _id: { toString(): string };
      url: string;
      originalName: string;
      folder: string;
    }>;

    if (images.length === 0) {
      return NextResponse.json({ updated: 0, message: 'All images already have alt text.' });
    }

    const model = await getModel('alttext');
    let updated = 0;
    let totalTokens = { prompt: 0, completion: 0 };

    for (const img of images) {
      try {
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
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Write a concise, descriptive alt text (max 125 characters) for this image. The image is in the "${img.folder}" folder on a personal brand website for a content creator. Respond with ONLY the alt text, no quotes, no explanation.`,
                  },
                  { type: 'image_url', image_url: { url: img.url } },
                ],
              },
            ],
          }),
        });

        if (!res.ok) continue;

        const data = await res.json() as {
          choices?: { message?: { content?: string } }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        const altText = data.choices?.[0]?.message?.content?.trim().slice(0, 125) ?? '';
        if (!altText) continue;

        await MediaFileModel.findByIdAndUpdate(img._id, { $set: { altText } });
        updated++;
        totalTokens.prompt += data.usage?.prompt_tokens ?? 0;
        totalTokens.completion += data.usage?.completion_tokens ?? 0;
      } catch {
        // Skip individual failures
      }
    }

    logUsage({ model, promptTokens: totalTokens.prompt, completionTokens: totalTokens.completion, route: 'alt-text' });

    return NextResponse.json({ updated, total: images.length });
  } catch (error) {
    return serverError('Alt text generation failed', error);
  }
}
