import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Riyad Ketami',
  description: 'Builder. Strategist. Operator.',
};

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0B0D',
        flexDirection: 'column',
        gap: '8px',
        fontFamily: '"JetBrains Mono", "Courier New", monospace',
      }}
    >
      <span style={{ color: '#6B7280', fontSize: '12px', letterSpacing: '0.15em' }}>
        // system online
      </span>
      <span style={{ color: '#00FF66', fontSize: '14px', letterSpacing: '0.1em' }}>
        riyadketami.com · {lang} · step 1 of 6
      </span>
      <span style={{ color: '#6B7280', fontSize: '11px', marginTop: '24px' }}>
        design system incoming ↓
      </span>
    </main>
  );
}
