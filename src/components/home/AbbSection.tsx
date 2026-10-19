import AbbCover from '@/components/abb/AbbCover';
import Flag from '@/components/ui/Flag';
import { BRAND } from '@/lib/brand';
import type { Dictionary } from '@/lib/dictionaries';

/** ABB cover band: official logo + Bay of Algiers cover, tagline, body, Join button, stats. */
export default function AbbSection({ dict }: { dict: Dictionary }) {
  const t = dict.home.abb;
  const { stats } = BRAND.abb;
  const rows = [
    { value: stats.values.companies, label: t.stats.companies },
    { value: stats.values.wilayas, label: t.stats.wilayas },
    { value: stats.values.communities, label: t.stats.communities },
  ];

  return (
    <section aria-labelledby="abb">
      <AbbCover tagline={t.tagline} body={t.body} joinLabel={t.join} eyebrow={t.eyebrow} headingId="abb">
        <dl className="mt-6 grid max-w-xl grid-cols-3 gap-4 border-t border-white/15 pt-6">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col gap-1">
              <dt className="order-2 text-xs leading-snug text-white/70">{r.label}</dt>
              <dd className="order-1 font-display text-3xl font-bold tabular-nums sm:text-4xl">{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-white/55">
          {t.source}: {stats.source}
          {!stats.verified && <Flag kind="VERIFY">{dict.verify.stats}</Flag>}
        </p>
      </AbbCover>
    </section>
  );
}
