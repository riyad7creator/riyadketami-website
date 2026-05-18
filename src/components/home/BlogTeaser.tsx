import { ArrowLink, BlogCard, Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import MatrixRain from '@/components/ui/MatrixRain';
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

  return (
    <section className="relative py-24 sm:py-32 px-5 sm:px-8 overflow-hidden">
      <MatrixRain opacity={0.055} speed={0.6} density={0.55} />
      <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-2xl">
            <Reveal direction="up">
              <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h2 className="font-display font-bold tracking-tight text-text-0 text-3xl sm:text-4xl md:text-5xl leading-[1.1]">
                {t.title}
              </h2>
            </Reveal>
            <Reveal direction="up" delay={0.16}>
              <p className="text-text-1 text-lg leading-relaxed">{t.subtitle}</p>
            </Reveal>
          </div>

          <Reveal direction="up" delay={0.24}>
            <ArrowLink href={`/${locale}/blog`}>{t.cta}</ArrowLink>
          </Reveal>
        </div>

        {posts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post, i) => (
              <Reveal key={post.slug} direction="up" delay={0.1 + i * 0.08}>
                <BlogCard
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  category={post.category}
                  coverImage={post.featuredImage}
                  publishedAt={post.createdAt}
                  readTime={post.readTime}
                  lang={locale}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="glass border border-border rounded-[var(--radius-lg)] p-10 text-center">
            <p className="font-mono text-sm text-text-2">{t.empty}</p>
          </div>
        )}
      </div>
    </section>
  );
}
