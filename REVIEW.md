# Design-Engineering Review — riyadketami.com

> Reviewed 2026-07-25 against Emil Kowalski-style animation standards, curated library picks,
> Apple HIG motion principles, and design-engineering craft criteria.
> **Note:** the `emilkowalski` skill files (pick-ui-library, review-animations, improve-animations,
> find-animation-opportunities, apple-design, emil-design-eng, animation-vocabulary) are not
> installed in this environment; the equivalent methodology was applied manually. Read-only review —
> no source files were modified.

---

## 1. Executive summary — the 5 things that matter most

1. **No global reduced-motion support for Framer Motion.** Only the two canvases check
   `prefers-reduced-motion`. Every `motion.*` component (Reveal, PageTransition, Dialog, Toast,
   tilt cards, marquee, scramble text) ignores it. One-line fix: `<MotionConfig reducedMotion="user">`
   in the root layout, plus a CSS guard for the marquee/pulse-ring keyframes. This is an
   accessibility ship-blocker.

2. **`mode="wait"` is killing perceived speed in two places.** `PageTransition.tsx` inserts a
   ~250 ms blank gap on every navigation (compounded by global `scroll-behavior: smooth`, which
   animates the scroll-to-top on route change), and `Tabs.tsx` makes every tab switch a
   400 ms exit-then-enter sequence. Both violate interruptibility: the UI locks you out while it
   finishes its choreography.

3. **The entrance-reveal system is ~2× too slow and too far.** `Reveal` defaults to a 600 ms,
   32 px slide-up; hero content finishes arriving ~850 ms after load. Emil's standard for content
   reveals: 300–500 ms, 12–20 px offset, stagger ≤ 80 ms. The site currently reads "template
   showing off" instead of "fast product".

4. **Real correctness bugs in motion code.** `Card.tsx` calls a hook conditionally inside JSX
   (React rules violation) and its glow layer references `group-hover` with no `group` parent, so
   the glow can never appear. `InlineDeleteConfirm.tsx` uses `animate-in fade-in slide-in-from-right-2`
   classes from a plugin that isn't installed (verified: no `tailwindcss-animate`/`tw-animate-css`
   in the tree) — silent no-ops. `Marquee.tsx` imports four things it never uses and has a visible
   seam-jump at the loop point.

5. **Hand-rolled primitives should be libraries.** Toast (no stacking animation, no hover-pause,
   no swipe), Dialog (no focus trap, no focus return), Tabs (no arrow-key navigation — fails the
   WAI-ARIA tabs pattern), and the language dropdown (no typeahead/focus management) are all solved
   problems: Sonner, Radix/Base UI, and NumberFlow (for `Counter`) would delete ~400 lines and fix
   the a11y gaps for free.

Also worth saying: a lot here is genuinely good. Scroll-scrubbed hero dissolve (`HeroPortrait`)
is properly scroll-driven and interruptible; `HeroCanvas` has real spring physics with a
reduced-motion path; the token system exists and is mostly obeyed; the canvases pause on
`visibilitychange`; touch targets and skip-links are handled. The foundation is solid — the gap
is in tuning, interruption, and finish.

---

## 2. Ship-blockers

### SB-1 · No `prefers-reduced-motion` for any Framer Motion animation
- **Files:** [src/app/layout.tsx](src/app/layout.tsx) (root), every `motion.*` component
- **Rule:** motion must be disableable; vestibular-safety is non-negotiable.
- **Current:** only [MatrixRain.tsx:34](src/components/ui/MatrixRain.tsx:34) and
  [HeroCanvas.tsx:49](src/components/home/HeroCanvas.tsx:49) check the media query.
- **Corrected:** wrap the app in `<MotionConfig reducedMotion="user">` (framer-motion export).
  Add to `globals.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    .animate-marquee { animation-play-state: paused; }
    /* pulse-ring keyframe in links/page.tsx — guard the same way */
  }
  ```

### SB-2 · `Card.tsx` — conditional hook call + glow that can never render
- **File:** [Card.tsx:48-58](src/components/ui/Card.tsx:48)
- **Rule violated:** React Rules of Hooks — `useTransform` is invoked inside the
  `{glow && (...)}` JSX branch (line 52). If `glow` ever changes between renders, hook order
  breaks and React throws.
