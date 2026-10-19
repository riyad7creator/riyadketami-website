import { escHtml } from './template';
import { copyFor } from './copy';

/** Small standalone page for API-served newsletter screens (unsubscribe, keep) */
export function newsletterPage(lang: string, title: string, messageHtml: string, extra = ''): string {
  const c = copyFor(lang);
  const l = lang === 'fr' || lang === 'ar' ? lang : 'en';
  const rtl = l === 'ar';
  return `<!DOCTYPE html>
<html lang="${l}" dir="${rtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escHtml(title)} | Riyad Ketami</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:${rtl ? "Tahoma,'Segoe UI',Arial" : "ui-sans-serif,-apple-system,'Segoe UI',Roboto,Arial"},sans-serif;background:#050505;color:#F4F4EF;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{max-width:480px;width:100%;border:1px solid #2A2A28;border-radius:10px;padding:36px;background:#111110}
.brand{font-weight:800;letter-spacing:.08em;font-size:13px;margin-bottom:24px;direction:ltr;${rtl ? 'text-align:right;' : ''}}
.brand span{color:#00CD29}
h1{font-size:22px;font-weight:700;margin-bottom:12px}
p{color:#B4B4AD;line-height:1.7;font-size:15px;margin-bottom:16px}
a{color:#00CD29;text-decoration:none}
a:hover{text-decoration:underline}
button{font:inherit;background:#00CD29;color:#050505;border:0;border-radius:8px;padding:12px 20px;font-weight:700;cursor:pointer;margin-bottom:16px}
.links{display:flex;gap:16px;flex-wrap:wrap;font-size:14px}
</style>
</head>
<body>
<main class="card">
<p class="brand">RIYAD KETAMI<span>_</span></p>
<h1>${escHtml(title)}</h1>
<p>${messageHtml}</p>
${extra}
<p class="links"><a href="/${l}">${escHtml(c.pages.back)}</a><a href="/${l}/newsletter/preferences">${escHtml(c.pages.manageLink)}</a></p>
</main>
</body>
</html>`;
}

export const HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } as const;
