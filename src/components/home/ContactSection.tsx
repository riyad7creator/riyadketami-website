import Image from 'next/image';
import Eyebrow from '@/components/ui/Eyebrow';
import SocialRow from '@/components/ui/SocialRow';
import { BRAND } from '@/lib/brand';
import { getSiteImages } from '@/lib/site-content';
import type { Dictionary } from '@/lib/dictionaries';

/** Brief §2.3 Contact: email (selectable), Oran, socials row. A06 band behind, darkened. */
export default async function ContactSection({ dict }: { dict: Dictionary }) {
  const t = dict.home.contact;
  const img = await getSiteImages();
  return (
    <section aria-labelledby="contact" className="relative isolate overflow-hidden px-4 py-24 sm:px-8 sm:py-32">
      <Image
        src={img.contactBg.src}
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover object-right"
      />
      {/* Ink from the text side so the copy clears 4.5:1; the subject stays visible on the right */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/20 rtl:bg-gradient-to-l" />

      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h2 id="contact" className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] text-paper">
          {t.title}
        </h2>
        <a
          href={BRAND.mailto}
          className="w-fit select-text font-mono text-lg text-paper underline decoration-signal underline-offset-[6px] hover:text-signal sm:text-2xl"
        >
          {BRAND.email}
        </a>
        <p className="text-muted">{t.location}</p>
        <SocialRow className="-ms-2" />
      </div>
    </section>
  );
}
