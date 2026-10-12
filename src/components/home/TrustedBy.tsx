import Eyebrow from '@/components/ui/Eyebrow';
import Flag from '@/components/ui/Flag';
import { BRAND } from '@/lib/brand';
import type { Dictionary } from '@/lib/dictionaries';

/** Brief §2.3: text wordmarks only — no logo images until permission is confirmed. */
export default function TrustedBy({ dict }: { dict: Dictionary }) {
  return (
    <section aria-labelledby="trusted" className="px-4 py-16 sm:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Eyebrow as="h2" id="trusted">
            {dict.home.trusted.eyebrow}
          </Eyebrow>
          {!BRAND.partners.verified && <Flag kind="VERIFY">{dict.verify.partners}</Flag>}
        </div>
        <ul className="flex flex-wrap items-center gap-x-10 gap-y-4" dir="ltr">
          {BRAND.partners.names.map((name) => (
            <li key={name} className="font-display text-xl font-medium text-muted sm:text-2xl">
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
