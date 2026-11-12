import Link from 'next/link';
import { GraduationCap, Hammer, TrendingUp, type LucideIcon } from 'lucide-react';

import {
  getProduct,
  isRetiredFromNewPurchases,
  PRODUCT_LADDER,
  type LadderProductId,
  type ProductId,
} from '@acos/catalog';

import { AppShell } from '../../components/app-shell/AppShell';
import { ResourceCard, type ResourceAccent } from '../../components/access/ResourceCard';
import { inter } from '../../lib/fonts';
import { formatInrDisplay } from '../../src/lib/format/inr';
import { currentAccess } from '../../src/server/access';
import { getMaxSubscriptionStatus } from '../../src/server/clientFinderStatus';
import { getCustomerDisplayName } from '../../src/server/customerDisplayName';

import '../../styles/tailwind-foundation.css';

// Ladder ids actually rendered as a card on this page. The retired
// one-time `ai_client_acquisition_1499` ("AI Client Acquisition System")
// is deliberately excluded here — it no longer gets a card at all; the
// Max card below replaces it, driven by real subscription status rather
// than this historical SKU. An existing owner's entitlement to it is
// unaffected (COMMERCIAL-PO-17) — only this listing's card is gone, the
// direct /access/ai_client_acquisition_1499 route still resolves (see
// that route's own entitlement check).
const DISPLAY_LADDER_IDS = PRODUCT_LADDER.filter(
  (id): id is Exclude<LadderProductId, 'ai_client_acquisition_1499'> => id !== 'ai_client_acquisition_1499',
);

// Journey/plan presentation for each displayed ladder product — purely
// visual metadata, no entitlement logic. `description` is verbatim from
// app/(app)/home/page.tsx's JourneyCard copy, same two products.
const JOURNEY_META: Record<
  (typeof DISPLAY_LADDER_IDS)[number],
  { accent: ResourceAccent; icon: LucideIcon; journeyLabel: string; planLabel: string; description?: string }
> = {
  ai_income_99: {
    accent: 'plus',
    icon: GraduationCap,
    journeyLabel: 'LEARN',
    planLabel: 'PLUS',
    description:
      'Learn AI from fundamentals to advanced concepts through structured roadmaps, interactive lessons and guided learning.',
  },
  ai_freelancing_499: {
    accent: 'pro',
    icon: Hammer,
    journeyLabel: 'BUILD',
    planLabel: 'PRO',
    description:
      'Build real-world AI applications using project blueprints, architecture, source code and implementation guides.',
  },
};

// Max — the 30-day Client Finder subscription (ai_client_acquisition_1499_
// subscription). Deliberately off PRODUCT_LADDER (PO-D2, ladder.test.ts):
// it governs Client Finder feature access, not a kit deliverable, so it
// is built as its own card rather than folded into the ladder map above.
// `unlocked` reads the same getMaxSubscriptionStatus() the sidebar's
// "Your Plans" block already uses, not `funnel`/`purchased`, which cannot
// represent this subscription. Copy is verbatim from /home's Max
// JourneyCard (the only existing approved "Sell" copy for this product).
const MAX_PRODUCT_ID = 'ai_client_acquisition_1499_subscription';
const MAX_META = {
  accent: 'max' as ResourceAccent,
  icon: TrendingUp,
  journeyLabel: 'SELL',
  planLabel: 'MAX',
  description:
    'Discover potential clients, identify opportunities, qualify prospects and accelerate customer acquisition with AI.',
};

// The library. Server-gated.
// -----------------------------------------------------------------------
// Entitlements are read on the server from the authenticated session
// cookie (DEC-010 item 2/5: account login, not an emailed link). There
// is no client-side purchase state anywhere in this page, so clearing or
// forging localStorage changes nothing about what opens.
//
// The signed-in view below is wrapped in the learner AppShell (same
// isolated Tailwind v4 CSS import other AppShell consumers use); the
// anonymous view above it is left exactly as it was — plain CSS, no
// shell — since there is nothing to navigate to yet and this page is
// itself the pre-auth entry point, same as /access/login.
// -----------------------------------------------------------------------

export const metadata = { title: 'Your library' };
export const dynamic = 'force-dynamic';

