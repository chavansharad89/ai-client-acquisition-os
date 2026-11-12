import { Code2, GraduationCap, Hammer, TrendingUp } from 'lucide-react';

import { JourneyCard } from '@/components/app-shell/JourneyCard';
import { JourneyStages } from '@/components/app-shell/JourneyStages';

export const metadata = {
  title: 'Home',
};

const VALUE_PROPS = [
  { icon: GraduationCap, label: 'Gain in-demand AI skills' },
  { icon: Code2, label: 'Build real products' },
  { icon: TrendingUp, label: 'Acquire real clients' },
];

// Premium AI Command Centre dashboard (ACOS T1/T2). Three sections:
// A — editorial hero with the approved mountain-journey visual
// (public/dashboard/journey-hero.webp — cropped from the Product Owner's
// reference mockup, masked on its left edge so it fades into the hero
// surface rather than showing a hard photo edge); B — JourneyStages, the
// three connected Learn/Build/Sell stages (descriptive only, no CTAs);
// C — the actionable JourneyCard grid, copy approved per the T1 brief.
//
// No card-level subscription badge (dropped per the T2 reference, which
// has none): the sidebar's "Your Plans" block, fed by AppShell/layout.tsx,
// is already the single authoritative place that shows Plus/Pro/Max
// status, so this page has no entitlement data to fetch or render at
// all. No progress, lesson/project counts, or revenue either: none of
// those have a real data source yet, so the widgets are simply omitted
// rather than invented.
//
// Learning-destination verification (ACOS T1 brief §4): /access/ai_income_99
// is CMS-backed (CMS_ACCESS_CUTOVER_ENABLED=true) with published ASSET
// content under it, so ProductAccessPage renders LearningPathSelection /
// ProductRoadmap there — a genuine learning roadmap, not the legacy
// "AI Income Starter Kit" file-download page (that fallback only fires
// when a product has zero published CMS items). Confirmed directly
// against the dev database before reusing this destination.
export default function HomePage() {
  return (
    // No breadcrumb here — "Home / Home" on the dashboard itself is
    // redundant (the sidebar's active "Dashboard" item already says where
    // you are), and reclaiming that row plus its gap matters for the
    // above-the-fold budget on this page specifically.
    <main id="main" className="flex flex-col gap-5">
      {/* Hero: side-by-side only from lg (≥1024px) — text column 7/12,
          artwork panel 1/2, overlapping by a twelfth under the mask fade so
          the picture reads as bleeding in from the right. Below lg the text
          takes the full width and the artwork is dropped (see JourneyStages
          for why lg, not md, is the breakpoint used throughout this page).
          min-h targets the ~190px above-the-fold hero budget on desktop;
          tablet/mobile are unconstrained and just size to content. */}
      {/* Full-bleed: cancels AppShell's own content-wrapper padding
          (px-6 py-6, lg:px-10 py-8) with a matching negative margin so the
          hero sits flush against the header (top) and the content area's
          own edges (sides), instead of floating inside a gutter.
          Background: the exact same gradient as the Plus catalogue banner
          (LearningPathBanner.tsx) — one consistent banner treatment
          across /home, /access, and /access/[productId]. */}
      <section className="relative -mx-6 -mt-6 flex items-center overflow-hidden border-b border-border bg-[linear-gradient(135deg,#EEF3FF,#F2EDFF)] lg:-mx-10 lg:-mt-8 lg:min-h-[180px]">
        <div className="relative z-10 flex w-full flex-col gap-1.5 px-6 py-5 lg:w-7/12">
          <h1 className="text-balance text-2xl font-semibold leading-[1.15] tracking-tight text-foreground lg:text-[28px]">
            Turn AI knowledge into real-world impact.
          </h1>
          <p className="text-base font-medium text-foreground">Learn new skills. Build products. Find customers.</p>
          <p className="text-sm text-muted-foreground">One platform to take you from AI learner to AI entrepreneur.</p>
          <div className="mt-1.5 flex w-fit max-w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-card/70 px-3 py-1.5 text-sm text-muted-foreground">
            {VALUE_PROPS.map(({ icon: Icon, label }, index) => (
              <span key={label} className="flex items-center gap-1.5 whitespace-nowrap">
                {index > 0 && <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />}
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
        {/* Plain <img>, not next/image: this is a small (677×277, 18KB),
            fixed-crop decorative asset shown at exactly one size on one
            breakpoint (lg+) — there's no responsive srcset need, and
            next/image's optimizer intermittently served a wrongly-downscaled
            dev-cached variant for it (naturalWidth 253 instead of 677),
            which left a visible gap before the mask's fade zone. A plain
            tag always renders the real file. */}
        <img
          src="/dashboard/journey-hero.webp"
          alt=""
          className="hero-mountain-mask pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 object-contain object-right-bottom lg:block"
        />
      </section>

      <section aria-labelledby="your-ai-journey-heading" className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="your-ai-journey-heading" className="text-lg font-semibold tracking-tight text-foreground">
            Your AI journey
          </h2>
          <p className="text-sm text-muted-foreground">Three stages. One continuous journey.</p>
        </div>
        <JourneyStages />
      </section>

      <section aria-labelledby="choose-where-heading" className="flex flex-col gap-3">
        <h2 id="choose-where-heading" className="text-lg font-semibold tracking-tight text-foreground">
          Choose where to make progress
        </h2>
        {/* auto-rows-fr: every row takes the tallest card's height, so the
            three cards stay identical in height even when the grid wraps to
            2+1 between sm and lg; the orphan card then spans the full row
            rather than sitting half-width. */}
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 sm:[&>*:last-child]:col-span-2 lg:grid-cols-3 lg:[&>*:last-child]:col-span-1">
          <JourneyCard
            accent="plus"
            icon={GraduationCap}
            plan="PLUS"
            headline="Build your AI knowledge."
            description="Learn AI from fundamentals to advanced concepts through structured roadmaps, interactive lessons and guided learning."
            outcome="Become AI-skilled."
            ctaLabel="Explore Learning"
            href="/access/ai_income_99"
          />
          <JourneyCard
            accent="pro"
            icon={Hammer}
            plan="PRO"
            headline="Turn knowledge into working products."
            description="Build real-world AI applications using project blueprints, architecture, source code and implementation guides."
            outcome="Become an AI builder."
            ctaLabel="Explore Projects"
            href="/access/ai_freelancing_499"
          />
          <JourneyCard
            accent="max"
            icon={TrendingUp}
            plan="MAX"
            headline="Turn your skills into income."
            description="Discover potential clients, identify opportunities, qualify prospects and accelerate customer acquisition with AI."
            outcome="Become an AI entrepreneur."
            ctaLabel="Find Opportunities"
            href="/opportunities"
          />
        </div>
      </section>
    </main>
  );
}
