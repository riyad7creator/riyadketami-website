import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DOMPurify from 'isomorphic-dompurify';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { getBlogPost } from '@/lib/blog-data';
import { SITE_URL } from '@/lib/constants';
import { Pill, Reveal } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import ViewTracker from '@/components/blog/ViewTracker';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isValidLocale(lang)) return {};
  const post = await getBlogPost(lang, slug);
  if (!post) return { title: 'Post not found' };
  const APP_URL = SITE_URL;
  // Explicit fallback — this route defines its own `openGraph` object, which
  // means it no longer inherits the root opengraph-image.tsx file convention.
  const ogImage = post.featuredImage ?? `${APP_URL}/opengraph-image`;
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `${APP_URL}/${lang}/blog/${slug}`,
      publishedTime: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isValidLocale(lang)) notFound();

  const [post, dict] = await Promise.all([getBlogPost(lang, slug), Promise.resolve(getDictionary(lang))]);
  if (!post) notFound();

  const cleanHtml = DOMPurify.sanitize(post.content);

  const APP_URL = SITE_URL;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? '',
    url: `${APP_URL}/${lang}/blog/${post.slug}`,
    datePublished: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    image: post.featuredImage ?? undefined,
    author: { '@type': 'Person', name: 'Riyad Ketami', url: APP_URL },
    publisher: { '@type': 'Person', name: 'Riyad Ketami', url: APP_URL },
  };

  const date = new Date(post.createdAt).toLocaleDateString(
    lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <article className="pt-28 pb-24 px-5 sm:px-8">
      {/* Article JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Client-side view increment (fires once per page load, bypasses ISR) */}
      <ViewTracker slug={post.slug} />
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <Reveal direction="up">
          <Link
            href={`/${lang}/blog`}
            className="inline-flex items-center gap-2 font-mono text-xs text-text-2 hover:text-matrix transition-colors duration-[var(--duration-fast)] mb-10 group"
          >
            <ArrowLeft size={12} className="transition-transform duration-[var(--duration-fast)] group-hover:-translate-x-1 rtl:rotate-180" />
            {dict.blog.back}
          </Link>
        </Reveal>

        {/* Header */}
        <header className="flex flex-col gap-5 mb-10">
          {post.category && (
            <Reveal direction="up" delay={0.04}>
              <Pill variant="matrix">{post.category}</Pill>
            </Reveal>
          )}
          <Reveal direction="up" delay={0.08}>
            <h1 className="font-display font-bold text-[clamp(1.8rem,4vw,3rem)] tracking-[-0.02em] text-text-0 leading-[1.1]">
              {post.title}
            </h1>
          </Reveal>
          <Reveal direction="up" delay={0.12}>
            <div className="flex items-center gap-4 font-mono text-xs text-text-2">
              <span>{date}</span>
              {post.readTime && (
                <>
                  <span className="text-border">·</span>
                  <span>{post.readTime} {dict.blog.min_read}</span>
                </>
              )}
            </div>
          </Reveal>
        </header>

        {/* Featured image */}
        {post.featuredImage && (
          <Reveal direction="up" delay={0.16}>
            <div className="relative aspect-[16/9] w-full rounded-[var(--radius-lg)] overflow-hidden border border-border mb-10">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            </div>
          </Reveal>
        )}

        {/* Content */}
        <Reveal direction="up" delay={0.2}>
          <div
            className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:font-display prose-headings:text-text-0 prose-p:text-text-1 prose-a:text-matrix prose-a:no-underline hover:prose-a:underline prose-code:text-matrix prose-code:bg-bg-2 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-bg-1 prose-pre:border prose-pre:border-border prose-blockquote:border-matrix/40 prose-blockquote:text-text-2"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        </Reveal>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <Reveal direction="up" delay={0.1}>
            <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-border">
              {post.tags.map((tag) => (
                <span key={tag} className="font-mono text-xs text-text-2 border border-border rounded-full px-3 py-1">
                  #{tag}
                </span>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </article>
  );
}
