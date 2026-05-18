import Image from 'next/image';
import MatrixText from '@/components/ui/MatrixText';

interface SocialEntry {
  url: string;
  count: string;
}

interface ProfileHeaderProps {
  name: string;
  tagline: string;
  statusLine?: string | null;
  statusEnabled: boolean;
  subscriberCount: number;
  socials: {
    tiktok?: SocialEntry;
    youtube?: SocialEntry;
    instagram?: SocialEntry;
  };
  profileImage: string;
}

const SOCIAL_LABEL: Record<string, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
};

export default function ProfileHeader({
  name,
  tagline,
  statusLine,
  statusEnabled,
  socials,
  profileImage,
}: ProfileHeaderProps) {
  const socialEntries = (
    Object.entries(socials) as [string, SocialEntry | undefined][]
  )
    .filter((entry): entry is [string, SocialEntry] => !!entry[1]?.url && !!entry[1]?.count)
    .map(([key, social]) => ({ key, label: SOCIAL_LABEL[key] ?? key, ...social }));

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {/* Avatar with ambient glow */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: '-60%',
            background: 'radial-gradient(circle, rgba(0,255,102,0.15) 0%, transparent 70%)',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 rounded-full border border-matrix/30 pointer-events-none"
          style={{ animation: 'pulse-ring 3s ease-in-out infinite', transform: 'scale(1.18)' }}
          aria-hidden
        />
        <div className="relative w-20 h-20 rounded-full border-2 border-matrix/50 overflow-hidden bg-bg-1 shrink-0">
          <Image
            src={profileImage}
            alt={name}
            fill
            className="object-cover object-top"
            sizes="80px"
            priority
          />
        </div>
      </div>

      {/* Name + tagline + status */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-bold text-xl text-text-0 tracking-tight">{name}</h1>
        <MatrixText
          text={tagline}
          className="font-mono text-[10px] tracking-[0.14em] text-text-2"
          autoPlay
        />
        {statusEnabled && statusLine && (
          <p className="text-xs text-matrix/80 mt-1 font-mono">⚡ {statusLine}</p>
        )}
      </div>

      {/* Social stats row */}
      {socialEntries.length > 0 && (
        <div className="flex items-center gap-0 mt-1">
          {socialEntries.map((s, i) => (
            <a
              key={s.key}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center px-4 hover:text-matrix transition-colors group"
              style={i < socialEntries.length - 1 ? { borderRight: '1px solid var(--border)' } : {}}
            >
              <span className="font-display font-bold text-sm text-text-0 group-hover:text-matrix transition-colors">
                {s.count}
              </span>
              <span className="font-mono text-[9px] tracking-[0.15em] text-text-2 mt-0.5">
                {s.label.toUpperCase()}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
