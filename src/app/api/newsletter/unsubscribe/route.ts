import { createHmac, timingSafeEqual } from 'crypto';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';

/** Reproduce the same token used in send/route.ts */
function unsubToken(email: string): string {
  const secret = process.env.NEWSLETTER_UNSUB_SECRET ?? process.env.NEXTAUTH_SECRET ?? '';
  return createHmac('sha256', secret).update(email.toLowerCase()).digest('hex');
}

function buildPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Riyad Ketami Newsletter</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:ui-monospace,"JetBrains Mono",monospace;background:#0a0b0d;color:#e5e7eb;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{max-width:480px;width:100%;border:1px solid #1f2937;border-radius:8px;padding:40px;background:#0e0f11}
    .eyebrow{color:#00ff66;font-size:11px;letter-spacing:0.2em;margin-bottom:20px}
    h1{font-size:20px;font-weight:700;color:#f9fafb;margin-bottom:12px}
    p{color:#9ca3af;line-height:1.7;font-size:14px;margin-bottom:16px}
    a{color:#00ff66;text-decoration:none}
    a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div class="card">
    <p class="eyebrow">// newsletter</p>
    <h1>${title}</h1>
    <p>${message}</p>
    <p><a href="https://riyadketami.com/en">← Back to site</a></p>
  </div>
</body>
</html>`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.toLowerCase().trim() ?? '';
  const token = searchParams.get('token') ?? '';

  if (!email || !token) {
    return new Response(
      buildPage('Invalid link', 'This unsubscribe link is missing required parameters.'),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Constant-time HMAC comparison to prevent timing attacks
  const expected = unsubToken(email);
  const expectedBuf = Buffer.from(expected, 'hex');
  const receivedBuf = Buffer.from(token.padEnd(expected.length, '0').slice(0, expected.length), 'hex');
  const valid = expectedBuf.length === receivedBuf.length &&
    timingSafeEqual(expectedBuf, receivedBuf);

  if (!valid) {
    return new Response(
      buildPage('Invalid link', 'This unsubscribe link is not valid. Please use the link from the email you received.'),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  await dbConnect();

  const result = await Subscriber.findOneAndUpdate(
    { email, unsubscribed: { $ne: true } },
    { $set: { unsubscribed: true, unsubscribedAt: new Date() } },
    { new: true }
  );

  if (!result) {
    // Already unsubscribed or not found — treat gracefully
    return new Response(
      buildPage('Already unsubscribed', "You're already off the list. You won't receive any more emails from us."),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  return new Response(
    buildPage('Unsubscribed', "You've been successfully removed from the list. You won't receive any more emails from us."),
    { headers: { 'Content-Type': 'text/html' } }
  );
}
