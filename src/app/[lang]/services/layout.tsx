import MotionProvider from '@/components/MotionProvider';

// Framer Motion is scoped to the sections that still animate with it, so the
// home page ships no animation library (CSS handles its few transitions).
export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <MotionProvider>{children}</MotionProvider>;
}
