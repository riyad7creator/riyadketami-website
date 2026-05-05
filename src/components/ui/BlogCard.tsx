import Link from 'next/link';
import Image from 'next/image';
import Pill from './Pill';

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  coverImage?: string;
  publishedAt?: string | Date;
  readTime?: number;
  lang?: string;
  className?: string;
}

export default function BlogCard({
  slug,
  title,
  excerpt,
  category,
  coverImage,
  publishedAt,
  readTime,
  lang = 'en',
  className = '',
}: BlogCardProps) {
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Link
      href={`/${lang}/blog/${slug}`}
      className={`group flex flex-col glass rounded-[var(--radius-lg)] overflow-hidden border border-border hover:border-border-hover transition-colors duration-[var(--duration-base)] ${className}`}
    >
      {coverImage && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-[var(--duration-slow)] group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="flex flex-col gap-3 p-5 flex-1">
        {category && <Pill variant="matrix">{category}</Pill>}
        <h3 className="text-lg font-semibold text-text-0 leading-snug group-hover:text-matrix transition-colors duration-[var(--duration-fast)] line-clamp-2">
          {title}
        </h3>
        {excerpt && (
          <p className="text-text-2 text-sm leading-relaxed line-clamp-3">{excerpt}</p>
        )}
        {(date || readTime) && (
          <div className="mt-auto flex items-center gap-3 text-xs text-text-2 pt-2 border-t border-border">
            {date && <span>{date}</span>}
            {readTime && <span>{readTime} min read</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
