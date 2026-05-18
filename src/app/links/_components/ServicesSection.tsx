import MatrixText from '@/components/ui/MatrixText';
import Card from './Card';
import type { CardProps } from './Card';

export default function ServicesSection({ cards }: { cards: CardProps[] }) {
  if (cards.length === 0) return null;

  return (
    <section className="w-full flex flex-col gap-2.5" aria-label="Services">
      <MatrixText
        text="// work with me"
        className="font-mono text-[9px] tracking-[0.2em] text-matrix px-1"
      />
      <div className="flex flex-col gap-2.5">
        {cards.map((card) => (
          <Card key={card._id} {...card} />
        ))}
      </div>
    </section>
  );
}
