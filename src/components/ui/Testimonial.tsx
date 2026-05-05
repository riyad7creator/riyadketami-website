import Image from 'next/image';

interface TestimonialProps {
  quote: string;
  author: string;
  title?: string;
  avatar?: string;
  className?: string;
}

export default function Testimonial({ quote, author, title, avatar, className = '' }: TestimonialProps) {
  const initials = author
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <blockquote
      className={`flex flex-col gap-5 glass border border-border rounded-[var(--radius-lg)] p-6 ${className}`}
    >
      <span className="text-3xl text-matrix leading-none select-none" aria-hidden>&ldquo;</span>
      <p className="text-text-1 text-sm leading-relaxed italic flex-1">{quote}</p>
      <footer className="flex items-center gap-3">
        <div className="relative h-9 w-9 rounded-full overflow-hidden bg-bg-2 flex items-center justify-center shrink-0">
          {avatar ? (
            <Image src={avatar} alt={author} fill className="object-cover" sizes="36px" />
          ) : (
            <span className="text-xs font-bold text-matrix">{initials}</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-text-0">{author}</span>
          {title && <span className="text-xs text-text-2">{title}</span>}
        </div>
      </footer>
    </blockquote>
  );
}
