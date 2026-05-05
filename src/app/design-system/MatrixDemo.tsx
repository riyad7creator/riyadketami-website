'use client';

import MatrixRain from '@/components/ui/MatrixRain';
import MatrixText from '@/components/ui/MatrixText';

export default function MatrixDemo() {
  return (
    <div className="flex flex-col gap-6">
      <div className="relative h-32 rounded-[var(--radius-lg)] overflow-hidden border border-border bg-bg-1">
        <MatrixRain opacity={0.2} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-text-2 text-xs">MatrixRain canvas</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <MatrixText text="system online — all nodes responding" className="text-matrix text-sm" autoPlay />
        <MatrixText text="hover to scramble" className="text-accent text-sm" autoPlay={false} scrambleOnHover />
      </div>
    </div>
  );
}
