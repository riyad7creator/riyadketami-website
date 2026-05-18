import { Testimonial, Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import MatrixRain from '@/components/ui/MatrixRain';
import type { Dictionary } from '@/lib/dictionaries';

interface TestimonialsSectionProps {
  dict: Dictionary;
  eyebrow?: string;
  title?: string;
}

export default function TestimonialsSection({ dict, eyebrow, title }: TestimonialsSectionProps) {
  const t = dict.home.testimonials;
  const displayEyebrow = eyebrow ?? t.eyebrow;
  const displayTitle = title ?? t.title;

  return (
    <section className="relative py-24 sm:py-32 px-5 sm:px-8 overflow-hidden">
      <MatrixRain opacity={0.04} />
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-3 max-w-2xl">
          <Reveal direction="up">
            <MatrixText text={displayEyebrow} className="text-xs tracking-[0.2em] text-matrix" />
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-text-0 leading-[1.1]">
              {displayTitle}
            </h2>
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {t.items.map((item, i) => (
            <Reveal key={i} direction="up" delay={0.08 + i * 0.1}>
              <Testimonial
                quote={item.quote}
                author={item.author}
                title={item.title}
                className="h-full"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
