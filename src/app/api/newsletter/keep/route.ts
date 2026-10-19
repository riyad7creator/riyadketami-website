import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { verifyUnsubToken } from '@/lib/newsletter-tokens';
import { copyFor } from '@/lib/newsletter/copy';
import { escHtml } from '@/lib/newsletter/template';
import { newsletterPage, HTML_HEADERS } from '@/lib/newsletter/html-page';

/** GET /api/newsletter/keep?e&t&l: the win-back email's "keep me subscribed" button */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('e')?.toLowerCase().trim() ?? '';
  const token = searchParams.get('t') ?? '';
  const lang = searchParams.get('l') ?? 'en';
  const p = copyFor(lang).pages;
  if (!email || !token || !verifyUnsubToken(email, token)) {
    return new Response(newsletterPage(lang, p.invalidTitle, escHtml(p.invalidBody)), { status: 400, headers: HTML_HEADERS });
  }
  await dbConnect();
  await Subscriber.updateOne({ email }, { $set: { lastClickAt: new Date() }, $unset: { winbackSentAt: '' } });
  return new Response(newsletterPage(lang, p.keepTitle, escHtml(p.keepBody)), { headers: HTML_HEADERS });
}
