import { BRAND } from '@/lib/brand';
import { getSiteImages } from '@/lib/site-content';

interface AbbCoverProps {
  tagline: string;
  body: string;
  joinLabel: string;
  /** "section" = full-width band on the home page, "card" = rounded block on the bio page */
  variant?: 'section' | 'card';
  eyebrow?: string;
  headingId?: string;
  children?: React.ReactNode;
}

/**
 * Algeria Business Bay cover: the official kit's Bay of Algiers background,
 * night-violet overlay, mint ABB logo, tagline and a mint Join button.
 * ABB colours (kit): mint #00FFC6, night #230447, violet #6600CC.
 */
export default async function AbbCover({ tagline, body, joinLabel, variant = 'section', eyebrow, headingId, children }: AbbCoverProps) {
  const img = await getSiteImages();
  const isCard = variant === 'card';

  return (
    <div
      className={`relative isolate overflow-hidden text-white ${
        isCard ? 'rounded-[var(--radius-md)] border border-white/10 p-4' : 'px-4 py-20 sm:px-8 sm:py-28'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- admin-replaceable, any host */}
      <img
        src={img.abbCover.src}
        alt=""
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[10%_30%] rtl:-scale-x-100"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#230447]/95 via-[#230447]/60 via-45% to-transparent rtl:bg-gradient-to-l"
      />

      <div className={`${isCard ? 'gap-2.5' : 'mx-auto max-w-[1200px] gap-5'} flex flex-col`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.abbLogo.src}
          alt={img.abbLogo.alt || BRAND.abb.name}
          className={isCard ? 'h-5 w-auto self-start' : 'h-10 w-auto self-start sm:h-14'}
        />
        {eyebrow && (
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#00FFC6]">{eyebrow}</p>
        )}
        <h2
          id={headingId}
          className={`font-display font-bold leading-[1.05] ${
            isCard ? 'text-lg' : 'max-w-2xl text-[clamp(2rem,5vw,3.5rem)]'
          }`}
        >
          {tagline}
        </h2>
        <p className={`${isCard ? 'text-xs' : 'max-w-xl text-lg'} leading-relaxed text-white/80`}>{body}</p>
        <a
          href={BRAND.abb.joinUrl}
          target="_blank"
          rel="noopener"
          className={`inline-flex w-fit items-center justify-center rounded-[var(--radius-md)] bg-[#00FFC6] font-semibold text-[#230447] transition-[background-color,transform] duration-[var(--duration-fast)] hover:bg-[#00FFC6]/90 active:scale-[0.97] ${
            isCard ? 'mt-1 min-h-[40px] px-4 text-sm' : 'h-12 px-7 text-base'
          }`}
        >
          {joinLabel}
        </a>
        {children}
      </div>
    </div>
  );
}
