import { ArrowLink, BlogCard } from '@/components/ui';
import Eyebrow from '@/components/ui/Eyebrow';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/lib/dictionaries';
import type { TeaserPost } from '@/lib/home-data';

interface BlogTeaserProps {
  locale: Locale;
  dict: Dictionary;
  posts: TeaserPost[];
}

export default function BlogTeaser({ locale, dict, posts }: BlogTeaserProps) {
  const t = dict.home.blog_teaser;
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="blog-teaser" className="border-t border-line px-4 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="flex max-w-2xl flex-col gap-3">
            <Eyebrow text={t.eyebrow} />
            <h2 id="blog-teaser" className="font-display text-3xl font-bold text-paper sm:text-4xl">
              {t.title}
            </h2>
            <p className="text-lg leading-relaxed text-text-1">{t.subtitle}</p>
          </div>
          <ArrowLink href={`/${locale}/blog`}>{t.cta}</ArrowLink>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard
              key={post.slug}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              category={post.category}
              coverImage={post.featuredImage}
              publishedAt={post.createdAt}
              readTime={post.readTime}
              lang={locale}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
