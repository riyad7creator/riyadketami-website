import Eyebrow from '@/components/ui/Eyebrow';
import type { Dictionary } from '@/lib/dictionaries';

export default function NowStrip({ dict }: { dict: Dictionary }) {
  const t = dict.home.now;
  return (
    <section aria-labelledby="now" className="border-y border-line px-4 sm:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 py-6 md:flex-row md:items-center md:gap-8">
        <Eyebrow as="h2" id="now" className="shrink-0">
          {t.eyebrow}
        </Eyebrow>
        <ul className="flex flex-col gap-2 text-paper md:flex-row md:flex-wrap md:gap-x-8">
          {t.items.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span aria-hidden className="h-px w-4 bg-signal" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
