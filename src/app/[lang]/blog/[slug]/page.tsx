import type { Metadata } from 'next';


export const metadata: Metadata = { title: 'Post' };

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main style={{ minHeight: '100vh', background: '#0A0B0D', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '12px' }}>
      // post: {slug} — coming in step 4
    </main>
  );
}
