# KETAMI — Website Brand Review & Implementation Brief

> **For Claude Code.** Drop this file at the root of the website project and start with:
> `Read KETAMI_BRAND_REVIEW.md and run Phase 1.`
>
> Owner: Riyad Ketami · Brief version: 1.0 · 12 Oct 2026
> This file is the **single source of truth** for brand, copy and visuals. If the codebase disagrees with it, the codebase is wrong — unless a line below is marked `[PENDING]`.

---

## 0. How to work

| Phase | What you do | Edits allowed? | Output |
|---|---|---|---|
| **1. Audit** | Read the whole project (pages, components, styles, config, meta, `public/`). Compare everything against sections 2–6. | **No edits.** | `BRAND_AUDIT.md` (format in §7) |
| **2. Fix** | After Riyad approves the audit, apply fixes in the order P0 → P1 → P2. One commit per area (tokens, copy, meta, layout, assets). | Yes | Commits + a short changelog at the end of `BRAND_AUDIT.md` |
| **3. Visuals** | Place existing kit assets (§6.1). For each missing visual, add a placeholder with the manifest ID, then generate with Higgsfield (§6.3) only after Riyad approves the cost. | Yes | Files in `public/brand/` + updated manifest status |

Rules for every phase:
- Never invent facts, numbers, clients, testimonials or quotes. If something is missing, write `[MISSING: …]` and list it in the audit.
- Never show follower counts anywhere on the site (Riyad's standing rule).
- Never write API keys or secrets into any file, commit, log or chat. Read them from environment variables only.
- Do not run `git push`, deploy, or change DNS. Riyad does that.

---

## 1. Positioning in one breath

**Riyad Ketami — AI expert, co-founder of Algeria Business Bay. He makes AI work for Algerian and MENA business, in Darija.**

- Master tagline: **Built in Algeria. Built for the world.**
- Ownable claim: **AI بالدارجة** (AI in Darija)
- Manifesto line (About section only, never the headline): *Attention is the code. Connection is the key.*
- Based in **Oran, Algeria** (not Algiers). Content is in **Algiers Darija** — those are different facts, keep both right.

### Title `[PENDING]`
The second title word is not decided yet. Put the title in **one constant** (e.g. `BRAND.title`) and use it everywhere so the swap is one line.

| Option | Status |
|---|---|
| `AI Expert & Creative Entrepreneur` | Recommended (research-backed) |
| `AI Expert & Digital Creator` | Riyad's own working label |
| `AI Expert` + co-founder line | **Use this as the live default until decided** |

Proof line, always directly under the title: **Co-founder, Algeria Business Bay**

---

## 2. Copy rules

### 2.1 Retire these (P0 if found anywhere: copy, meta, alt text, JSON-LD)
| Find | Why | Replace with |
|---|---|---|
| "red-pill", "Red-pill marketer" | Manosphere connotation; off-brand for a founder/speaker | Positioning line (§1) |
| "Free your mind. Build your brand." | Old Matrix-era slogan; also Codie Sanchez's promise | Master tagline |
| "digital marketing consultant", "marketer", "coach", "content strategist", "influencer" | Points back to the 2023 identity | `BRAND.title` |
| "AI & Marketing" | Old bio line | `AI بالدارجة` |
| "from Algiers" (about Riyad's location) | Wrong city | "Oran, Algeria" |
| Any follower / subscriber / view count | Standing rule | Remove; let the work speak |
| Moroccan Darija: دابا، ديال, and Moroccan/Tunisian/Gulf phrasing | Brand Book v1.0 hard-block | Algiers Darija (e.g. تاع, درك) |

### 2.2 Voice
- Proof over hype: "I tested it on a real project" beats "this AI is insane".
- Short, direct sentences. Active verbs. No buzzwords ("results-driven", "passionate about", "revolutionary").
- English and French for the site and partners; Darija for the Arabic lines. In Arabic, write `رابط الدخول` (not `الولوج`) for access links.
- Name things the way visitors recognise them: "Work with me", "Join ABB", "Invite me to speak".

### 2.3 Page copy (source of truth — use verbatim unless marked)

**Hero**
- Eyebrow (mono, uppercase): `AI EXPERT · CO-FOUNDER, ALGERIA BUSINESS BAY · ORAN, ALGERIA`
- H1 (EN): **I make AI work for Algerian business — in Darija.**
- H1 (FR): **Je rends l'IA utile aux entreprises algériennes, en darija.**
- Arabic line (`dir="rtl" lang="ar"`): **نخلّي الـAI يخدم البزنس تاعك، بالدارجة.**
- Sub: Co-founder of Algeria Business Bay. Launch partner for the AI labs shipping the tools. I test new models the week they launch, then show what actually works.
- Buttons: `Work with me` (mailto:riyad@ketami.net) · `Join Algeria Business Bay` (https://www.algeriabusinessbay.com)

**Quick links / link-in-bio block** (max 5, ABB always first, max 1 sponsor link and it must be labelled `PARTNER`)
1. Algeria Business Bay → https://www.algeriabusinessbay.com
2. Telegram channel (القناة) → https://t.me/riyadspeech
3. This week's tool → `[sponsor URL]` + `PARTNER` label
4. YouTube — AI in Darija → https://www.youtube.com/@RiyadKetami
5. LinkedIn → `[MISSING: LinkedIn URL]`

**Now** strip: Building Algeria Business Bay · Testing this month's AI launches · Speaking at ECSEL 26

**What I do** (3 cards)
| Eyebrow | Title | Body | Link |
|---|---|---|---|
| AI بالدارجة | AI explained in Darija | Hands-on breakdowns of the newest models and tools, tested on real projects, for Algerian and MENA entrepreneurs. | Watch on YouTube → |
| FOR AI COMPANIES | Launch partner in MENA | Dedicated launch videos in Algerian Darija across TikTok, Instagram, Facebook and YouTube, scripted, produced and delivered by my team. | Request the media kit → |
| FOR EVENTS & TEAMS | Talks and workshops | What AI changes for Algerian companies, in plain words, with live demos. Keynotes, panels and practical sessions in Darija, French or English. | Invite me to speak → |

**ABB section**: A private community for business in Algeria: real answers and the right people, whether you run a company in Algiers, sell across the wilayas, or invest from abroad. Built with Larbi, for people who do business here. → `Become a member`
- Stats shown (from algeriabusinessbay.com, 11 Oct 2026): **233** startups & companies mapped · **69** wilayas represented · **101** communities & networks. `[VERIFY with ABB before launch]` — ideally pull live from ABB rather than hard-coding.

**Trusted by AI teams** (text wordmarks only, no logo images until permission is confirmed): Moonshot AI · Kimi — MiniMax — Pollo AI — Higgsfield — Emergent

**About**
> I started in 2013 as a freelance graphic and web designer, then spent years inside agencies learning how brands get attention.
> In 2023 I went all in on AI, and on explaining it in the language most of our market actually speaks: Darija.
> Today I build Algeria Business Bay with Larbi, work with AI labs on their MENA launches, and speak about what AI really changes for Algerian companies.
> **Built in Algeria. Built for the world.**

**Contact**: riyad@ketami.net · Oran, Algeria · socials row (§5.3)

---

## 3. Design tokens

### 3.1 Color
| Token | Hex | Use |
|---|---|---|
| `--ink` (Terminal Ink) | `#111111` | Page background |
| `--signal` (Signal Green) | `#00CD29` | Accent only: cursor underscore, eyebrows, primary button, focus ring, thin rules. **Never** body text on light, never large fills |
| `--paper` | `#F2F2EE` | Primary text on ink; light section background (ABB block) |
| `--muted` | `#A3A39C` | Secondary text on ink |
| `--panel` | `#1A1A1A` | Cards on ink |
| `--line` | `#2A2A2A` | Hairlines, borders |

Contrast checks to enforce: `--paper` on `--ink` ✔; `--muted` on `--ink` ✔ (≥4.5:1 at body size); `#111` text on `--signal` button ✔. **Fail:** white text on `--signal` — never do it.

### 3.2 Type
| Role | Font | Notes |
|---|---|---|
| Display / UI | **Space Grotesk** 400/500/700 | Headings tight (`letter-spacing:-0.02em`), `text-wrap: balance` |
| Mono / labels | **JetBrains Mono** 400/500 | Uppercase eyebrows, `letter-spacing: .12em`; email, URLs |
| Arabic | **Montserrat Arabic** (brand, social) → web fallback **IBM Plex Sans Arabic** 500/600 | Every Arabic run gets `dir="rtl" lang="ar"`. Montserrat Arabic is not on Google Fonts — self-host only if licensed |

### 3.3 Signature motifs (use these, consistently)
- **Cursor underscore**: a solid `--signal` bar after `RIYAD KETAMI` in the logo/wordmark (`RIYAD KETAMI_`).
- **Mono eyebrows** above section titles.
- **Thin horizontal green light lines** as the only decorative graphic.
- Dark photography with a **green rim light**; never a green wash over the face.

### 3.4 Retire (P1 if found)
Matrix code-rain backgrounds · green-tinted or neon-outlined portraits · emoji as icons or bullets · gradient washes (purple→blue etc.) · glassmorphism · generic stock "AI robot/brain" imagery · centered-everything layouts · uniform heavy shadows on every card.

### 3.5 Layout & accessibility
- Max content width ~1200px, side gutter ≥16px, works at 390px wide with no horizontal scroll.
- Touch targets ≥44px; visible focus (`outline: 2px solid var(--signal)`).
- Real `<a href>` / `<button>`; icon-only buttons need `aria-label`.
- `prefers-reduced-motion`: disable any video loop/parallax.
- Images: `alt` text written per manifest (§6), `width`/`height` set, lazy-load below the fold, WebP/AVIF with JPEG fallback.

---

## 4. Logo & identity assets
- Wordmark: `RIYAD KETAMI_` (Space Grotesk 700 + green underscore). Files: `wordmark_light.png` (on dark), `wordmark_dark.png` (on light). Prefer rebuilding it as live text/SVG in the header.
- Monogram/favicon: `RK_` → `monogram_1024.png`, `favicon_512.png`. Generate `favicon.ico` (16/32/48), `apple-touch-icon.png` (180), and `icon-192.png` / `icon-512.png` from `favicon_512.png`.

---

## 5. Technical & SEO checklist

### 5.1 Head
- `<title>`: `Riyad Ketami — AI Expert & Co-founder, Algeria Business Bay` (swap in `BRAND.title` when decided)
- Meta description (≤155 chars): `AI expert and co-founder of Algeria Business Bay. Riyad Ketami makes AI work for Algerian and MENA business, in Darija.`
- Open Graph + Twitter card: `og-image_1200x630.jpg`, `og:type=profile`, `twitter:card=summary_large_image`.
- `<html lang="en">` (or per locale); Arabic runs marked inline. If FR/AR versions exist, add `hreflang` alternates.

### 5.2 Person schema (JSON-LD) — required, it is how Google links the name to the profiles
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Riyad Ketami",
  "jobTitle": "AI Expert",
  "description": "AI expert and co-founder of Algeria Business Bay, making AI work for Algerian and MENA business in Darija.",
  "url": "https://ketami.net",
  "image": "https://ketami.net/brand/profile-picture_800.jpg",
  "email": "mailto:riyad@ketami.net",
  "address": { "@type": "PostalAddress", "addressLocality": "Oran", "addressCountry": "DZ" },
  "worksFor": { "@type": "Organization", "name": "Algeria Business Bay", "url": "https://www.algeriabusinessbay.com" },
  "knowsLanguage": ["ar", "fr", "en"],
  "sameAs": [
    "https://www.tiktok.com/@riyadketami",
    "https://www.instagram.com/riyadketami/",
    "https://www.facebook.com/riyadketami",
    "https://www.youtube.com/@RiyadKetami",
    "https://www.threads.com/@riyadketami",
    "https://x.com/riyadketami",
    "https://t.me/riyadspeech"
  ]
}
```
Add LinkedIn to `sameAs` once the URL is known. Update `jobTitle` when the title is decided.

### 5.3 Social links (verified live 11 Oct 2026)
TikTok `@riyadketami` · Instagram `riyadketami` · Facebook `riyadketami` · YouTube `@RiyadKetami` · Threads `@riyadketami` · X `riyadketami` · Telegram `@riyadspeech` · LinkedIn `[MISSING]`. Substack is parked — do not link it.

### 5.4 Link hygiene
- Remove expired campaign links (old Linktree held Kimi K2.6, Kimi API bonus, Pollo, Emergent, Hostinger, Airia).
- Add UTM to ABB links: `?utm_source=ketami.net&utm_medium=referral&utm_campaign=site`.
- `mailto:` links also show the address as selectable text.

---

## 6. Visuals

### 6.1 Already made — copy from `~/Pictures/KETAMI-Brand-Kit/final/` into `public/brand/`
| ID | File | Use on site |
|---|---|---|
| A01 | `profile-picture_800.jpg` | Avatar, link-in-bio header, JSON-LD image |
| A02 | `og-image_1200x630.jpg` | Open Graph / Twitter card |
| A03 | `wordmark_light.png` / `wordmark_dark.png` | Header / footer (or rebuild as text) |
| A04 | `monogram_1024.png`, `favicon_512.png` | Favicons, app icons |
| A05 | `source_higgsfield-hero_2816x1584.png` (in the zip) | **Desktop hero** background — subject sits right, text left |
| A06 | `source_higgsfield-oran-plate_2816x1584.png` | Section background / contact band (darken 30–50%) |
| A07 | `source_higgsfield-vertical_1584x2816.png` | Mobile hero fallback, speaker page |
| A08 | `story-speaker-card_1080x1920.jpg` | Downloadable speaker card on a Talks/press page |

### 6.2 Missing — generate (flag each as a placeholder `[VISUAL Vxx]` until made)
Authenticity rules for every generation:
- Riyad's face only from his own reference photo; **Riyad approves every likeness before it ships.**
- Never depict a real named event, client, logo, product UI or crowd that didn't happen. Talks visuals are generic until real ECSEL footage replaces them (**real photos always win over AI**).
- Never let AI draw partner logos or maps used as data (Algeria map → build from real GeoJSON/SVG instead).
- No text inside generated images; all text is live HTML.

| ID | Slot | Size / ratio | Model (endpoint) | Ref image | Est. cost | Alt text |
|---|---|---|---|---|---|---|
| V01 | Mobile hero (portrait, room for text on top) | 3:4, 2k | `xai/grok-imagine-image-2.0` | headshot | ~$0.09 | Riyad Ketami, portrait at night in Oran |
| V02 | Card: AI explained in Darija | 4:3, 2k | `xai/grok-imagine-image-2.0` | headshot + studio_mic | ~$0.09 | Riyad recording an AI breakdown at his desk |
| V03 | Card: Launch partner in MENA | 4:3, 2k | `xai/grok-imagine-image-2.0` | headshot | ~$0.09 | Riyad filming a vertical video with a phone rig |
| V04 | Card: Talks and workshops (**placeholder until real ECSEL photos**) | 4:3, 2k | `xai/grok-imagine-image-2.0` | headshot | ~$0.09 | Riyad speaking on stage |
| V05 | About: OFFLINE / Oran daytime portrait | 3:2, 2k | `xai/grok-imagine-image-2.0` | headshot | ~$0.09 | Riyad on the Oran seafront |
| V06 | ABB section texture (no people, no map) | 16:9, 2k | `xai/grok-imagine-image-2.0` | — | ~$0.08 | (decorative, `alt=""`) |
| V07 | Hero ambient loop, 6 s, muted (optional) | 16:9, 1080p | `kling-video/v3.0-turbo/image-to-video` | A05 as `image_url` | ~$0.60 | (decorative, poster = A05) |

Prompts (English, paste as-is; brand colors are written in):

- **V01** — `Vertical 3:4 editorial portrait. The same man from the reference photo, identical face, beard and hair, black blazer over black t-shirt, waist-up, calm confident look at camera, placed in the lower 60% of the frame. Upper 40%: clean dark negative space, deep charcoal black (#111111) with faint out-of-focus Mediterranean night city bokeh and two thin horizontal signal-green (#00CD29) light lines. Thin green rim light on his right side, soft key light from the left. Premium minimal tech-founder look. No text, no logos.`
- **V02** — `The same man from the reference photos, identical face, beard and hair, wearing glasses and a black t-shirt, seated at a dark desk speaking into a black podcast microphone on a boom arm, laptop open in front of him with its screen glowing softly (screen content not readable). Dark charcoal studio (#111111), soft key light, thin signal-green (#00CD29) rim light from behind. Candid, mid-sentence, natural skin. Horizontal 4:3. No text, no logos, no brand marks on the microphone.`
- **V03** — `The same man from the reference photo, identical face, beard and hair, black t-shirt, holding a smartphone on a small handheld rig and filming himself in vertical format, slight smile, explaining something. Dark modern studio, charcoal black (#111111) background, ring of soft light on his face, thin signal-green (#00CD29) accent light on the edge of the frame. Horizontal 4:3. Screen not visible. No text, no logos.`
- **V04** — `The same man from the reference photo, identical face, beard and hair, black blazer over black t-shirt, speaking on a dark conference stage, one hand gesturing, seen from the audience at a slight low angle, out-of-focus silhouettes of an audience in the foreground, deep charcoal stage (#111111) with a single thin signal-green (#00CD29) light line behind him. Horizontal 4:3. No screens with text, no event names, no logos.`
- **V05** — `The same man from the reference photo, identical face, beard and hair, black t-shirt and dark jacket, walking along a Mediterranean seafront promenade in Oran, Algeria at golden hour, sea and hills with a hilltop fort softly out of focus behind him, candid documentary style, natural warm light balanced with deep shadows. Horizontal 3:2. No text, no logos.`
- **V06** — `Abstract dark texture, no people, no text, no map: deep charcoal black (#111111) surface with a subtle fine grid and a sparse network of thin signal-green (#00CD29) lines connecting small glowing nodes, like a quiet network diagram, heavy vignette, large empty area in the center-left. Minimal, premium.`
- **V07** — prompt: `Very subtle cinematic motion: city bokeh lights in the background twinkle and drift slowly, the thin green light lines shimmer, the man blinks once and breathes naturally, camera completely static. Keep his face identical.` — `duration: 6`, `resolution: 1080p`.

### 6.3 How to generate (two options; use whichever is available on this machine)

**Option A — `ketami-higgsfield` MCP (on Riyad's Mac).** Call `generate_image` with `model: "grok-imagine-2"`, `reference_images: ["/Users/mac/Pictures/KETAMI-Brand-Kit/ref/headshot.jpg"]` (add `/Users/mac/Pictures/KETAMI-Brand-Kit/ref/studio_mic.jpg` for V02), `settings: {"aspectRatio": "<ratio>", "resolution": "2k"}`. Run `estimate_cost` first. Outputs land in `~/Pictures/KETAMI Studio/<date>/`.

**Option B — Higgsfield REST API (curl).** Credentials come **only** from env vars `HF_API_KEY_ID` and `HF_API_KEY_SECRET` — never hard-code, print or commit them.
```bash
AUTH="Authorization: Key ${HF_API_KEY_ID}:${HF_API_KEY_SECRET}"
# 1) upload the reference photo -> public_url
curl -s -X POST https://api.higgsfield.ai/files/generate-upload-url -H "$AUTH" \
  -H 'Content-Type: application/json' -d '{"content_type":"image/jpeg"}'      # returns upload_url + public_url
curl -s -X PUT -H 'Content-Type: image/jpeg' --upload-file ref/headshot.jpg "<upload_url>"
# 2) estimate, then submit
curl -s -X POST https://api.higgsfield.ai/estimate/xai/grok-imagine-image-2.0 -H "$AUTH" \
  -H 'Content-Type: application/json' -d '{"prompt":"…","image_urls":["<public_url>"],"aspect_ratio":"3:4","resolution":"2k"}'
curl -s -X POST https://api.higgsfield.ai/xai/grok-imagine-image-2.0 -H "$AUTH" \
  -H 'Content-Type: application/json' -H "Idempotency-Key: $(uuidgen)" -d '{…same json…}'   # returns request_id
# 3) poll until completed, then download every "url" in the response
curl -s https://api.higgsfield.ai/requests/<request_id>/status -H "$AUTH"
```
Video (V07): `POST https://api.higgsfield.ai/kling-video/v3.0-turbo/image-to-video` with `{"prompt":"…","image_url":"<public_url of A05>","duration":6,"resolution":"1080p"}`.

Cost rule: estimate first; under $1 per request and $3 total → go; above → ask Riyad.

### 6.4 Post-processing every generated image
1. Riyad approves likeness (V01–V05).
2. Crop to slot; export WebP (q≈80) + JPEG fallback; widths 640/1280/1920 via `srcset`.
3. Darken backgrounds behind text until text contrast ≥4.5:1.
4. Save as `public/brand/V0x_<slot>.webp`; update the manifest status below.

### 6.5 Manifest status (keep this table updated)
| ID | Status | File | Approved by Riyad |
|---|---|---|---|
| V01 | placeholder (A07 stands in on mobile hero) | — | — |
| V02 | placeholder `[VISUAL V02]` on "What I do" card 1 | — | — |
| V03 | placeholder `[VISUAL V03]` on "What I do" card 2 | — | — |
| V04 | placeholder `[VISUAL V04]` on "What I do" card 3 (replace with real ECSEL photo when available) | — | — |
| V05 | placeholder `[VISUAL V05]` on /about | — | — |
| V06 | slot marked (`data-visual="V06"`, ABB section) | — | — |
| V07 | optional — slot marked on hero (poster = A05) | — | — |

---

## 7. `BRAND_AUDIT.md` format (Phase 1 output)

Start with a 5-line summary: overall fit (Fits / Partly / Doesn't fit), counts of P0/P1/P2, the 3 biggest problems.

Then one table per area — **Copy · Tokens & type · Layout & components · Imagery · Meta/SEO · Accessibility · Links** — with these columns:

| # | Severity | File:line | Current | Should be (cite § of this brief) | Fix |
|---|---|---|---|---|---|

Severity:
- **P0** — wrong identity or facts: retired phrases (§2.1), wrong city, follower counts, Moroccan Darija, wrong/missing title, broken or expired links, missing Person schema.
- **P1** — off-brand look: wrong colors/fonts, retired visuals (§3.4), Arabic without `dir="rtl"`, contrast failures, missing OG image.
- **P2** — polish: spacing, consistency, motion, image formats, minor copy.

End with:
- **Visuals needed** — every slot on the site with no on-brand image, mapped to a manifest ID (§6.2) or a new one (`V08+`, with slot, size, prompt draft and alt text).
- **Open questions for Riyad** — e.g. title decision, LinkedIn URL, ABB stats source, partner-logo permissions.

---

## 8. Open items (do not guess these)
- `[PENDING]` Title second word (§1).
- `[MISSING]` LinkedIn profile URL.
- `[VERIFY]` ABB stats and whether ABB can expose them live.
- `[VERIFY]` Permission to show partner names/logos (Moonshot/Kimi, MiniMax, Pollo AI, Higgsfield, Emergent).
- `[INFRA]` ketami.net DNS does not resolve today — Riyad points the domain to the host; the site must still build and preview locally.
