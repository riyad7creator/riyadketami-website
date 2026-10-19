import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { getNewsletterSettings, saveNewsletterSettings } from '@/lib/newsletter/config';

const magnet = z.object({ title: z.string().trim().max(120), url: z.union([z.literal(''), z.string().trim().url().max(500)]) });

const schema = z.object({
  postalAddress: z.string().trim().max(300),
  replyTo: z.string().trim().email().max(254),
  leadMagnet: z.object({ en: magnet.optional(), fr: magnet.optional(), ar: magnet.optional() }),
  archiveByDefault: z.boolean(),
});

export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  try {
    return NextResponse.json(await getNewsletterSettings());
  } catch (error) {
    return serverError('Failed to load settings', error);
  }
}

export async function PUT(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  try {
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid settings', path: parsed.error.issues[0]?.path }, { status: 400 });
    }
    const leadMagnet = Object.fromEntries(
      Object.entries(parsed.data.leadMagnet).filter(([, v]) => v && v.title && v.url)
    );
    await saveNewsletterSettings({ ...parsed.data, leadMagnet });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Failed to save settings', error);
  }
}
