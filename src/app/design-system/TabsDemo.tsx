'use client';

import Tabs from '@/components/ui/Tabs';

export default function TabsDemo() {
  return (
    <Tabs
      tabs={[
        { id: 'strategy', label: 'Strategy', content: <div className="pt-4 text-text-1 text-sm">Strategy content goes here.</div> },
        { id: 'execution', label: 'Execution', content: <div className="pt-4 text-text-1 text-sm">Execution content goes here.</div> },
        { id: 'results', label: 'Results', content: <div className="pt-4 text-text-1 text-sm">Results content goes here.</div> },
      ]}
    />
  );
}
