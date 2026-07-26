import MatrixText from '@/components/ui/MatrixText';
import Card from './Card';
import type { CardProps } from './Card';

export default function ResourcesSection({ cards }: { cards: CardProps[] }) {
  if (cards.length === 0) return null;

  return (
    <section className="w-full flex flex-col gap-2.5" aria-label="Free resources">
      <MatrixText
        text="// free resources"
        className="font-mono text-[10px] tracking-[0.2em] text-matrix px-1"
      />
      <div className="flex flex-col gap-2.5">
        {cards.map((card) => (
          <Card key={card._id} {...card} />
        ))}
      </div>
    </section>
  );
}
