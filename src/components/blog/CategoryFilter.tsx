'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { BLOG_CATEGORIES } from '@/lib/blog-categories';

interface CategoryFilterProps {
  filterAll: string;
  active?: string;
}

export default function CategoryFilter({ filterAll, active }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = (category?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const btnClass = (isActive: boolean) =>
    `px-4 py-1.5 rounded-full text-xs font-mono tracking-wide transition-colors duration-[var(--duration-fast)] border ${
      isActive
        ? 'bg-matrix/10 border-matrix/40 text-matrix'
        : 'border-border text-text-2 hover:border-border-hover hover:text-text-1'
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <button className={btnClass(!active)} onClick={() => navigate()}>
        {filterAll}
      </button>
      {BLOG_CATEGORIES.map((c) => (
        <button
          key={c.value}
          className={btnClass(active === c.value)}
          onClick={() => navigate(c.value)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
