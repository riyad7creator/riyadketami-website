import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Riyad Ketami: Builder. Creator. Entrepreneur.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#111111',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #00CD29 0%, transparent 60%)',
          }}
        />

        {/* Ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,205,41,0.08) 0%, transparent 70%)',
          }}
        />

        {/* "RK." minimal mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#F4F4EF', letterSpacing: -1 }}>
            RK
          </span>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#00CD29' }}>.</span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: 13,
              letterSpacing: '0.2em',
              color: '#00CD29',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
            }}
          >
            // builder · creator · entrepreneur
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#F4F4EF',
              lineHeight: 1.0,
              letterSpacing: 0,
            }}
          >
            RIYAD KETAMI
          </div>
          <div style={{ fontSize: 22, color: '#9A9A94', lineHeight: 1.4, maxWidth: 560 }}>
            AI consulting, content creation, and digital entrepreneurship.
            400K+ community across platforms.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'rgba(154,154,148,0.65)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            riyadketami.com
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            {['TikTok', 'YouTube', 'Instagram'].map((s) => (
              <span key={s} style={{ fontSize: 13, color: 'rgba(154,154,148,0.45)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                {s.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
