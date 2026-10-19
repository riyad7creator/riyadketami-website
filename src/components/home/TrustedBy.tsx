import Image from 'next/image';
import Eyebrow from '@/components/ui/Eyebrow';
import { BRAND } from '@/lib/brand';
import type { Dictionary } from '@/lib/dictionaries';

/** Partner logos, monochrome and equal height so no brand dominates. */
export default function TrustedBy({ dict }: { dict: Dictionary }) {
  return (
    <section aria-labelledby="trusted" className="px-4 py-16 sm:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
        <Eyebrow as="h2" id="trusted">
          {dict.home.trusted.eyebrow}
        </Eyebrow>
        <ul className="grid grid-cols-2 items-center gap-x-10 gap-y-8 sm:grid-cols-4" dir="ltr">
          {BRAND.partners.map((p) => (
            <li key={p.name} className="flex h-8 items-center opacity-70 transition-opacity duration-[var(--duration-fast)] hover:opacity-100">
              {p.logo ? (
                <Image
                  src={p.logo}
                  alt={p.name}
                  width={p.width}
                  height={p.height}
                  className="h-7 w-auto"
                />
              ) : (
                // Official logo file not supplied yet — the name stands in
                <span className="font-display text-xl font-bold text-paper">{p.name}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
