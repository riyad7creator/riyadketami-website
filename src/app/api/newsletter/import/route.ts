import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { syncToKit } from '@/lib/kit';
import { serverError } from '@/lib/api-helpers';

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as { emails?: string[] };
    const emails = body.emails;

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
    }

    // Validate and normalise
    const validEmails = emails
      .map((e) => String(e).toLowerCase().trim())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (validEmails.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses found' }, { status: 400 });
    }

    await dbConnect();

    // Use insertMany with ordered:false to skip duplicates
    let imported = 0;
    let skipped = 0;

    const newlyImported: string[] = [];
    await Promise.all(
      validEmails.map(async (email) => {
        try {
          await Subscriber.create({ email });
          imported++;
          newlyImported.push(email);
        } catch (e: unknown) {
          // Duplicate key error
          if ((e as { code?: number })?.code === 11000) {
            skipped++;
          } else {
            throw e;
          }
        }
      })
    );

    // Imported emails must reach Kit too, or the two lists silently drift.
    // Fire-and-forget, sequential to stay polite to Kit's rate limits.
    void (async () => {
      for (const email of newlyImported) {
        await syncToKit({ email_address: email });
      }
    })();

    return NextResponse.json({ imported, skipped, total: validEmails.length });
  } catch (error) {
    return serverError('Import failed', error);
  }
}
