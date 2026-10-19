import dbConnect from '@/lib/db/connect';
import Subscriber, { subscriberStatus } from '@/models/Subscriber';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import { csvRow } from '@/lib/csv';

/** GET ?lang: CSV of every subscriber with status, consent and source */
export async function GET(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang')?.trim() ?? '';
    await dbConnect();
    const query: Record<string, unknown> = {};
    if (lang && ['ar', 'en', 'fr'].includes(lang)) query.preferredLanguage = lang;

    const subscribers = await Subscriber.find(query)
      .sort({ createdAt: -1 })
      .select('email preferredLanguage createdAt confirmed confirmedAt unsubscribed unsubscribeReason source consent')
      .lean();

    const day = (d?: Date) => (d ? new Date(d).toISOString().slice(0, 10) : '');
    const csv =
      'email,preferredLanguage,subscriptionDate,status,unsubscribeReason,confirmedAt,consentAt,consentForm,source\n' +
      subscribers
        .map((s) =>
          csvRow([
            s.email,
            s.preferredLanguage ?? '',
            day(s.createdAt),
            subscriberStatus(s),
            s.unsubscribed ? s.unsubscribeReason ?? 'user' : '',
            day(s.confirmedAt),
            day(s.consent?.at),
            s.consent?.form ?? '',
            s.source ?? '',
          ])
        )
        .join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="subscribers-${lang || 'all'}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return serverError('Failed to export subscribers', error);
  }
}
