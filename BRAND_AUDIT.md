# BRAND_AUDIT — ketami.net vs KETAMI_BRAND_REVIEW.md v1.0

> Phase 1 (read-only). Audited 12 Oct 2026.
> **Code audited:** branch `claude/website-design-engineering-review-9fff9a` @ `4e3a9e9` (26 Jul 2026, the newest work: Brand Book v1.0 tokens + truth-pass). All `File:line` refs point at that commit.
> `origin/main` @ `afe5c8f` was spot-checked for the same P0s (see §0). The worktree branch itself (`dda24e4`) is older than both.
> Brief location: `~/Downloads/KETAMI_BRAND_REVIEW.md` (not yet in the repo).

## Summary

1. **Overall fit: Doesn't fit.** The site still sells the 2023 identity ("Builder. Creator. Entrepreneur." / "Digital entrepreneur · AI consultant · content creator" / "400K+ community"). Algeria Business Bay appears **nowhere**.
2. **Counts: 25 P0 · 43 P1 · 20 P2** (88 findings).
3. **Biggest problem #1:** Wrong identity everywhere it matters: hero, meta, OG image, Person JSON-LD, About and /links. 28 "400K+" hits, plus a live follower-count marquee (FollowerStrip) and count badges on /links.
4. **Biggest problem #2:** Invented proof is rendered on the site: 3 fabricated testimonials ("Sarah M.", "Karim B.", "Thomas L.", incl. "cut production time by 70%") on Home and Services, and an unverified "worked with teams across Europe, the Middle East, and North America" claim.
5. **Biggest problem #3:** Retired visual world: Matrix code rain on 6 pages, a portrait shown against Matrix code that dissolves into green glyphs, neon "AI brain" icons, glassmorphism on 20+ components, and green glow washes. The brand kit (A01–A08) isn't in `public/` yet.

---

## 0. Blocker: the codebase is split across branches

