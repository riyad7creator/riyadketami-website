import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { serverError } from '@/lib/api-helpers';
import type { Locale } from '@/i18n/config';

interface ImportEntry {
  email: string;
  preferredLanguage?: Locale;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as { entries?: ImportEntry[]; emails?: string[] };
    // Support both new format (entries with language) and legacy format (emails array)
    const entries: ImportEntry[] =
      body.entries ??
      (body.emails?.map((e) => ({ email: e })) ?? []);

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'No entries provided' }, { status: 400 });
    }

    // Validate and normalise
    const validEntries = entries
      .map((e) => ({
        email: String(e.email).toLowerCase().trim(),
        preferredLanguage: e.preferredLanguage,
      }))
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email));

    if (validEntries.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses found' }, { status: 400 });
    }

    await dbConnect();

    let imported = 0;
    let skipped = 0;

    await Promise.all(
      validEntries.map(async ({ email, preferredLanguage }) => {
        try {
          await Subscriber.create({ email, preferredLanguage });
          imported++;
        } catch (e: unknown) {
          // Duplicate key error
          if ((e as { code?: number })?.code === 11000) {
            // Update language preference if provided
            if (preferredLanguage) {
              await Subscriber.updateOne({ email }, { $set: { preferredLanguage } });
            }
            skipped++;
          } else {
            throw e;
          }
        }
      })
    );

    return NextResponse.json({ imported, skipped, total: validEntries.length });
  } catch (error) {
    return serverError('Import failed', error);
  }
}
