import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { escHtml } from '@/lib/newsletter/template';
import { verifyUnsubToken } from '@/lib/newsletter-tokens';
import { copyFor } from '@/lib/newsletter/copy';
import { newsletterPage, HTML_HEADERS } from '@/lib/newsletter/html-page';
import { unsubscribeSubscriber } from '@/lib/newsletter/lifecycle';

async function langFor(email: string): Promise<string> {
  try {
    await dbConnect();
    const sub = await Subscriber.findOne({ email }).select('preferredLanguage').lean();
    return sub?.preferredLanguage ?? 'en';
  } catch {
    return 'en';
  }
}

function invalid(lang: string): Response {
  const p = copyFor(lang).pages;
  return new Response(newsletterPage(lang, p.invalidTitle, escHtml(p.invalidBody)), { status: 400, headers: HTML_HEADERS });
}

/**
 * GET: confirmation page only. Unsubscribing on GET would let mail scanners
 * and link previews remove people from the list without them asking.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.toLowerCase().trim() ?? '';
  const token = searchParams.get('token') ?? '';
  if (!email || !token || !verifyUnsubToken(email, token)) return invalid('en');

  const lang = await langFor(email);
  const p = copyFor(lang).pages;
  const action = `/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  const form = `<form method="post" action="${escHtml(action)}"><button type="submit">${escHtml(p.unsubButton)}</button></form>`;
  return new Response(newsletterPage(lang, p.unsubConfirmTitle, p.unsubConfirmBody(escHtml(email)), form), { headers: HTML_HEADERS });
}

/**
 * POST: the actual unsubscribe. Serves both the confirm form above and RFC 8058
 * one-click unsubscribe (mail clients POST "List-Unsubscribe=One-Click" to the
 * List-Unsubscribe URL, which carries email + token in its query string).
 */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  let email = searchParams.get('email') ?? '';
  let token = searchParams.get('token') ?? '';
  if (!email || !token) {
    try {
      const form = await req.formData();
      email = email || String(form.get('email') ?? '');
      token = token || String(form.get('token') ?? '');
    } catch {
      // not a form body
    }
  }
  email = email.toLowerCase().trim();
  if (!email || !token || !verifyUnsubToken(email, token)) return invalid('en');

  const lang = await langFor(email);
  const p = copyFor(lang).pages;
  const changed = await unsubscribeSubscriber(email, 'user');
  return new Response(
    changed
      ? newsletterPage(lang, p.unsubDoneTitle, escHtml(p.unsubDoneBody))
      : newsletterPage(lang, p.unsubAlreadyTitle, escHtml(p.unsubAlreadyBody)),
    { headers: HTML_HEADERS }
  );
}
