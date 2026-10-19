import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import MediaFileModel from '@/models/MediaFile';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { getOpenRouterKey, getModel, getModelInfo, logUsage, checkBudget, OPENROUTER_URL } from '@/lib/ai-config';

const MAX_BATCH = 20;
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
/** Raster formats vision models accept as data URLs (SVG is not one of them) */
const VISION_MIME = /^image\/(jpeg|png|webp|gif)$/;

interface Failure {
  id: string;
  name: string;
  error: string;
}

/** POST /api/admin/ai/alt-text: auto-generate alt text for images missing it */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const apiKey = await getOpenRouterKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter key not configured. Set it in Settings > AI.' }, { status: 500 });
    }
    const overBudget = await checkBudget();
    if (overBudget) return overBudget;

    await dbConnect();

    const body = await readJson<{ mediaIds?: unknown }>(req);
    const mediaIds = Array.isArray(body?.mediaIds)
      ? (body.mediaIds as unknown[]).filter((id): id is string => typeof id === 'string' && OBJECT_ID.test(id))
      : [];
    const query: Record<string, unknown> = mediaIds.length
      ? { _id: { $in: mediaIds } }
      : { altText: { $in: ['', null] }, mediaType: 'image', mimeType: { $in: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } };

    const images = await MediaFileModel.find(query).limit(MAX_BATCH).lean() as Array<{
      _id: { toString(): string };
      url: string;
      originalName: string;
      folder: string;
      mimeType: string;
    }>;

    if (images.length === 0) {
      return NextResponse.json({ updated: 0, total: 0, failed: 0, failures: [], message: 'All images already have alt text.' });
    }

    const model = await getModel('alttext');
    const info = await getModelInfo(model);
    if (info && !info.architecture?.input_modalities?.includes('image')) {
      return NextResponse.json(
        { error: `The alt-text model "${model}" does not accept images. Pick a vision model in Settings > AI.` },
        { status: 400 }
      );
    }

    let updated = 0;
    const failures: Failure[] = [];

    for (const img of images) {
      const id = img._id.toString();
      const fail = (error: string) => failures.push({ id, name: img.originalName, error });
      if (!VISION_MIME.test(img.mimeType ?? '')) {
        fail(`Unsupported format for vision models (${img.mimeType})`);
        continue;
      }
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ketami.net',
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
          signal: AbortSignal.timeout(60_000),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          fail(`AI error ${res.status}: ${text.slice(0, 160)}`);
          continue;
        }

        const data = await res.json() as {
          choices?: { message?: { content?: string } }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        // Every answered call costs tokens, even when the text is unusable
        logUsage({
          model,
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          route: 'alt-text',
        });

        const altText = (data.choices?.[0]?.message?.content ?? '').trim().replace(/^["']|["']$/g, '').slice(0, 125);
        if (!altText) {
          fail('Empty answer from the model');
          continue;
        }

        await MediaFileModel.findByIdAndUpdate(img._id, { $set: { altText } });
        updated++;
      } catch (err) {
        fail(err instanceof Error ? err.message : 'Request failed');
      }
    }

    const payload = { updated, total: images.length, failed: failures.length, failures };
    if (updated === 0) {
      return NextResponse.json(
        { ...payload, error: `No alt text generated: ${failures[0]?.error ?? 'unknown error'}` },
        { status: 502 }
      );
    }
    return NextResponse.json(payload);
  } catch (error) {
    return serverError('Alt text generation failed', error);
  }
}
