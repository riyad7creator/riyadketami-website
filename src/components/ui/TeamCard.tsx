import Image from 'next/image';
import Pill from './Pill';

interface TeamCardProps {
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  className?: string;
}

export default function TeamCard({ name, role, bio, avatar, className = '' }: TeamCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`flex flex-col items-center text-center gap-4 glass border border-border rounded-[var(--radius-lg)] p-6 ${className}`}>
      <div className="relative h-20 w-20 rounded-full overflow-hidden bg-bg-2 flex items-center justify-center shrink-0">
        {avatar ? (
          <Image src={avatar} alt={name} fill className="object-cover" sizes="80px" />
        ) : (
          <span className="text-2xl font-bold text-matrix font-display">{initials}</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-text-0">{name}</span>
        {role && <Pill variant="matrix">{role}</Pill>}
      </div>
      {bio && <p className="text-sm text-text-2 leading-relaxed">{bio}</p>}
    </div>
  );
}
