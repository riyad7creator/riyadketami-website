import MatrixText from '@/components/ui/MatrixText';
import Card from './Card';
import type { CardProps } from './Card';

interface SponsoredSectionProps {
  cards: CardProps[];
  isFallback: boolean;
}

export default function SponsoredSection({ cards, isFallback }: SponsoredSectionProps) {
  if (cards.length === 0) return null;

  return (
    <section
      className="w-full flex flex-col gap-2.5"
      aria-label={isFallback ? 'Featured' : 'Sponsored'}
    >
      <MatrixText
        text={isFallback ? '// featured' : '// sponsored'}
        className="font-mono text-[10px] tracking-[0.2em] text-matrix px-1"
      />
      <div className="flex flex-col gap-2.5">
        {cards.map((card, idx) => (
          <Card key={card._id} {...card} featured={idx === 0} />
        ))}
      </div>
    </section>
  );
}