export default async function AccessPage() {
  const access = await currentAccess();

  if (!access.granted) {
    return (
      <main id="main" className="shell">
        <div className="stack" style={{ maxWidth: '56ch' }}>
          <h1 className="page-title">Open your library</h1>
          <p className="lede">
            Log in to the account you created after your purchase to see your kits here.
          </p>
          <p>
            <Link className="btn btn-primary" href="/access/login">
              Log in
            </Link>
          </p>
          <p>
            <Link className="btn btn-secondary" href="/">
              Back to the starter kit
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const { funnel } = access;
  const displayNameIds: readonly ProductId[] = [...DISPLAY_LADDER_IDS, MAX_PRODUCT_ID];
  const displayNames = Object.fromEntries(
    await Promise.all(displayNameIds.map(async (id) => [id, await getCustomerDisplayName(id)] as const)),
  );
  const maxStatus = await getMaxSubscriptionStatus(access.context.userId);
  const maxProduct = getProduct(MAX_PRODUCT_ID);
  const maxUnlocked = maxStatus.state === 'active';
  // Counts what's actually shown below: unlocked ladder cards (legacy
  // excluded, see DISPLAY_LADDER_IDS) plus the Max card when active.
  const resourceCount =
    DISPLAY_LADDER_IDS.filter((id) => funnel.accessible.includes(id)).length + (maxUnlocked ? 1 : 0);

  return (
    <div className={`${inter.variable} font-sans`}>
      <AppShell email={access.context.customerEmail} purchased={access.context.purchased} maxStatus={maxStatus}>
        <main id="main" className="flex flex-col gap-5">
          {/* Hero: same editorial pattern as app/(app)/home/page.tsx (text
              column + masked mountain artwork, side-by-side from lg) — kept
              consistent with the approved dashboard rather than a second,
              divergent hero treatment. */}
          {/* Full-bleed: cancels AppShell's own content-wrapper padding
              with a matching negative margin, same treatment as
              app/(app)/home/page.tsx's hero.
              Background: the exact same gradient as the Plus catalogue
              banner (LearningPathBanner.tsx) — one consistent banner
              treatment across /home, /access, and /access/[productId]. */}
          <section className="relative -mx-6 -mt-6 flex items-center overflow-hidden border-b border-border bg-[linear-gradient(135deg,#EEF3FF,#F2EDFF)] lg:-mx-10 lg:-mt-8 lg:min-h-[160px]">
            <div className="relative z-10 flex w-full flex-col gap-2 px-6 py-5 lg:w-7/12">
              <h1 className="text-balance text-2xl font-semibold leading-[1.15] tracking-tight text-foreground lg:text-[28px]">
                Your Resources
              </h1>
              <p className="text-sm text-muted-foreground">Everything you've unlocked, organised in one place.</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-card/70 px-3 py-1.5 text-sm text-muted-foreground">
                  {resourceCount} resource{resourceCount === 1 ? '' : 's'} available
                </span>
              </div>
            </div>
            <img
              src="/dashboard/journey-hero.webp"
              alt=""
              className="hero-mountain-mask pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 object-contain object-right-bottom lg:block"
            />
          </section>

          {/* Standalone logout button removed: Header's avatar now opens an
              account menu with the same Log out action (components/
              app-shell/Header.tsx) — the single logout surface for every
              AppShell page, not a per-page control. */}
          <section aria-label="Your resources" className="flex flex-col gap-4">
            {DISPLAY_LADDER_IDS.map((id) => ({
              id,
              product: getProduct(id),
              unlocked: funnel.accessible.includes(id),
            }))
              // Retired from new purchases (COMMERCIAL-PO-17): never offered
              // here to someone who doesn't already own it. An existing
              // owner's card is unaffected — `unlocked` short-circuits this.
              .filter(({ id, unlocked }) => unlocked || !isRetiredFromNewPurchases(id))
              .map(({ id, product, unlocked }) => {
                const meta = JOURNEY_META[id];
                return (
                  <ResourceCard
                    key={id}
                    accent={meta.accent}
                    icon={meta.icon}
                    journeyLabel={meta.journeyLabel}
                    planLabel={meta.planLabel}
                    title={displayNames[id] ?? product.name}
                    description={meta.description}
                    unlocked={unlocked}
                    priceLabel={unlocked ? undefined : formatInrDisplay(product.amountPaise)}
                    href={unlocked ? `/access/${id}` : `/checkout/${id}`}
                    ctaLabel={unlocked ? 'Open Resource' : 'Add it'}
                  />
                );
              })}
            <ResourceCard
              key={MAX_PRODUCT_ID}
              accent={MAX_META.accent}
              icon={MAX_META.icon}
              journeyLabel={MAX_META.journeyLabel}
              planLabel={MAX_META.planLabel}
              title={displayNames[MAX_PRODUCT_ID] ?? maxProduct.name}
              description={MAX_META.description}
              unlocked={maxUnlocked}
              priceLabel={maxUnlocked ? undefined : formatInrDisplay(maxProduct.amountPaise)}
              href={maxUnlocked ? '/opportunities' : `/checkout/${MAX_PRODUCT_ID}`}
              ctaLabel={maxUnlocked ? 'Open Resource' : 'Add it'}
            />
          </section>
        </main>
      </AppShell>
    </div>
  );
}
