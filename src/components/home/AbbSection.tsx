import { Button } from '@/components/ui';
import Flag from '@/components/ui/Flag';
import { BRAND } from '@/lib/brand';
import type { Dictionary } from '@/lib/dictionaries';

/**
 * Brief §2.3 ABB section, on the light --paper background.
 * [VISUAL V06] (texture, no people, no map) is decorative and lands here once approved.
 */
export default function AbbSection({ dict }: { dict: Dictionary }) {
  const t = dict.home.abb;
  const { stats } = BRAND.abb;
  const rows = [
    { value: stats.values.companies, label: t.stats.companies },
    { value: stats.values.wilayas, label: t.stats.wilayas },
    { value: stats.values.communities, label: t.stats.communities },
  ];

  return (
    <section aria-labelledby="abb" data-visual="V06" className="bg-paper px-4 py-20 text-ink sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[1.2fr_1fr] md:items-end">
        <div className="flex flex-col gap-6">
          {/* Green on paper is an accent rule only — the eyebrow text stays ink (brief §3.1) */}
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-signal" />
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-ink">{t.eyebrow}</p>
          </div>
          <h2 id="abb" className="font-display text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.05]">
            {BRAND.abb.name}
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-ink/80">{t.body}</p>
          <div>
            <Button
              href={BRAND.abb.url}
              target="_blank"
              rel="noopener"
              size="lg"
              variant="secondary"
              className="!bg-ink !text-paper !border-ink hover:!bg-ink/90"
            >
              {t.cta}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-3 gap-4 border-t border-ink/15 pt-6">
            {rows.map((r) => (
              <div key={r.label} className="flex flex-col gap-1">
                <dt className="order-2 text-xs leading-snug text-ink/70">{r.label}</dt>
                <dd className="order-1 font-display text-3xl font-bold tabular-nums sm:text-4xl">{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink/60">
            {t.source}: {stats.source}
            {!stats.verified && <Flag kind="VERIFY">{dict.verify.stats}</Flag>}
          </p>
        </div>
      </div>
    </section>
  );
}