| Line | Commit | Date | What it has | What it lacks |
|---|---|---|---|---|
| `claude/website-design-engineering-review-9fff9a` | `4e3a9e9` | 26 Jul | Brand Book v1.0 tokens (#111111 / #00CD29, Space Grotesk), RK. mark, newsletter truth-pass | 18 commits from `origin/main` |
| `origin/main` | `afe5c8f` | 21 May | `/admin → /rk-studio`, admin overhaul (campaigns, analytics, AI usage, encrypted settings), `lib/json-ld.ts` (safe JSON-LD), `lib/seo.ts`, em-dash removal, most 400K copy removed | Brand Book tokens (still `#0A0B0D` / Inter), every Jul fix |
| `audit-fixes-2026-07` (main checkout) | `7314491` | 21 Jul | security/perf/a11y fixes on top of `dda24e4` | both of the above |
| local `main` / this worktree | `dda24e4` | — | common ancestor of the Jul branches | everything above |

The production DB already holds collections that only `origin/main` code writes (`campaigns`, `analyticsevents`, `aiusages`, `adminnotifications`). So Vercel production is very likely running `origin/main`.
**Both lines fail the brief on every P0 below.** (`origin/main` still has the testimonials, FollowerStrip, retired titles, a 3-link JSON-LD, and `links-defaults.ts:11-19` with tagline + `200K+/50K+/80K+` counts.)
→ Phase 2 needs one base. See Open question 1.

---

## 1. Copy

| # | Sev | File:line | Current | Should be (§) | Fix |
|---|---|---|---|---|---|
| C1 | P0 | `src/i18n/dictionaries/{en,fr,ar}.json:10-12` | Eyebrow "digital entrepreneur · ai consultant · content creator"; H1 "Builder. Creator. Entrepreneur."; sub "400K+ community across platforms…" | §2.3 Hero eyebrow / H1 (EN, FR) / Arabic line / sub | Replace verbatim; eyebrow from `BRAND` |
| C2 | P0 | `{en,fr,ar}.json:19-23` + `src/components/home/FollowerStrip.tsx:43-83` | "400K+ people are listening." + marquee of live follower counts per platform | §2.1: no follower counts | Delete FollowerStrip + `home.audience` keys |
| C3 | P0 | `{en,fr,ar}.json:26-27` | About teaser: "Digital entrepreneur building in the AI era." / "I create content for 400K+ people…" | §2.3 About | Replace with §2.3 About |
| C4 | P0 | `{en,fr,ar}.json:89-108`, rendered by `src/app/[lang]/page.tsx:53`, `src/app/[lang]/services/page.tsx:103` | 3 testimonials (Sarah M. "cut… by 70%", Karim B., Thomas L.) with no source | §0: never invent testimonials | Delete section and keys; put §2.3 "Trusted by AI teams" (text wordmarks) in its place |
| C5 | P0 | `{en,fr,ar}.json:118-124` (+ `about/page.tsx:20-21` uses them as `<title>`/description) | "Builder, creator, entrepreneur." / "Started in digital marketing… 400K+" | §2.3 About (4 lines) | Replace; About gets the manifesto line (§1) |
| C6 | P0 | `src/app/links/page.tsx:40-51` | DEFAULT_PROFILE tagline "Digital Entrepreneur · AI Consultant · Creator", counts `245K+ / 5K+ / 70K+` | `BRAND.title` + proof line; no counts | Read from `BRAND`; drop `count` |
| C7 | P0 | `src/app/links/_components/ProfileHeader.tsx:85-106` | Renders the count row (from DB `siteprofiles.socials.*.count` or the default above) | §2.1 | Remove count row; show icon links only |
| C8 | P0 | `{en,fr,ar}.json:249-251` (dead keys) | `links_page.bio` / `tagline` "400K+ community" | §2.1 (P0 "anywhere") | Delete dead keys |
| C9 | P0 | `{en,fr,ar}.json:51-63` (dead keys, SpeakingCTA was deleted) | "30+ Events · 3 Continents · 10K+ Live attendees" | §0: no invented numbers | Delete |
| C10 | P0 | `en.json:340-342` (`fr`/`ar` same index) | FAQ: "I've worked with teams across Europe, the Middle East, and North America." | Not in brief → `[VERIFY]` | Remove until Riyad confirms |
| C11 | P0 | `{en,fr,ar}.json:264-300`, rendered on Home via `src/components/home/ServicesSection.tsx:17` and `/services` | "AI Strategy Consulting / Workshop Facilitation / Keynote Speaking" | §2.3 "What I do": AI explained in Darija · Launch partner in MENA · Talks and workshops | Replace the 3 cards verbatim (eyebrow/title/body/link) |
| C12 | P0 | `src/app/[lang]/page.tsx:48-54` | No Quick links, Now strip, What I do, ABB, Trusted by, Contact block | §2.3 | Add sections (see L1) |
| C13 | P1 | `{en,fr,ar}.json:13-14` | CTAs "Work with me" → `/services`; "Read the blog" | §2.3 buttons + §2.2 naming | `Work with me` → mailto; `Join Algeria Business Bay` |
| C14 | P1 | `src/i18n/dictionaries/ar.json` (whole file, e.g. `:10-12`, `:119-123`) | Arabic locale is Modern Standard Arabic | §2.2: Darija for the Arabic lines (Algiers Darija, e.g. تاع، درك) | Darija rewrite; only the hero line is given (Open question 7) |
| C15 | P1 | `Hero.tsx:41-51` | No Arabic line in the hero (any locale) | §2.3 نخلّي الـAI يخدم البزنس تاعك، بالدارجة. | Add with `dir="rtl" lang="ar"` |
| C16 | P1 | `{en,fr,ar}.json:229-244`, `contact/page.tsx:43-82` | "Say something." No location | §2.3 Contact: riyad@ketami.net · Oran, Algeria · socials row | Add location + socials row |
| C17 | P1 | `src/lib/translate.ts:5-6` | AI translation prompt calls Riyad "an Algerian digital entrepreneur and AI consultant" / "North African digital entrepreneur"; AR prompt asks for MSA | §1 positioning, §2.2 Darija | Build prompt from `BRAND`; Darija rule for AR |
| C18 | P1 | `{en,fr,ar}.json:43-50` | Newsletter "AI strategies, digital business tactics, and creator insights" | Not in brief | Keep or cut? (Open question 8) |
| C19 | P1 | `{en,fr,ar}.json:290-299` | "Keynote Speaking… Book a keynote" | §2.2 "Invite me to speak" | Covered by C11 |
| C20 | P1 | `{en,fr,ar}.json:141-171` (dead: `/consulting` redirects) | Pricing $400 / $3,500 / $5,500/mo | Not in brief → `[VERIFY]` | Delete dead keys |
| C21 | P2 | `en.json:263`, `:280`; `fr.json:263`, `:280` | "No fluff, just results", "zero corporate fluff", "Sans bullshit" | §2.2 voice: proof over hype | Rewrite or drop |
| C22 | P2 | `{en,fr,ar}.json:125-134` | Skills: "Full-stack development, Team architecture, Growth operations" | Not in brief | Drop with About rewrite |
| C23 | P2 | `src/lib/constants.ts:5`, `src/lib/blog-categories.ts:3` | Blog category "Digital Marketing" | §2.1 old identity | Rename? Affects existing posts (Open question 15) |

## 2. Tokens & type

| # | Sev | File:line | Current | Should be (§) | Fix |
|---|---|---|---|---|---|
| T1 | P1 | `src/styles/tokens.css:11` | `--text-0: #F4F4EF` | `--paper #F2F2EE` (§3.1) | Update hex |
| T2 | P1 | `tokens.css:13` | `--text-2: #9A9A94` | `--muted #A3A39C` | Update hex |
| T3 | P1 | `tokens.css:8` (`:7` extra `#181818`) | `--bg-2: #1E1E1E` | `--panel #1A1A1A` | Update; fold `--bg-1` |
| T4 | P1 | `tokens.css:33-34` | `--border: rgba(244,244,239,.10)` | `--line #2A2A2A` | Update |
| T5 | P2 | `tokens.css:4-65` | Names `--bg-0/--matrix/--text-*` | `--ink --signal --paper --muted --panel --line` | Add brief names as primary; keep old as aliases to avoid a 100-file rename |
| T6 | P1 | `src/lib/fonts.ts:31-36`, `globals.css:27` | Montserrat (Latin) loaded as `--font-sans` | §3.2: Space Grotesk display/UI, JetBrains Mono labels | Remove Montserrat |
| T7 | P1 | `fonts.ts:56-69`, `globals.css:76-106` | Arabic = Cairo; IBM Plex Sans Arabic only as mono fallback at 300/400/700 | §3.2: Montserrat Arabic (licensed) → IBM Plex Sans Arabic 500/600 | IBM Plex Sans Arabic 500/600 as the Arabic face; drop Cairo |
| T8 | P1 | `fonts.ts:71-85`, `tailwind.config.ts:18-19`, `globals.css:195-198` | Aref Ruqaa + Permanent Marker "rule-breakers" | Not in §3.2 | Remove |
| T9 | P2 | `fonts.ts:27` | Space Grotesk 400/500/600/700 | 400/500/700 | Drop 600; map `font-semibold` → 500/700 |
| T10 | P2 | `globals.css:181` | h1/h2 `letter-spacing:-0.025em`; no `text-wrap` | `-0.02em`, `text-wrap: balance` | Update base layer |
| T11 | P2 | 25× `tracking-[0.2em]` eyebrows (e.g. `Hero.tsx:37`, `AboutTeaser.tsx:33`) | Lowercase `// label`, `.2em`, scrambled by `MatrixText` | §3.2/3.3: mono **uppercase**, `.12em` | One `<Eyebrow>` component; drop scramble |
| T12 | P1 | `tokens.css:48-49`, `globals.css:210-223` | `--glow-*`, `.glass`, `.glow-*` utilities | §3.4: no glassmorphism or glows | Delete utilities after L3/L4 |
| T13 | P1 | `src/components/home/HeroPortrait.tsx:60` | Hard-coded `rgba(10,11,13,…)` (old ink) | `--ink` | Goes with L2 |

## 3. Layout & components

| # | Sev | File:line | Current | Should be (§) | Fix |
|---|---|---|---|---|---|
| L1 | P0 | `src/app/[lang]/page.tsx:43-55` | Hero → FollowerStrip → Services → AboutTeaser → Newsletter → Testimonials → Blog | §2.3 order: Hero → Quick links → Now → What I do → ABB → Trusted by → About → Contact | Rebuild home; Blog/Newsletter placement per Open question 8 |
| L2 | P1 | `src/components/home/HeroPortrait.tsx:33-81`, `HeroCanvas.tsx` (all) | Matrix-background portrait that dissolves into green Arabic glyphs, green radial tint + glow ring | §3.3 green rim light, no green wash; §3.4 no Matrix | Replace with A05 (desktop) / V01→A07 (mobile) + thin green rules |
| L3 | P1 | `<MatrixRain>` at `Hero.tsx:30`, `NewsletterSection.tsx:37`, `about/page.tsx:48`, `services/page.tsx:126`, `contact/page.tsx:44`, `links/page.tsx:116` | Matrix code rain backgrounds | §3.4 retire | Remove; delete `MatrixRain.tsx` |
| L4 | P1 | `.glass` in 20+ files (`ui/Card.tsx:50`, `ui/Button.tsx:23`, `ui/BlogCard.tsx:39`, `ui/Testimonial.tsx:21`, `ui/LinkCard.tsx:30`, `home/ServicesSection.tsx:58`, `home/BlogTeaser.tsx:70`, `links/_components/Card.tsx:54`, `links/page.tsx:168`, `about/page.tsx:128`…), `ui/NavBar.tsx:56,128` | Glassmorphism + backdrop blur | §3.4 | Flat `--panel` + `1px --line` |
| L5 | P1 | `links/page.tsx:120-127`, `links/_components/ProfileHeader.tsx:47-59` (+pulse ring `links/page.tsx:130-138`), `ui/Card.tsx:26`, `services/ServiceCard.tsx:40`, `ui/PricingTier.tsx:37`, `about/page.tsx:83`, `not-found.tsx:14`, `error.tsx:20`, `home/AboutTeaser.tsx:28` | Radial glow washes, cursor sheens, glow shadows | §3.4 gradient washes / heavy shadows | Remove; one thin green rule as the only decoration |
| L6 | P1 | `ui/NavBar.tsx:61-69`, `ui/Footer.tsx:42-44`, `opengraph-image.tsx:49-55` | "RK." mark | §3.3/§4 wordmark `RIYAD KETAMI_` with green cursor underscore; monogram `RK_` | Conflicts with your 26 Jul "RK. stays" call (Open question 6) |
| L7 | P1 | `links/_components/LatestSection.tsx:18-21`, `home/ServicesSection.tsx:13`, `links/_components/ProfileHeader.tsx:81` (⚡) | Unicode glyphs/emoji as icons | §3.4 no emoji icons | lucide icons or none |
| L8 | P1 | `src/app/[lang]/about/page.tsx:38-98` | About hero = stock-style desk photo + Matrix texture + glowing portrait inset | §2.3 About, V05 | Rebuild around V05 / A01 |
| L9 | P1 | `src/app/links/page.tsx:73`, `SponsoredSection.tsx:19` | Up to 2 sponsored cards labelled `// sponsored` | §2.3: max 1, labelled `PARTNER`; ABB always first; max 5 links | Cap at 1, label `PARTNER`, pin ABB first |
| L10 | P2 | `NewsletterSection.tsx:38`, `about/page.tsx:140`, `services/page.tsx:127`, `contact/page.tsx:63`, `home/LinksSection.tsx:38` | Centered blocks repeated down the page | §3.4 centered-everything | Left-align, grid-based |
| L11 | P2 | `home/ProductsSection.tsx`, `home/LinksSection.tsx`, `ui/PricingTier.tsx`, `[lang]/consulting/page.tsx` | Dead components/route with retired copy | — | Delete |
| L12 | P2 | `ui/ParallaxLayer.tsx` used in `AboutTeaser.tsx:18`, `BlogTeaser.tsx:19`, `ServicesSection.tsx:22` | Parallax faint-image backgrounds | §3.5 / §3.4 | Remove with imagery |

## 4. Imagery (`public/`)

| # | Sev | File | Current | Should be (§) | Fix |
|---|---|---|---|---|---|
| I1 | P1 | `public/portraits/portrait-hero.png` (2048×3602, 8.3 MB) — hero, About inset, /links avatar, /links OG | Portrait in front of falling Matrix code | §3.4 / A01, A05 | Replace with A01 (avatar), A05 (hero); delete |
| I2 | P1 | `public/images/matrix-bg-about.png` | Matrix code-rain texture | §3.4 | Delete |
| I3 | P1 | `public/images/section-ai.png` (unused) | Hologram "AI brain" with baked-in text | §3.4 stock AI brain; §6.2 no text in images | Delete |
| I4 | P1 | `public/icons/icon-{ai,workshop,speaking,newsletter}.png` (`ServiceCard.tsx:10-12`) | Neon-outlined icons incl. circuit brain | §3.4 neon / AI brain | Delete; V02–V04 on cards |
| I5 | P1 | `public/images/consulting-visual.png` (`about/page.tsx:73`) | AI image of a man at a desk; likeness not approved | §6.2 Riyad approves every likeness | Replace with V05; delete |
| I6 | P1 | `public/images/section-consulting.png` (`ServicesSection.tsx:25`), `section-content.png` (unused) | AI Riyad-likeness among Matrix monitors | §3.4 + likeness rule | Delete |
| I7 | P2 | `public/images/section-blog.png`, `workspace-bg.png` | Generic network / laptop textures at 5–8% opacity | §3.3 thin green lines are the only graphic | Delete |
| I8 | P1 | `src/app/[lang]/layout.tsx:55` | `<link rel="preload">` of the raw 8.3 MB PNG on every page (bypasses next/image) | §3.5 WebP/AVIF, sized | Remove; let `next/image priority` handle it |
| I9 | P2 | all `public/**/*.png` (1.3–1.9 MB each) | PNG only | §3.5 WebP/AVIF + JPEG fallback, srcset 640/1280/1920 | Re-export kit assets |
| I10 | P1 | `public/brand/` | Doesn't exist; A01–A08 not placed | §6.1 | Step 3 copy |

## 5. Meta / SEO

| # | Sev | File:line | Current | Should be (§) | Fix |
|---|---|---|---|---|---|
| M1 | P0 | `src/app/layout.tsx:17-19` | `<title>` default "Riyad Ketami", template "%s \| Riyad Ketami" | §5.1 "Riyad Ketami — AI Expert & Co-founder, Algeria Business Bay" | From `BRAND` |
| M2 | P0 | `layout.tsx:21`, `:27`, `:32`, `:37` | Description/OG/Twitter: "Digital entrepreneur, AI consultant, and content creator with a 400K+ community"; keywords "digital entrepreneur, content creator" | §5.1 meta description | From `BRAND` |
| M3 | P0 | `layout.tsx:26`, `:31` | OG/Twitter title "Riyad Ketami: Builder. Creator. Entrepreneur." | §5.1 | From `BRAND` |
| M4 | P0 | `src/app/[lang]/page.tsx:16-19` | Home title "Builder. Creator. Entrepreneur.", desc "400K+ community" | §5.1 | From `BRAND` |
| M5 | P0 | `src/app/[lang]/page.tsx:21-33` | Person JSON-LD: jobTitle "Digital Entrepreneur & AI Consultant", desc "400K+", url riyadketami.com, 3 `sameAs` | §5.2 exact block: worksFor ABB, address Oran/DZ, image, email, knowsLanguage, 7 sameAs | Generate from `BRAND`; serialize safely (`origin/main` `lib/json-ld.ts`) |
| M6 | P0 | `src/app/opengraph-image.tsx:1-104` | Generated OG: "// builder · creator · entrepreneur", "400K+ community", gradient + glow, "riyadketami.com" | §5.1 A02 `og-image_1200x630.jpg` | Delete route; static A02 via metadata |
| M7 | P0 | `src/app/links/layout.tsx:3-27` | "Digital Entrepreneur · AI Consultant · Creator. 400K+ community."; OG image = 8.3 MB Matrix portrait; `twitter:card=summary` | §5.1 | From `BRAND`; A02; `summary_large_image` |
| M8 | P0 | `layout.tsx:22`, `robots.ts:12`, `sitemap.ts:5`, `[lang]/page.tsx:25`, `[lang]/blog/[slug]/page.tsx:24,52`, `links/layout.tsx:11,14,25`, `opengraph-image.tsx:90`, `lib/rss-fetcher.ts:18` | Canonical domain `riyadketami.com` | §5.2 `https://ketami.net` | `BRAND.url`. `[INFRA]` ketami.net doesn't resolve yet (checked today) |
| M9 | P1 | `layout.tsx:34-36` | `icons: '/favicon.ico'`, but the file doesn't exist (404); no apple-touch / 192 / 512 | §4 | Generate from A04 `favicon_512.png` |
| M10 | P1 | `layout.tsx:24` | `og:type=website` | §5.1 `profile` | Update |
| M11 | P2 | `src/app/[lang]/layout.tsx:18-21` | hreflang suffix parsed from `next-url` header (brittle) | §5.1 hreflang | Per-page path (`origin/main` `lib/seo.ts`) |
| M12 | P2 | `src/lib/resend.ts:4` | Default FROM `noreply@riyadketami.com` | ketami.net | Needs Resend domain verification (Open question 10) |

## 6. Accessibility

| # | Sev | File:line | Current | Should be (§) | Fix |
|---|---|---|---|---|---|
| A1 | P1 | `src/components/ui/MatrixText.tsx` (all eyebrows) | Text scrambles through random glyphs on view; screen readers may catch mid-scramble | §3.5, §3.4 | Static eyebrow (T11) |
| A2 | P1 | `FollowerStrip.tsx:22`, `ui/BlogCard.tsx:29`, `[lang]/blog/[slug]/page.tsx:67` | Arabic dates formatted with `ar-MA` (Morocco) | §2.1 Algerian, not Moroccan | `ar-DZ` |
| A3 | P1 | new hero Arabic line, quick-link "القناة", "AI بالدارجة" eyebrow | Not present yet | §3.2 every Arabic run `dir="rtl" lang="ar"` | One `<Ar>` wrapper that always sets both |
| A4 | P2 | `ui/Footer.tsx:67-78`, `home/Hero.tsx:67-78` | 10px social abbreviations, no padding (≈14×12 px targets) | §3.5 ≥44px | 44px hit area; real icons + `aria-label` |
| A5 | P2 | `ui/NavBar.tsx:88` | Desktop nav links `py-1.5` (≈32px tall) | §3.5 ≥44px | `min-h-[44px]` |
| A6 | P2 | `ui/ParallaxLayer.tsx:26`, `home/HeroPortrait.tsx:16-26` | Scroll-linked motion keeps running under reduced motion (`MotionConfig reducedMotion="user"` doesn't stop `style` motion values) | §3.5 disable parallax | Check `useReducedMotion()`, render static |
| A7 | P2 | `HeroPortrait.tsx:42`, `about/page.tsx:86`, `ProfileHeader.tsx:63` | `alt="Riyad Ketami"` | Manifest alt text (§6) | Alt text per asset in `BRAND` |
| A8 | P2 | `Hero.tsx:73` | `aria-label={s.platform}` → "tiktok" | Proper names | Use label map |

Focus ring passes (`globals.css:150-153`: `outline 2px solid var(--accent)`). Paper and muted text on ink pass contrast. The primary button uses ink on green (`text-bg-0`), which passes.

## 7. Links

| # | Sev | File:line | Current | Should be (§) | Fix |
|---|---|---|---|---|---|
| K1 | P0 | site-wide | No link to Algeria Business Bay anywhere | §2.3, §5.2 | See "Where ABB is missing" |
| K2 | P0 | `src/components/ui/Footer.tsx:19` | LinkedIn `linkedin.com/in/riyadketami` (guessed; brief says unknown) | §5.3 `[MISSING]` | Remove until confirmed |
| K3 | P0 | `src/app/links/page.tsx:56-79` → MongoDB `linkcards` | DB-driven sponsored/resource/service cards; **could not inspect**: Atlas `Cluster0` SRV record gone (paused again) | §5.4 remove expired Kimi K2.6, Kimi API bonus, Pollo, Emergent, Hostinger, Airia | Resume Atlas → I audit cards → deactivate expired |
| K4 | P0 | `src/app/[lang]/page.tsx:28-32` | `sameAs` has 3 of 7 profiles | §5.2 | From `BRAND.socials` |
| K5 | P1 | `src/components/ui/Footer.tsx:15-21` | 5 socials (TK/IG/YT/LI/X); no Facebook, Threads or Telegram; non-canonical URLs (`tiktok.com`, `youtube.com/@riyadketami`, `instagram.com/riyadketami`) | §5.3 exact list | From `BRAND.socials` |
| K6 | P1 | `src/components/home/Hero.tsx:55` | "Work with me" → `/services` | §2.3 `mailto:riyad@ketami.net` | Update |
| K7 | P1 | site-wide | Telegram `t.me/riyadspeech` not linked | §2.3 quick link 2, §5.3 | Add |
| K8 | P1 | `Hero.tsx:64-81`, `home-data.ts:49-64` | Hero socials row comes from DB `socialaccounts` (with `follower_count`) | §5.3 static verified list | Static from `BRAND`; stop querying counts on public pages |
| K9 | P1 | new ABB links | — | §5.4 UTM `?utm_source=ketami.net&utm_medium=referral&utm_campaign=site` | Bake into `BRAND.links.abb` |
| K10 | P2 | `contact/page.tsx:68-77` | mailto shows the address as text ✔ | §5.4 | Keep pattern for the new Contact block |

No Substack links found ✔.

---

## Where ABB is missing (every slot the brief requires)

| Slot | Brief | Where it goes |
|---|---|---|
| Hero eyebrow | §2.3 `AI EXPERT · CO-FOUNDER, ALGERIA BUSINESS BAY · ORAN, ALGERIA` | `Hero.tsx:35-38` |
| Proof line under the title | §1 "Co-founder, Algeria Business Bay" | Hero, /links header, About |
| Hero sub | §2.3 "Co-founder of Algeria Business Bay…" | `Hero.tsx:47-51` |
| Hero 2nd button | §2.3 `Join Algeria Business Bay` | `Hero.tsx:57-59` (now "Read the blog") |
| Quick links #1 | §2.3 | New Quick links block (home) + `/links` first card |
| Now strip | §2.3 "Building Algeria Business Bay" | New |
| ABB section | §2.3 copy + 3 stats `[VERIFY]` + "Become a member" | New section, light `--paper` background |
| About | §2.3 "Today I build Algeria Business Bay with Larbi…" | `about/page.tsx`, `AboutTeaser.tsx` |
| `<title>` / meta / OG | §5.1 | `layout.tsx:17-38`, `[lang]/page.tsx:16-19`, `links/layout.tsx` |
| Person JSON-LD `worksFor` | §5.2 | `[lang]/page.tsx:21-33` |
| OG image | §6.1 A02 | replaces `opengraph-image.tsx` |
| Footer | (consistency) | `Footer.tsx` link row |

## Every place the title / identity line appears → `BRAND.title`

| File:line | Text today |
|---|---|
| `src/app/layout.tsx:18-19` | title default / template |
| `src/app/layout.tsx:21, 26-27, 31-32, 37` | description, OG + Twitter title/desc, keywords |
| `src/app/[lang]/page.tsx:17-18` | home `metadata.title` / description |
| `src/app/[lang]/page.tsx:26-27` | JSON-LD `jobTitle` / `description` |
| `src/app/opengraph-image.tsx:4, 68, 82-83` | OG alt, eyebrow, sub |
| `src/app/links/layout.tsx:4, 6, 9-10, 23-24` | /links title, desc, OG, Twitter |
| `src/app/links/page.tsx:42` | DEFAULT_PROFILE tagline |
| `{en,fr,ar}.json:10-11` | `home.eyebrow`, `home.headline` |
| `{en,fr,ar}.json:26` | `home.about_teaser.title` |
| `{en,fr,ar}.json:118-120` | `about.eyebrow`, `about.headline` (also the About `<title>`), `about.subheadline` |
| `{en,fr,ar}.json:250` | `links_page.bio` (dead) |
| `src/lib/translate.ts:5-6` | AI translation system prompts |
| MongoDB `siteprofiles.tagline` (`links-profile`) | likely the same old tagline; overrides the code default on /links. Couldn't read (Atlas paused) |
| `origin/main` only: `src/lib/links-defaults.ts:11` | same tagline |

Plan: `src/lib/brand.ts` exports `BRAND = { title, proofLine, tagline, positioning, url, email, location, links, socials, abb }`. The `[PENDING]` swap is one line: `title: 'AI Expert'`.

---

## Visuals needed

| Slot on site | Today | Manifest ID | Interim (until made/approved) |
|---|---|---|---|
| Desktop hero background | `portrait-hero.png` (Matrix) + glyph canvas | **A05** (exists) | — |
| Mobile hero | same | **V01** | A07 `source_higgsfield-vertical` |
| Card: AI explained in Darija | neon brain icon / glyph `◈` | **V02** | `[VISUAL V02]` placeholder |
| Card: Launch partner in MENA | neon icon / `◉` | **V03** | `[VISUAL V03]` |
| Card: Talks and workshops | neon mic icon / `◧` | **V04** (→ real ECSEL photo) | `[VISUAL V04]` |
| About hero | `consulting-visual.png` + Matrix texture + portrait inset | **V05** | A01 portrait |
| ABB section texture | none | **V06** | flat `--paper` |
| Hero ambient loop (optional) | — | **V07** | poster = A05 |
| Avatar, /links header, JSON-LD image | `portrait-hero.png` | **A01** (exists) | — |
| OG / Twitter card (site + /links) | generated `opengraph-image.tsx` | **A02** (exists) | — |
| Header/footer wordmark | "RK." text | **A03** or live text | — |
| Favicons / app icons | missing (404) | **A04** (exists) | — |
| Contact band background | none | **A06** (exists) | — |
| Speaker card download (Services/Talks) | none | **A08** (exists) | — |

No V08+ needed. The blog keeps post cover images from the CMS, and every other slot maps to an existing ID.

---

## Open questions for Riyad

1. **Base branch (blocker).** Which line should Phase 2 build on? My recommendation: start from `4e3a9e9` (Brand Book tokens), merge `origin/main` into it first as its own commit (keep `origin/main` for admin/`rk-studio`/`json-ld`/`seo`, and the July branch for public UI/tokens), then do the brand work on top. The alternative is to apply the brand work directly onto `origin/main`.
2. **Title second word** `[PENDING]`: live default "AI Expert" + "Co-founder, Algeria Business Bay" until you decide.
3. **LinkedIn URL** `[MISSING]`: the footer currently links a guessed `/in/riyadketami`. Remove it until you send the real one?
4. **ABB stats** `[VERIFY]`: 233 / 69 / 101. Hard-code with a visible `[VERIFY]` tag, or does ABB expose them (API/JSON) so we pull them live?
5. **Partner names** `[VERIFY]`: OK to show "Moonshot AI · Kimi — MiniMax — Pollo AI — Higgsfield — Emergent" as text before permission is confirmed, or hide the block until then?
6. **Wordmark:** on 26 Jul you said "RK." stays. The brief (§3.3/§4) specifies `RIYAD KETAMI_` and the `RK_` monogram. Which wins: header `RIYAD KETAMI_` with `RK_` only as favicon, or keep `RK.`?
7. **Arabic locale:** the whole `/ar` site is MSA today. Should I draft it in Algiers Darija for your review, or ship only the brief's hero line and leave the rest for you?
8. **Not in the brief:** newsletter section, blog teaser, `/services` page (process + FAQ), dead pricing tiers. Keep, move or cut? (I'd keep Blog + Newsletter below Contact and fold `/services` into the "What I do" cards.)
9. **Missing link targets:** "Request the media kit →" (URL or PDF?), "Invite me to speak →" (mailto with subject?), "This week's tool" `[sponsor URL]`, ECSEL 26 (link/date or text only?).
10. **Email sender:** switch Resend FROM to `@ketami.net`? That needs domain verification in Resend first. Keep the current default until then?
11. **Atlas is paused again:** `_mongodb._tcp.cluster0.ymz81pe.mongodb.net` has no SRV record today. Please hit **Resume** in Atlas so I can audit the `/links` cards for expired campaigns (K3) and so `/links` renders locally.
12. **Montserrat Arabic:** do you have the licensed webfont file to self-host? If not, I'll use IBM Plex Sans Arabic 500/600 as the brief says.
13. **Testimonials:** do any real, attributable quotes exist? If not, the section goes and "Trusted by AI teams" takes its place.
14. **Brief in repo:** may I commit `KETAMI_BRAND_REVIEW.md` to the project root so future sessions read the same source of truth?
15. **Blog category "Digital Marketing":** rename (e.g. "Marketing & AI") or keep? Existing posts in the DB use the slug.

---

## Changelog — Phase 2 (12 Oct 2026)

Branch `claude/ketami-brand-audit-update-0218ac`. Not pushed, not deployed.

### Base (Open question 1)
Rebuilt on **`origin/main` (afe5c8f)** with the five July commits cherry-picked on top (`dcf0377`…`7f912fb`), followed by `2967011` to reconcile them. This replaces the 73-file merge with a linear history and keeps both lines:
- From `origin/main`: `/rk-studio` admin, campaigns/analytics, `lib/json-ld.ts`, `lib/seo.ts`.
- From the July branch: Brand Book tokens, Radix a11y, MotionConfig, and the newsletter fixes (re-subscribe, Kit sync on import, server-side CSV).

The three newsletter API routes were merged by hand. The rest of `audit-fixes-2026-07` was not brought over, except its ESLint config fix (`2a4fae0`).

### Commits
| Commit | Area | Fixes |
|---|---|---|
| `22c5c38` | docs | Brief + this audit committed to the repo root (Q14) |
| `2e06a40` | tokens | T1–T13 — brief colour tokens (legacy names alias them); Space Grotesk / JetBrains Mono / IBM Plex Sans Arabic 500/600 only; headings -0.02em + balance; `.glass`/`.glow` flattened; ink-on-signal button, no glow; reduced motion stops CSS animation |
| `7bef4e3` | assets | I10 — A01–A08 in `public/brand/` (A05–A07 re-encoded to JPEG q88, ~300 KB each); M9 — favicon.ico 16/32/48, icon 512, apple-icon 180, icon-192/512 |
| `2a4fae0` | tooling | `npm run lint` no longer crashes (FlatCompat → native flat config) |
| `761ac43` | copy | C1–C23, L1, K1, K2, K4–K9, A2, A3 — one `BRAND` constant (`src/lib/brand.ts`); §2.3 copy; home in brief order; About/Services/Contact/links rebuilt; testimonials, follower counts, invented stats, unverified FAQ claim removed |
| `b13742f` | meta | M1–M12 — §5.1 title/description, OG `profile` + A02 card, §5.2 Person JSON-LD (7 sameAs, worksFor ABB), ketami.net everywhere, manifest |
| `2f813c4` | layout | L2–L12, I1–I9, A4–A6 — `RIYAD KETAMI_` wordmark, solid header, flat menu, Matrix/parallax/glow components and retired images deleted, robots.txt 500 fixed |

### Decisions taken with "approved" (open questions not answered)
| Q | Default applied | Swap |
|---|---|---|
| 2 Title | `AI Expert` + proof line | `TITLE` in `src/lib/brand.ts` (one line) |
| 3 LinkedIn | Removed from footer; quick link shows `[MISSING: LinkedIn URL]` | `BRAND.linkedinUrl` |
| 4 ABB stats | 233 / 69 / 101 hard-coded with a visible `[VERIFY with ABB before launch]` | `BRAND.abb.stats` (`verified: true` hides the flag) |
| 5 Partners | Names shown as text with a visible `[VERIFY permission…]` | `BRAND.partners` |
| 6 Wordmark | Brief wins: `RIYAD KETAMI_` in header/footer, `RK_` monogram as favicon (supersedes July "RK.") | `components/ui/Wordmark.tsx` |
| 7 Arabic | Whole `/ar` locale drafted in Algiers Darija (تاع، درك، راني; no ديال/دابا) — **needs Riyad's read** | `src/i18n/dictionaries/ar.json` |
| 8 Extras | Blog teaser + newsletter kept below Contact; `/services` = "What I do" + A08 speaker card + process + FAQ; pricing keys deleted | — |
| 9 Link targets | Media kit `[MISSING]`; "Invite me to speak" → `mailto:` with subject; sponsor slot `[MISSING: sponsor URL]`; ECSEL 26 text only | `BRAND.mediaKitUrl`, `BRAND.partnerLink` |
| 10 Sender | Resend FROM stays `noreply@riyadketami.com` until ketami.net is verified | env `FROM_EMAIL` |
| 12 Arabic font | IBM Plex Sans Arabic 500/600 (no licensed Montserrat Arabic file) | `src/lib/fonts.ts` |
| 13 Testimonials | Removed; "Trusted by AI teams" in its place | — |
| 15 Blog category | "Digital Marketing" left as is (existing posts use the slug) | `lib/constants.ts` |

Copy-provenance note: EN is verbatim §2.3; FR H1 and the Arabic hero line are verbatim; all other FR and AR are translations and need review. Brand lines (title, proof line, tagline, manifesto, eyebrow) stay in English in every locale so the title swap stays one line.

### Verified
- `tsc --noEmit` clean; `next build` exit 0 (80 pages) with Atlas paused
- Dev preview: `/en /fr /ar`, about, services, contact, blog, `/links`, robots, sitemap, manifest all 200; no console errors; 375px has no horizontal scroll
- Rendered `<head>` matches §5.1; JSON-LD matches §5.2 field for field

### Still open
- **K3** — Atlas is paused, so the `/links` DB cards are unaudited. Sponsored/resource/service cards are not rendered until then
- **V01–V07** — placeholders on site; generation waits for cost approval (Step 3)
- Pre-existing, out of scope: 26 lint errors in admin/API code from `origin/main` (mostly `react-hooks/set-state-in-effect`); Next 16 `middleware` → `proxy` rename; the rk-studio newsletter page doesn't show the July "unsubscribed" badge
- The blog-translation prompt still asks for MSA in Arabic posts (editorial call)
