import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import type { Locale } from '@/i18n/config';

interface ImportEntry {
  email: string;
  preferredLanguage?: Locale;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const body = await req.json() as { entries?: ImportEntry[]; emails?: string[] };
    // Support both new format (entries with language) and legacy format (emails array)
    const entries: ImportEntry[] =
      body.entries ??
      (body.emails?.map((e) => ({ email: e })) ?? []);

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'No entries provided' }, { status: 400 });
    }

    const validEntries = entries
      .map((e) => ({
        email: String(e.email).toLowerCase().trim(),
        preferredLanguage: e.preferredLanguage,
      }))
      .filter((e) => EMAIL_RE.test(e.email));

    if (validEntries.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses found' }, { status: 400 });
    }

    await dbConnect();

    // Single bulkWrite — upsert each entry. Avoids N round-trips and the
    // E11000 try/catch dance, and keeps the connection pool safe on Atlas
    // free tier even for thousand-email imports.
    const ops = validEntries.map(({ email, preferredLanguage }) => ({
      updateOne: {
        filter: { email },
        update: {
          $setOnInsert: { email },
          ...(preferredLanguage ? { $set: { preferredLanguage } } : {}),
        },
        upsert: true,
      },
    }));

    const result = await Subscriber.bulkWrite(ops, { ordered: false });
    const imported = result.upsertedCount ?? 0;
    const skipped = validEntries.length - imported;

    return NextResponse.json({ imported, skipped, total: validEntries.length });
  } catch (error) {
    return serverError('Import failed', error);
  }
}
