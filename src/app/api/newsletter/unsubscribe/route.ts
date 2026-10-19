import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { unsubscribeFromKit } from '@/lib/kit';
import { escHtml } from '@/lib/resend';
import { verifyUnsubToken } from '@/lib/newsletter-tokens';

function buildPage(title: string, message: string, extra = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Riyad Ketami Newsletter</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:ui-monospace,"JetBrains Mono",monospace;background:#050505;color:#F4F4EF;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{max-width:480px;width:100%;border:1px solid #2A2A28;border-radius:8px;padding:40px;background:#1E1E1E}
    .eyebrow{color:#00CD29;font-size:11px;letter-spacing:0.2em;margin-bottom:20px}
    h1{font-size:20px;font-weight:700;color:#F4F4EF;margin-bottom:12px}
    p{color:#9A9A94;line-height:1.7;font-size:14px;margin-bottom:16px}
    a{color:#00CD29;text-decoration:none}
    a:hover{text-decoration:underline}
    button{font:inherit;background:#00CD29;color:#050505;border:0;border-radius:6px;padding:10px 18px;font-weight:700;cursor:pointer;margin-bottom:16px}
  </style>
</head>
<body>
  <div class="card">
    <p class="eyebrow">// newsletter</p>
    <h1>${title}</h1>
    <p>${message}</p>
    ${extra}
    <p><a href="https://ketami.net/en">Back to site</a></p>
  </div>
</body>
</html>`;
}

const HTML = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' };

function invalid(status = 400): Response {
  return new Response(
    buildPage('Invalid link', 'This unsubscribe link is not valid. Please use the link from the email you received.'),
    { status, headers: HTML }
  );
}

/**
 * GET: show a confirmation page only. Unsubscribing on GET let mail scanners
 * and link previews remove people from the list without them asking.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.toLowerCase().trim() ?? '';
  const token = searchParams.get('token') ?? '';

  if (!email || !token) {
    return new Response(
      buildPage('Invalid link', 'This unsubscribe link is missing required parameters.'),
      { status: 400, headers: HTML }
    );
  }
  if (!verifyUnsubToken(email, token)) return invalid();

  const action = `/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  const form = `<form method="post" action="${escHtml(action)}"><button type="submit">Unsubscribe</button></form>`;
  return new Response(
    buildPage('Unsubscribe?', `Stop sending the newsletter to <strong>${escHtml(email)}</strong>?`, form),
    { headers: HTML }
  );
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
  if (!email || !token || !verifyUnsubToken(email, token)) return invalid();

  await dbConnect();

  const result = await Subscriber.findOneAndUpdate(
    { email, unsubscribed: { $ne: true } },
    { $set: { unsubscribed: true, unsubscribedAt: new Date() } },
    { new: true }
  );

  if (!result) {
    // Already unsubscribed or not found: treat gracefully
    return new Response(
      buildPage('Already unsubscribed', "You're already off the list. You won't receive any more emails from us."),
      { headers: HTML }
    );
  }

  // Mirror the unsubscribe to Kit so the ESP list can't drift from ours
  unsubscribeFromKit(email).catch(() => {});

  return new Response(
    buildPage('Unsubscribed', "You've been successfully removed from the list. You won't receive any more emails from us."),
    { headers: HTML }
  );
}