- **Also:** line 50 uses `group-hover:opacity-100`, but the parent `motion.div` (line 46) has no
  `group` class — the glow layer is permanently `opacity-0`.
- **Current:** `style={{ background: useTransform([glowX, glowY], ...) }}` inside the conditional;
  `className="glass rounded-[var(--radius-lg)] relative overflow-hidden ..."` (no `group`).
- **Corrected:** hoist `const glowBg = useTransform([glowX, glowY], ([x, y]) => ...)` above the
  return; add `group` to the parent class list. (Component is currently only mounted on
  `/design-system`, so severity is latent — but it's exported from `ui/index.ts` as a primitive.)

### SB-3 · `Tabs.tsx` — keyboard navigation missing (fails WAI-ARIA tabs pattern)
- **File:** [Tabs.tsx:27-52](src/components/ui/Tabs.tsx:27)
- **Rule:** `role="tablist"` implies arrow-key roving focus (←/→, Home/End) and
  `tabIndex={-1}` on inactive tabs.
- **Current:** plain `onClick` buttons; every tab is in the tab order; no keydown handling.
- **Corrected:** either implement roving tabindex, or adopt Radix UI / Base UI Tabs (see §6).

### SB-4 · Dead animation classes in admin
- **File:** [InlineDeleteConfirm.tsx:27](src/components/admin/InlineDeleteConfirm.tsx:27)
- **Current:** `animate-in fade-in slide-in-from-right-2 duration-150` — these classes come from
  `tailwindcss-animate` / `tw-animate-css`, neither of which is installed (`npm ls` returns empty).
  The confirm strip appears with a hard cut; `duration-150` alone does nothing without a transition.
- **Corrected:** either `npm i tw-animate-css` and add `@import "tw-animate-css";` to globals.css,
  or replace with a 150 ms opacity/transform transition keyed on mount. Pick one; don't ship
  no-op classes.

### SB-5 · `<Link><Button/></Link>` nests a `<button>` inside an `<a>`
- **Files:** [Hero.tsx:56-65](src/components/home/Hero.tsx:56), [ProductsSection.tsx:51-55](src/components/home/ProductsSection.tsx:51), [about/page.tsx:64-68](src/app/[lang]/about/page.tsx:64), [ServiceCard.tsx:147-151](src/components/services/ServiceCard.tsx:147), [PricingTier usage]
- **Rule:** interactive elements must not nest (invalid HTML; screen readers announce twice;
  Enter/Space behavior diverges).
- **Corrected:** give `Button` a real `as="a"`/`asChild` path (the prop exists at
  [Button.tsx:14](src/components/ui/Button.tsx:14) but is never implemented — `as` and `href` are
  accepted and silently dropped) and render `motion.a` when `href` is present.

---

## 3. High-leverage fixes (with implementation plans)

Ordered by leverage. Each plan is self-contained and can be handed to another engineer/model
with zero additional context.

---

### PLAN 1 — Global motion hygiene (reduced motion, smooth scroll, reveal tuning)

**Why first:** touches every page; biggest perceived-speed win per line changed.

**Context for implementer:** Next.js 16 App Router site, framer-motion 12, Tailwind v4.
Design tokens live in `src/styles/tokens.css`. All entrance animations flow through
`src/components/ui/Reveal.tsx`, which is used ~40× across home/about/blog/contact pages.

**Steps:**
1. `src/app/layout.tsx` — import `MotionConfig` from `framer-motion`; wrap the `<body>` children:
   `<MotionConfig reducedMotion="user">{children}</MotionConfig>`.
2. `src/app/globals.css:47` — delete `scroll-behavior: smooth;` from the `html` rule. Re-add it
   scoped so it only applies to intra-page anchor jumps and motion-tolerant users:
   ```css
   @media (prefers-reduced-motion: no-preference) {
     html:focus-within { scroll-behavior: smooth; }
   }
   ```
   (The `:focus-within` trick keeps anchor/skip-link jumps smooth but prevents animated
   scroll-to-top on route change.)
3. `src/components/ui/Reveal.tsx:18-31` — retune defaults:
   - `up: { y: 32 }` → `up: { y: 16 }` (and mirror: `down: -16`, `left/right: ±16`)
   - `duration = 0.6` → `duration = 0.45`
   - keep ease `[0.16, 1, 0.3, 1]` (ease-out-quint — correct for entrances; it matches
     `--ease-out` in tokens.css).
4. Delay audit — the stagger step is fine (80 ms) but caps are missing. In
   [Hero.tsx:35-86](src/components/home/Hero.tsx:35) the last item waits 320 ms + 450 ms = 770 ms.
   Acceptable after step 3; do not increase further. In [about/page.tsx:130](src/app/[lang]/about/page.tsx:130)
   the skills grid uses `delay={0.05 + i * 0.05}` over up to ~9 items (max 500 ms) — cap the
   index: `delay={0.05 + Math.min(i, 5) * 0.05}`.
5. `src/app/links/page.tsx:128-133` — wrap the `pulse-ring` keyframe usage
   ([ProfileHeader.tsx:57](src/app/links/_components/ProfileHeader.tsx:57)) in a
   reduced-motion media query.

**Acceptance:** with macOS "Reduce Motion" on, no element translates/scales anywhere on the site
(fades allowed via MotionConfig's behavior); route changes no longer animate scroll position;
hero fully settled ≤ 800 ms after first paint.

---

### PLAN 2 — Remove the blocking page transition; fix tab switching

**Context:** `src/components/ui/PageTransition.tsx` wraps all `[lang]` pages via
[layout.tsx:64](src/app/[lang]/layout.tsx:64). It uses `AnimatePresence mode="wait"` keyed on
pathname: old page fades out 250 ms, *then* new page fades in — a guaranteed blank frame plus a
250 ms tax on every navigation. In the App Router the exiting tree is a stale snapshot, and
combined with smooth scroll it produces the classic "scroll jumps while both pages animate" jank.

**Steps (option A — recommended, delete it):**
1. Delete `src/components/ui/PageTransition.tsx`; remove the export from
   [ui/index.ts](src/components/ui/index.ts) and the wrapper at
   [src/app/[lang]/layout.tsx:64](src/app/[lang]/layout.tsx:64) (`{children}` directly).
   Content sites don't earn cross-fade page transitions; the entrance `Reveal`s already provide
   arrival choreography.

**Steps (option B — keep a transition):** replace with enter-only (no exit, no wait):
```tsx
<motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
```
No `AnimatePresence` at all — the new page starts rendering on frame 1.

2. `src/components/ui/Tabs.tsx:55-70` — remove `mode="wait"`. Replace the panel animation with an
   enter-only fade (drop the `exit` prop and `AnimatePresence`; key the div by `active`):
   - Current: `mode="wait"`, enter `{opacity: 0, y: 8}` / exit `{opacity: 0, y: -8}`, 200 ms each
     (≈ 400 ms perceived).
   - Corrected: enter-only `{opacity: 0, y: 4}` → `{opacity: 1, y: 0}`, 150 ms, same ease.
     Content swaps instantly and settles — a **crossfade-free swap with a soft landing**, not an
     exit-then-enter sequence.

**Acceptance:** clicking between tabs feels instant (< 1 frame to first pixels of new content);
navigation shows the new route immediately with no blank gap.

---

### PLAN 3 — Toast system → Sonner (or minimum: layout animations + hover-pause)

**Context:** `src/components/ui/Toast.tsx` is a hand-rolled context provider. Missing versus
baseline expectations: stack **rearrangement animation** when a toast dismisses (currently the
column jump-cuts), timer pause on hover, swipe-to-dismiss, screen-reader announcement
(`role="status"` / `aria-live` absent), and an enter that respects reduced motion.

**Steps (recommended):**
1. `npm i sonner` (Emil Kowalski's toast library — the curated pick).
2. Replace `ToastProvider` in the admin layout with `<Toaster theme="dark" position="bottom-right" />`;
   style via its CSS variables to match tokens (`--surface`, `--border`, `--radius-md`).
3. Replace `useToast().toast(msg, type)` call sites (grep `useToast(`) with `toast.success/error/info`.
4. Delete `src/components/ui/Toast.tsx`, remove from `ui/index.ts`.

**Steps (minimum, if staying hand-rolled):**
- Add `layout` to the `motion.div` at [Toast.tsx:53](src/components/ui/Toast.tsx:53) so remaining
  toasts **glide** into place instead of jumping; add `role="status" aria-live="polite"` to the
  container; clear/restart the `setTimeout` on `mouseenter`/`mouseleave`; specify
  `ease: [0.16, 1, 0.3, 1]` on enter and shorten exit to 150 ms.

**Acceptance:** dismissing the middle toast of three animates the third upward; hovering a toast
freezes its timer; VoiceOver announces new toasts.

---

### PLAN 4 — Gesture states: springs on press, no scale-on-hover, tilt tamed

**Context:** buttons and cards use duration tweens for gestures. Gestures must inherit velocity
and be interruptible — that means springs.

**Steps:**
1. [Button.tsx:39-41](src/components/ui/Button.tsx:39) —
   - Current: `whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
     transition={{ duration: 0.15, ease: 'easeOut' }}`
   - Corrected: delete `whileHover` (buttons should respond to hover with color/border via the
     existing `transition-colors`, not size — scaling on hover reads as wobble). Keep the press:
     `whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}`.
2. [ServiceCard.tsx:33-58](src/components/services/ServiceCard.tsx:33) — the sheen position is
   React state updated on every `mousemove` (`setSheenPos`) → a full re-render per mouse event.
   Convert to motion values + `useMotionTemplate`:
   ```tsx
   const sheenX = useMotionValue(50); const sheenY = useMotionValue(50);
   const sheen = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(0,255,102,0.1) 0%, transparent 55%)`;
   ```
   and pass `style={{ background: sheen }}` — zero re-renders. Also reduce tilt range at
   lines 38-39 from `±8°` to `±5°` (8° is novelty-site territory), and delete the
   `onTouchStart` tilt (lines 71-84) — tilt is a **cursor-tracking effect**; on touch it just
   makes the card lurch under the finger.
3. [Card.tsx:20-21](src/components/ui/Card.tsx:20) — same `±8` → `±5` for consistency.
4. [LangSwitcher.tsx:56-61](src/components/ui/LangSwitcher.tsx:56) — the dropdown **pop-in**
   scales from center. Add origin awareness: `className="... origin-top-right"`
   (`origin-top-left` under RTL — use logical `origin-top-end` via a small conditional), so the
   menu grows out of its trigger. Swap the 150 ms tween for
   `{ type: 'spring', stiffness: 500, damping: 32 }` on enter; keep a 120 ms fade on exit.

**Acceptance:** rapid repeated button presses never queue/stutter; moving the cursor across a
service card produces no React re-renders (verify with React DevTools profiler); the language
menu visibly emanates from the trigger corner.

---

### PLAN 5 — Marquee correctness + `ArrowLink` layout animation

**Steps:**
1. [Marquee.tsx:3-4](src/components/ui/Marquee.tsx:3) — remove dead imports (`useRef`, `motion`,
   `useScroll`, `useTransform` — none used).
2. Seam jump: the track is `flex gap-8` containing two copies of `children`
   ([Marquee.tsx:26-38](src/components/ui/Marquee.tsx:26)), animated `translateX(0 → -50%)`.
   Because the inter-copy `gap-8` isn't included in the 50 % measure, the loop restarts 32 px
   early — a visible **snap** every cycle on the follower strip.
   - Corrected: put the gap inside each copy instead — wrap each duplicate in
     `<div className="flex gap-8 pe-8 shrink-0">…</div>` and animate the same `-50%`; the
     trailing padding makes both halves geometrically identical, so the wrap point is seamless.
3. Reduced motion: pause the animation under `prefers-reduced-motion` (covered by PLAN 1 step 5's
   CSS guard — confirm the class name matches).
4. [ArrowLink.tsx:15](src/components/ui/ArrowLink.tsx:15) — `hover:gap-3 transition-all` animates
   `gap`, which is a layout property: the label text physically shifts every hover, and
   `transition-all` is a footgun.
   - Current: `inline-flex items-center gap-2 ... hover:gap-3 transition-all duration-[var(--duration-base)]`
   - Corrected: keep `gap-2` fixed; move the icon instead —
     `<ArrowRight className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />`
     with `group` on the link. Same fix at [ServicesSection.tsx:80](src/components/home/ServicesSection.tsx:80)
     (`hover:gap-3 transition-all` on the card CTA). The blog back-link at
     [blog/[slug]/page.tsx:85-87](src/app/[lang]/blog/[slug]/page.tsx:85) already does this
     correctly — copy that pattern.

**Acceptance:** follower strip loops with no visible jump over 3 full cycles; hovering
"read more" links moves only the arrow, never the text.

---

### PLAN 6 — Canvas power budget

**Context:** `MatrixRain` mounts on Hero, NewsletterSection, contact, about, and links pages —
the home page runs **two** rain canvases plus (after scroll) the 2 200-particle `HeroCanvas`,
all on `requestAnimationFrame` loops that never stop while the tab is visible, even when the
canvas is scrolled far off-screen or fully transparent.

**Steps:**
1. [MatrixRain.tsx:32-147](src/components/ui/MatrixRain.tsx:32) — add an `IntersectionObserver`
   on the canvas: when not intersecting, `cancelAnimationFrame`; when re-entering, resume. Mirror
   the existing `visibilitychange` logic (lines 74-81) — note that logic has a latent double-rAF
   risk: `handleVisibility` resumes without cancelling first; guard with a `running` flag while
   you're in there.
2. [HeroCanvas.tsx](src/components/home/HeroCanvas.tsx) + [HeroPortrait.tsx:24](src/components/home/HeroPortrait.tsx:24) —
   the matrix layer is `opacity: 0` until 8 % scroll, but its rAF loop runs from mount. Gate it:
   pass scroll progress down or observe `matrixOpacity` (`useMotionValueEvent`) and only run the
   loop when opacity > 0.01 and the hero intersects the viewport.

**Acceptance:** with the home page scrolled to the footer, CPU usage of the tab drops to ~0 % in
the performance monitor (currently continuous canvas work).

---

### PLAN 7 — Counter → NumberFlow, tabular numerals everywhere numbers move

**Steps:**
1. `npm i @number-flow/react` (the curated pick for animated numbers — it handles per-digit
   **roll** transitions, formatting, and reduced motion natively).
2. Replace the body of [Counter.tsx](src/components/ui/Counter.tsx) with a `<NumberFlow>` render
   (keep the `useInView` trigger and the existing prop API: value/prefix/suffix/decimals).
3. Whether or not step 1-2 land: add `tabular-nums` to numeric displays so digits don't
   horizontally jitter while counting — [Stat.tsx:15](src/components/ui/Stat.tsx:15) and the
   follower counts at [FollowerStrip.tsx:70](src/components/home/FollowerStrip.tsx:70).

**Acceptance:** counting stats show no horizontal layout shift; digits roll rather than flicker.

---

### PLAN 8 — Dialog a11y + exit timing

**Steps (recommended):** adopt Radix UI Dialog (or Base UI) as the behavior layer and keep the
existing glass styling as-is; Radix supplies focus trap, focus return, `aria` wiring, and scroll
lock. Wrap its content in the same `motion.div` animation.

**Steps (minimum, hand-rolled):** in [Dialog.tsx](src/components/ui/Dialog.tsx):
1. Move focus into the panel on open; return focus to the invoker on close (store
   `document.activeElement`).
2. Trap Tab within the panel.
3. Exit faster than enter: enter stays 200 ms; exit → 150 ms
   (`exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15 } }}`) — leaving should
   always be quicker than arriving.
4. The overlay `motion.div` (lines 40-46) has no explicit transition — give it
   `transition={{ duration: 0.2 }}` so backdrop and panel move on the same clock.
5. The close button (line 63) needs `aria-label="Close"`.

**Acceptance:** open dialog → focus lands inside; Tab cycles within; Esc closes and focus
returns to the trigger; the panel visibly leaves faster than it arrived.

---

## 4. Nice-to-haves

- **`MatrixText` scramble pacing** — [MatrixText.tsx:50-61](src/components/ui/MatrixText.tsx:50):
  one character resolves per 30 ms tick, so a 40-char eyebrow takes 1.2 s to settle. Reveal
  `Math.ceil(target.length / 25)` chars per tick to cap total time at ~750 ms regardless of length.
  Also add a reduced-motion early-return (currently scrambles for everyone), and `aria-hidden`
  on the changing glyphs with the real text in a visually-hidden sibling (the current `aria-label`
  on a `span` is unreliable for non-interactive elements).
- **`BlogCard` image zoom** — [BlogCard.tsx:47](src/components/ui/BlogCard.tsx:47): the 400 ms
  `scale-105` **slow-zoom** is fine, but add `ease-[cubic-bezier(0.16,1,0.3,1)]` (currently the
  default `ease` — mushy) and pair it with a blur-up: `next/image` `placeholder="blur"` or an
  `onLoad` opacity fade, so covers don't pop in raw.
- **NavBar active-link indicator** — desktop nav ([NavBar.tsx:70-87](src/components/ui/NavBar.tsx:70))
  marks the active route with color only. A `layoutId` pill/underline that **slides** between
  items on navigation (same spring as the Tabs indicator: `stiffness 500, damping 40`) would tie
  the nav to the Tabs vocabulary already in the system.
- **NavBar header transition** — [NavBar.tsx:54](src/components/ui/NavBar.tsx:54):
  `transition-all duration-300` → `transition-[background-color,border-color,box-shadow,backdrop-filter] duration-200`.
  Never `transition-all` on a fixed header (it will happily animate layout you didn't intend).
- **Unused token** — `--ease-spring` ([tokens.css:40](src/styles/tokens.css:40)) is defined and
  never referenced. Either use it (it's a nice overshoot curve for **pop-in** moments like the
  mobile drawer) or delete it.
- **`tailwind.config.ts` is vestigial** — Tailwind v4 ignores the `content` array here; only the
  `fontFamily` extension does anything, and that could move into the `@theme` block in
  `globals.css` (the comment at [globals.css:23](src/app/globals.css:23) acknowledges the split).
  One source of truth.
- **Newsletter/contact success states jump-cut** — [NewsletterSection.tsx:53](src/components/home/NewsletterSection.tsx:53),
  [NewsletterCard.tsx:51](src/app/links/_components/NewsletterCard.tsx:51),
  [ContactForm.tsx:53](src/components/contact/ContactForm.tsx:53): form → success is an instant
  swap. A 200 ms crossfade + 8 px rise (enter-only, `AnimatePresence` not required if you keep
  both branches keyed) makes the payoff moment feel intentional. Bonus: render the success line
  through `MatrixText` — the **scramble-resolve** is the site's signature and this is the one
  place it would mean something.
- **Button loading state** — [Button.tsx:46-48](src/components/ui/Button.tsx:46): spinner
  replaces children, changing button width mid-action. Reserve the label
  (`opacity-0` on children + absolutely-centered spinner) so the button holds its size.
- **Blog article typography** — [blog/[slug]/page.tsx:136](src/app/[lang]/blog/[slug]/page.tsx:136):
  `prose-sm sm:prose-base` = 14 px article body on mobile. Long-form reading wants 16–18 px:
  `prose sm:prose-lg`. Also consider default-underlined links in article body
  (`prose-a:underline prose-a:decoration-matrix/40`) — color-only links inside paragraphs fail
  WCAG 1.4.1.
- **Micro-label floor** — 9–10 px mono labels appear throughout the links page
  ([ProfileHeader.tsx:100](src/app/links/_components/ProfileHeader.tsx:100),
  [LatestSection.tsx:31](src/app/links/_components/LatestSection.tsx:31), etc.). 10 px is the
  absolute floor for the mono eyebrow style; the 9 px instances should come up to 10–11 px.
- **Heading tracking is one-size** — [globals.css:159](src/app/globals.css:159) applies
  `-0.02em` to all h1–h6. Optical rule: tighten more as size grows, less as it shrinks.
  `h1/h2: -0.025em; h3: -0.015em; h4-h6: -0.01em` reads better with Inter Tight.
- **Dead `as`/`href` props on Button** — see SB-5; either implement or delete from the interface.
- **`Marquee` `pauseOnHover` prop** half-works: line 32 sets `animationPlayState` but the inline
  stylesheet (line 48-50) also hardcodes the hover rule — the prop and the CSS can disagree.
  Consolidate to one mechanism.

---

## 5. Explicitly rejected suggestions

Considered during the opportunity sweep (Phase 4) and deliberately **not** recommended:

1. **View Transitions API for blog-card → article cover morph.** Genuinely delightful when it
   works, but App Router support is still experimental, the site is trilingual with RTL (morph
   geometry flips), and covers are optional per post. Cost/fragility exceeds payoff today.
2. **More parallax layers / parallax on cards.** Three sections already run `ParallaxLayer` at
   0.12–0.18 speeds on background art — the right amount. More would tip into scroll-jack
   territory; the hero dissolve is the star and shouldn't compete.
3. **Cursor-following effects (custom cursor, glow trails) on the public site.** The matrix rain
   + scramble + tilt already spend the novelty budget. A cursor effect on top crosses from
   "signature" into "2019 portfolio".
4. **Scroll-triggered letter-by-letter headline animation.** The `MatrixText` scramble already
   owns the "text arrives" moment; a second text-entrance vocabulary would dilute it.
5. **Scramble-on-hover for nav links** (`MatrixText scrambleOnHover` exists and is unused there).
   Nav must be boring-reliable; scrambling labels mid-aim hurts target acquisition.
6. **Skeleton screens for the public blog index.** It's statically revalidated (`revalidate = 300`)
   — content arrives with the HTML. Skeletons would animate for nobody. (Admin is different;
   it already has `loading.tsx`.)
7. **Springs for the `Reveal` entrance system.** Springs are for gestures and interruptions;
   scroll-entrance reveals are fire-and-forget, where the ease-out tween you already use is the
   correct tool. Don't convert.

---

## 6. Library changes recommended

| Change | Replaces | Why |
|---|---|---|
| **Add `sonner`** | hand-rolled `Toast.tsx` (~80 lines) | Stack rearrangement, hover-pause, swipe-dismiss, a11y announcements, reduced-motion — all free. It's the reference toast implementation. |
| **Add `@radix-ui/react-dialog`** (or Base UI `Dialog`) | behavior layer of `Dialog.tsx` | Focus trap/return, scroll lock, aria wiring. Keep your glass styling; Radix is unstyled. |
| **Add `@radix-ui/react-tabs` + `@radix-ui/react-dropdown-menu`** (or Base UI) | `Tabs.tsx` behavior, `LangSwitcher` dropdown | Arrow-key roving tabs (fixes SB-3), dropdown focus management/typeahead/Esc. Keep the `layoutId` underline — it composes fine with Radix triggers. |
| **Add `@number-flow/react`** | hand-rolled `Counter.tsx` | Per-digit roll animation, localized formatting, `tabular-nums`, reduced-motion handling. |
| **Add `tw-animate-css`** *or* delete the classes | nothing (classes currently dead) | `animate-in …` in `InlineDeleteConfirm.tsx` references an uninstalled plugin (SB-4). |
| **Rename `framer-motion` → `motion`** (low priority) | same library | v12 ships as the `motion` package (`import { motion } from 'motion/react'`); `framer-motion` is the legacy alias. Do it opportunistically — zero behavior change. |
| **Keep:** `@dnd-kit/*` (curated pick for the admin reorder), `@tiptap/*`, `lucide-react`, `react-hook-form` + `zod`, hand-rolled `Marquee` (after PLAN 5 fixes — no library needed for one marquee). | | |
| **Watch:** `next-auth@5.0.0-beta.30` — beta on a production auth path; pin and track the stable release. `isomorphic-dompurify@3.0.0-rc.2` — release candidate; same advice. | | |

**Not recommended:** a full component library (shadcn/ui et al.) — the site's matrix identity is
its moat and the existing primitives are close; swap behavior layers (Radix/Base UI), keep skins.

---

## Appendix A — Phase 0 recon inventory

**Stack:** Next.js 16.1.6 (App Router, React 19.2.3) · Tailwind CSS v4 (`@theme` in
`globals.css` + tokens in `src/styles/tokens.css`; vestigial `tailwind.config.ts`) ·
framer-motion 12.34 · next/font (Inter, Inter Tight, JetBrains Mono, + Cairo/Tajawal/IBM Plex
Arabic for RTL) · no GSAP, no View Transitions.

**Every file containing motion code:**

| File | Mechanism |
|---|---|
| [ui/Reveal.tsx](src/components/ui/Reveal.tsx) | FM `useInView` slide-fade entrance (site-wide) |
| [ui/PageTransition.tsx](src/components/ui/PageTransition.tsx) | FM `AnimatePresence mode="wait"` route fade |
| [ui/ParallaxLayer.tsx](src/components/ui/ParallaxLayer.tsx) | FM `useScroll`+`useTransform` background parallax |
| [ui/MatrixRain.tsx](src/components/ui/MatrixRain.tsx) | canvas rAF glyph rain (5 mount sites) |
| [ui/MatrixText.tsx](src/components/ui/MatrixText.tsx) | setTimeout scramble-resolve text |
| [ui/Marquee.tsx](src/components/ui/Marquee.tsx) | CSS `@keyframes` infinite marquee (inline `<style>`) |
| [ui/Counter.tsx](src/components/ui/Counter.tsx) | FM `useSpring` count-up |
| [ui/Button.tsx](src/components/ui/Button.tsx) | FM `whileHover`/`whileTap` scale |
| [ui/Card.tsx](src/components/ui/Card.tsx) | FM spring 3D tilt + cursor glow (design-system only) |
| [ui/Dialog.tsx](src/components/ui/Dialog.tsx) | FM scale/fade modal |
| [ui/Toast.tsx](src/components/ui/Toast.tsx) | FM enter/exit toasts |
| [ui/Tabs.tsx](src/components/ui/Tabs.tsx) | FM `layoutId` indicator + `mode="wait"` panels |
| [ui/Accordion.tsx](src/components/ui/Accordion.tsx) | FM height-auto expand + chevron rotate |
| [ui/NavBar.tsx](src/components/ui/NavBar.tsx) | scroll-state header + FM mobile drawer |
| [ui/LangSwitcher.tsx](src/components/ui/LangSwitcher.tsx) | FM dropdown pop-in |
| [ui/ArrowLink.tsx](src/components/ui/ArrowLink.tsx) | CSS `gap` hover animation |
| [ui/BlogCard.tsx](src/components/ui/BlogCard.tsx) | CSS hover image zoom |
| [ui/PricingTier.tsx](src/components/ui/PricingTier.tsx) | FM `whileHover` lift (spring 400/30 — good) |
| [home/HeroPortrait.tsx](src/components/home/HeroPortrait.tsx) | FM scroll-scrubbed photo→matrix dissolve |
| [home/HeroCanvas.tsx](src/components/home/HeroCanvas.tsx) | canvas spring-physics particle portrait |
| [services/ServiceCard.tsx](src/components/services/ServiceCard.tsx) | FM tilt + state-driven sheen |
| [links/page.tsx](src/app/links/page.tsx) + [ProfileHeader.tsx](src/app/links/_components/ProfileHeader.tsx) | CSS `pulse-ring` keyframes |
| [links/_components/Card.tsx](src/app/links/_components/Card.tsx) | CSS hover arrow-nudge (good pattern) |
| admin: [AIWriterPanel](src/components/admin/AIWriterPanel.tsx), [ToastBanner](src/components/admin/ToastBanner.tsx), [MediaPickerModal](src/components/admin/MediaPickerModal.tsx), [InlineDeleteConfirm](src/components/admin/InlineDeleteConfirm.tsx) | FM panel/modal/banner + dead animate-in classes |
| [globals.css](src/app/globals.css) | `scroll-behavior: smooth`, transition utilities |
| [tokens.css](src/styles/tokens.css) | `--ease-spring` (unused), `--ease-out`, duration scale |

## Appendix B — brand-green drift (craft note)

Three different greens are live: token `--matrix: #00FF66` ([tokens.css:13](src/styles/tokens.css:13)),
canvas-hardcoded `#00FF41` ([MatrixRain.tsx:119](src/components/ui/MatrixRain.tsx:119),
[HeroCanvas.tsx:167](src/components/home/HeroCanvas.tsx:167) — commented "brand green"), and
`rgba(0,255,136)` in the ServiceCard sheen ([ServiceCard.tsx:103](src/components/services/ServiceCard.tsx:103)).
Plus ~12 hardcoded `rgba(0,255,102,…)` glows that bypass the token. Pick one green (git history
says the brand decision was #00FF41), update the token, and make the canvases read it via
`getComputedStyle` the way `HeroCanvas` already reads `--bg-0`.
