import type { Metadata } from 'next';


export const metadata: Metadata = { title: 'Blog' };

export default async function BlogPage({ params }: { params: Promise<{ lang: string }> }) {
  await params;
  return (
    <main style={{ minHeight: '100vh', background: '#0A0B0D', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '12px' }}>
      // blog — coming in step 4
    </main>
  );
}
