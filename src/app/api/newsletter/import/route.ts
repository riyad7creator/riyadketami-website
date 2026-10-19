import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';

const MAX_ENTRIES = 5000;

const schema = z.object({
  entries: z
    .array(
      z.object({
        email: z.string().trim().toLowerCase().max(254),
        preferredLanguage: z.enum(['ar', 'en', 'fr']).optional().catch(undefined),
      })
    )
    .min(1)
    .max(MAX_ENTRIES),
});

const EMAIL = z.string().email();

/**
 * POST { entries: [{ email, preferredLanguage? }] }: import people who already
 * agreed to receive the newsletter elsewhere. They join as confirmed, with the
 * import recorded as their consent source; press "Sync to Resend" afterwards.
 */
export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) {
      return NextResponse.json({ error: `Send between 1 and ${MAX_ENTRIES} rows with an email column.` }, { status: 400 });
    }
    const seen = new Set<string>();
    const valid = parsed.data.entries.filter((e) => {
      if (!EMAIL.safeParse(e.email).success || seen.has(e.email)) return false;
      seen.add(e.email);
      return true;
    });
    const invalid = parsed.data.entries.length - valid.length;
    if (valid.length === 0) return NextResponse.json({ error: 'No valid email addresses found' }, { status: 400 });

    await dbConnect();
    const now = new Date();
    const result = await Subscriber.bulkWrite(
      valid.map(({ email, preferredLanguage }) => ({
        updateOne: {
          filter: { email },
          update: {
            $setOnInsert: {
              email,
              unsubscribed: false,
              confirmed: true,
              confirmedAt: now,
              source: 'import',
              consent: { at: now, form: 'import' },
              welcomeStep: 3,
            },
            ...(preferredLanguage ? { $set: { preferredLanguage } } : {}),
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
    const imported = result.upsertedCount ?? 0;
    return NextResponse.json({ imported, skipped: valid.length - imported, invalid, total: parsed.data.entries.length });
  } catch (error) {
    return serverError('Import failed', error);
  }
}
