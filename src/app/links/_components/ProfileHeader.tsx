import Image from 'next/image';
import Wordmark from '@/components/ui/Wordmark';
import SocialRow from '@/components/ui/SocialRow';
import { BRAND } from '@/lib/brand';
import { getSiteImages } from '@/lib/site-content';

/** Link-in-bio header: A01 avatar, name, BRAND.title + proof line. Never follower counts. */
export default async function ProfileHeader() {
  const img = await getSiteImages();
  return (
    <header className="flex flex-col items-start gap-4">
      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-line">
        <Image src={img.avatar.src} alt={img.avatar.alt} fill sizes="80px" className="object-cover" preload />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl text-paper">
          <Wordmark />
        </h1>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-paper">{BRAND.title}</p>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{BRAND.proofLine}</p>
      </div>
      <SocialRow className="-ms-2" />
    </header>
  );
}
