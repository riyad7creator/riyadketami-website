import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { getBlogPosts } from '@/lib/blog-data';
import { BlogCard, Reveal } from '@/components/ui';
import CategoryFilter from '@/components/blog/CategoryFilter';
import type { BlogCategory } from '@/lib/blog-categories';
import { BLOG_CATEGORIES } from '@/lib/blog-categories';

const BLOG_CATEGORY_VALUES = BLOG_CATEGORIES.map((c) => c.value) as [BlogCategory, ...BlogCategory[]];

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.blog.headline,
    description: dict.blog.subheadline,
  };
}

function isValidCategory(value: string | undefined): value is BlogCategory {
  return !!value && (BLOG_CATEGORY_VALUES as readonly string[]).includes(value);
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ lang }, { category }] = await Promise.all([params, searchParams]);
  if (!isValidLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const t = dict.blog;

  const activeCategory = isValidCategory(category) ? category : undefined;
  const posts = await getBlogPosts(lang, activeCategory);

  return (
    <>
      <section className="pt-32 pb-12 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-4 max-w-2xl">
            <Reveal direction="up">
              <span className="font-mono text-xs tracking-[0.2em] text-matrix">{t.eyebrow}</span>
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h1 className="font-display font-bold text-[clamp(2rem,5vw,3.5rem)] tracking-[-0.02em] text-text-0 leading-[1.1]">
                {t.headline}
              </h1>
            </Reveal>
            <Reveal direction="up" delay={0.16}>
              <p className="text-text-1 text-lg leading-relaxed">{t.subheadline}</p>
            </Reveal>
          </div>

          <Reveal direction="up" delay={0.2}>
            <Suspense>
              <CategoryFilter filterAll={t.filter_all} active={activeCategory} />
            </Suspense>
          </Reveal>
        </div>
      </section>

      <section className="pb-24 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <p className="font-mono text-sm text-text-2 tracking-[0.1em] py-16">{t.empty}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post, i) => (
                <Reveal key={post.slug} direction="up" delay={0.04 * i}>
                  <BlogCard
                    slug={post.slug}
                    title={post.title}
                    excerpt={post.excerpt}
                    category={post.category}
                    coverImage={post.featuredImage}
                    publishedAt={post.createdAt}
                    readTime={post.readTime}
                    lang={lang}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
