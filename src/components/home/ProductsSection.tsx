import { Button, Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/lib/dictionaries';

interface ProductsSectionProps {
  locale: Locale;
  dict: Dictionary;
}

const PRODUCT_VARIANTS: Array<'secondary' | 'primary' | 'secondary'> = ['secondary', 'primary', 'secondary'];

export default function ProductsSection({ locale, dict }: ProductsSectionProps) {
  const t = dict.home.products;

  // Newsletter + Masterclass waitlist both feed the signup form; the course
  // doesn't exist yet so its CTA is an honest waitlist, not "get access".
  const hrefs = [
    `#newsletter`,
    `#newsletter`,
    `/${locale}/contact`,
  ];

  return (
    <section className="py-24 sm:py-32 px-5 sm:px-8 bg-bg-1/40 border-y border-border">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-3 max-w-2xl">
          <Reveal direction="up">
            <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-text-0 leading-[1.1]">
              {t.title}
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.16}>
            <p className="text-text-1 text-lg leading-relaxed">{t.subtitle}</p>
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {t.items.map((item, i) => (
            <Reveal key={i} direction="up" delay={0.08 + i * 0.1}>
              <div className="flex flex-col gap-5 h-full glass border border-border hover:border-border-hover rounded-[var(--radius-lg)] p-7 transition-colors duration-[var(--duration-fast)]">
                <span className="font-mono text-[10px] tracking-[0.15em] text-matrix border border-matrix/30 rounded-full px-2.5 py-1 w-fit">
                  {item.tag}
                </span>
                <div className="flex flex-col gap-2 flex-1">
                  <h3 className="font-display font-semibold text-lg text-text-0">{item.name}</h3>
                  <p className="text-text-2 text-sm leading-relaxed">{item.description}</p>
                </div>
                <Button
                  href={hrefs[i] ?? `/${locale}/contact`}
                  variant={PRODUCT_VARIANTS[i] ?? 'secondary'}
                  className="w-full"
                >
                  {item.cta}
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
