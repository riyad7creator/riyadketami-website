import { Suspense } from 'react';
import {
  Button,
  Pill,
  Badge,
  SectionHeader,
  Reveal,
  Card,
  Stat,
  Testimonial,
  PricingTier,
  BlogCard,
  LinkCard,
  TeamCard,
  Accordion,
  FormField,
} from '@/components/ui';
import TabsDemo from './TabsDemo';
import ToastDemo from './ToastDemo';
import MatrixDemo from './MatrixDemo';

export const metadata = { title: 'Design System' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-matrix border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-16 flex flex-col gap-16">
      <div>
        <h1 className="text-4xl font-display font-bold text-text-0 tracking-tight">Design System</h1>
        <p className="text-text-2 text-sm font-mono mt-2">Internal preview — not in nav</p>
      </div>

      {/* Colors */}
      <Section title="Colors">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: 'bg-0', color: 'var(--bg-0)' },
            { name: 'bg-1', color: 'var(--bg-1)' },
            { name: 'bg-2', color: 'var(--bg-2)' },
            { name: 'text-0', color: 'var(--text-0)' },
            { name: 'text-1', color: 'var(--text-1)' },
            { name: 'text-2', color: 'var(--text-2)' },
            { name: 'matrix', color: 'var(--matrix)' },
            { name: 'matrix-dim', color: 'var(--matrix-dim)' },
            { name: 'accent', color: 'var(--accent)' },
            { name: 'danger', color: 'var(--danger)' },
            { name: 'warning', color: 'var(--warning)' },
            { name: 'border', color: 'var(--border)' },
          ].map(({ name, color }) => (
            <div key={name} className="flex flex-col gap-2">
              <div
                className="h-12 rounded-[var(--radius-md)] border border-border"
                style={{ background: color }}
              />
              <span className="text-xs font-mono text-text-2">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <div className="flex flex-col gap-4">
          <p className="font-display text-5xl font-bold tracking-tight text-text-0">Display 5xl</p>
          <p className="font-display text-3xl font-bold tracking-tight text-text-0">Display 3xl</p>
          <p className="font-display text-xl font-semibold text-text-0">Heading XL</p>
          <p className="text-base text-text-1 leading-relaxed max-w-prose">
            Body text — Inter, 16px, text-1 color. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <p className="font-mono text-sm text-matrix">// Mono — JetBrains Mono, 14px</p>
          <p className="text-gradient-matrix font-display text-3xl font-bold">Matrix gradient</p>
          <p className="text-gradient-accent font-display text-3xl font-bold">Accent gradient</p>
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="secondary" disabled>Disabled</Button>
        </div>
      </Section>

      {/* Pills & Badges */}
      <Section title="Pills & Badges">
        <div className="flex flex-wrap gap-3 items-center">
          <Pill variant="matrix">Matrix</Pill>
          <Pill variant="accent">Accent</Pill>
          <Pill variant="neutral">Neutral</Pill>
          <Pill variant="danger">Danger</Pill>
          <Pill variant="warning">Warning</Pill>
          <Badge count={3}><Button variant="ghost" size="sm">Notifications</Button></Badge>
          <Badge dot><Button variant="ghost" size="sm">Online</Button></Badge>
        </div>
      </Section>

      {/* Cards */}
      <Section title="Cards">
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="p-6">
            <p className="text-text-1">Basic glass card</p>
          </Card>
          <Card tilt glow className="p-6">
            <p className="text-text-1">Tilt + glow card</p>
            <p className="text-xs text-text-2 mt-2 font-mono">Hover to see effect</p>
          </Card>
        </div>
      </Section>

      {/* Stats */}
      <Section title="Stats">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <Stat value={2400000} suffix="+" label="Followers" />
          <Stat value={47} suffix="+" label="Projects" />
          <Stat value={8} suffix=" yrs" label="Experience" />
          <Stat value={98} suffix="%" label="Client NPS" />
        </div>
      </Section>

      {/* Matrix */}
      <Section title="Matrix Effects">
        <Suspense>
          <MatrixDemo />
        </Suspense>
      </Section>

      {/* Tabs */}
      <Section title="Tabs">
        <Suspense>
          <TabsDemo />
        </Suspense>
      </Section>

      {/* Accordion */}
      <Section title="Accordion">
        <Accordion
          items={[
            { id: '1', question: 'What is The Signal?', answer: 'A focused 60-minute strategy session. One problem, one clear direction.' },
            { id: '2', question: 'What is The Sprint?', answer: 'A time-boxed execution sprint. Defined scope, delivered output in 2–3 weeks.' },
            { id: '3', question: 'What is The Stack?', answer: 'A retained partnership. Embedded strategy and ongoing execution at $5,500/mo.' },
          ]}
        />
      </Section>

      {/* Forms */}
      <Section title="Form Fields">
        <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
          <FormField label="Name" placeholder="Riyad Ketami" required />
          <FormField label="Email" type="email" placeholder="riyad@ketami.net" />
          <FormField label="With error" error="This field is required" placeholder="..." />
          <FormField label="With hint" hint="We'll never share your email" placeholder="..." />
          <div className="sm:col-span-2">
            <FormField as="textarea" label="Message" placeholder="Say something..." rows={4} />
          </div>
        </div>
      </Section>

      {/* Toast */}
      <Section title="Toast">
        <Suspense>
          <ToastDemo />
        </Suspense>
      </Section>

      {/* Content Cards */}
      <Section title="Blog Card">
        <div className="grid sm:grid-cols-2 gap-4">
          <BlogCard
            slug="example-post"
            title="How I built a $2M audience on TikTok in 18 months"
            excerpt="The exact strategy, tools, and mindset shifts that took me from zero to viral."
            category="Growth"
            publishedAt={new Date()}
            readTime={7}
            lang="en"
          />
          <BlogCard
            slug="example-post-2"
            title="The operator's guide to AI tools in 2025"
            excerpt="Which AI tools are actually worth paying for, and how to deploy them."
            category="AI"
            publishedAt={new Date()}
            readTime={12}
            lang="en"
          />
        </div>
      </Section>

      <Section title="Link Card">
        <div className="grid sm:grid-cols-2 gap-3">
          <LinkCard href="#" title="Free TikTok Growth Checklist" tag="Free Resource" description="47-point checklist I use before every video post." external />
          <LinkCard href="#" title="Notion OS Template" tag="Template" description="My complete second-brain operating system." external />
        </div>
      </Section>

      <Section title="Team Card">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg">
          <TeamCard name="Riyad Ketami" role="Founder" bio="Builder. Strategist. Operator." />
          <TeamCard name="Jane Smith" role="Editor" />
        </div>
      </Section>

      <Section title="Pricing Tiers">
        <div className="grid sm:grid-cols-3 gap-4">
          <PricingTier
            name="The Signal"
            price="$400"
            description="One problem, one direction."
            features={['60-min strategy session', 'Written brief', 'Action plan']}
            cta="Book a call"
          />
          <PricingTier
            name="The Sprint"
            price="$3,500"
            description="Defined scope, delivered."
            features={['2–3 week engagement', 'Dedicated Slack channel', 'Weekly reviews', 'Final deliverable']}
            cta="Start a sprint"
            featured
          />
          <PricingTier
            name="The Stack"
            price="$5,500"
            period="mo"
            description="Retained partnership."
            features={['Ongoing strategy', 'Async collaboration', 'Monthly reviews', 'Priority access']}
            cta="Apply now"
          />
        </div>
      </Section>

      <Section title="Testimonial">
        <div className="grid sm:grid-cols-2 gap-4">
          <Testimonial
            quote="Riyad helped us go from idea to launch in 3 weeks. The clarity he brought was remarkable."
            author="Alex Chen"
            title="Founder, BuildFast"
          />
          <Testimonial
            quote="The Signal session alone changed how our entire team thinks about growth."
            author="Sarah M."
            title="CMO, ScaleHQ"
          />
        </div>
      </Section>

      <Section title="SectionHeader">
        <SectionHeader
          eyebrow="// available for select engagements"
          title="Clarity, then execution."
          subtitle="Three tiers designed for different stages of ambition and urgency."
        />
        <SectionHeader
          eyebrow="// centered variant"
          title="Built for operators."
          subtitle="Not consultants. Not coaches. Operators."
          align="center"
        />
      </Section>
    </div>
  );
}
