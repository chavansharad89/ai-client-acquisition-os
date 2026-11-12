import { deliverablesFor, getProduct, isValidProductId, type ProductId } from '@acos/catalog';
import { loadEnv } from '@acos/config';
import { isCmsEligibleProduct, toPublicContentItem } from '@acos/core-cms';
import { canAccessProduct, createDownloadGrant } from '@acos/core-entitlements';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';


import { LearningPathSelection } from '../../../components/access/LearningPathSelection';
import { ProductRoadmap } from '../../../components/access/ProductRoadmap';
import { RepositorySelection } from '../../../components/access/RepositorySelection';
import { TopicDetailView } from '../../../components/access/TopicDetailView';
import { learningPaths, resolvePathParam, resolveTopicParam } from '../../../components/access/topicNavigation';
import { AppShell } from '../../../components/app-shell/AppShell';
import { inter } from '../../../lib/fonts';
import { buildContentTree, type ContentTreeNode } from '../../../src/cms-admin/contentTree';
import { currentAccess } from '../../../src/server/access';
import { listAccessibleCmsContent } from '../../../src/server/cmsContentService';
import { commerceRepositories } from '../../../src/server/commerceRepositories';
import { getMaxSubscriptionStatus } from '../../../src/server/clientFinderStatus';
import { getCustomerDisplayName } from '../../../src/server/customerDisplayName';

import '../../../styles/tailwind-foundation.css';

// A product's contents. The direct-URL protection lives here.
// -----------------------------------------------------------------------
// Two denials, two destinations — collapsing them into one would dump a
// paying customer who simply hasn't bought THIS kit onto a sign-in wall.
//
// CUSTOMER FULFILLMENT PHASE B (Stages 1-3, spec §14/§17 Phase 4): behind
// CMS_ACCESS_CUTOVER_ENABLED (default false), this page reads CMS
// content_items instead of the legacy deliverables.ts manifest for the
// two CMS-eligible products. `ai_client_acquisition_1499` (the retired
// one-time SKU) is NEVER attempted via CMS, flag or no flag — it is out
// of CMS scope by an existing, separate architectural decision
// (@acos/core-subscriptions' cmsAccess.ts), not something this parallel-
// run boundary controls. The entitlement/plan check above
// (currentAccess -> resolveCmsAwarePurchased) is completely unchanged by
// any of this — it is the same single access decision whichever content
// source renders afterward.
//
// Variant-1 fallback (approved parallel-run boundary): if the flag is on
// for a CMS-eligible product but CMS currently has zero published items
// for it, this page falls back to deliverables.ts for THAT product,
// logging an observable `access.cms_fallback_to_legacy` event so Stage
// 3's "zero firings before cutover" exit criterion is checkable. It does
// NOT fall back for partial/incorrect CMS data (any published item at
// all is served from CMS, visibly wrong rather than silently masked),
// and this fallback must not survive Phase C.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

// CMS-PO-014 D3: Learning Path Selection applies to Plus only. Max keeps
// today's behavior (straight to ProductRoadmap over the whole tree)
// exactly — this record grants no implicit extension to it.
//
// 2026-11-12 (explicit user direction, superseding D3's "no implicit
// extension" note for Pro specifically — see completion report):
// Pro's bare overview now gets the same selection-first landing page as
// Plus, themed as a "Git Repositories" catalogue instead of "Learning
// Paths" (RepositorySelection, not LearningPathSelection). Any existing
// ?path=/?topic= deep link is untouched — it still resolves over the
// whole tree exactly as before this change.
const PLUS_PRODUCT_ID: ProductId = 'ai_income_99';
const PRO_PRODUCT_ID: ProductId = 'ai_freelancing_499';

// Shared by the Plus (path-scoped) and Pro/Max (whole-tree) branches
// below so the ?topic= resolution logic is written once.
function renderRoadmapOrTopic(
  tree: ContentTreeNode[],
  productId: string,
  displayName: string,
  topicParam: string | undefined,
) {
  const selectedTopic = resolveTopicParam(tree, topicParam);
  if (selectedTopic) {
    return <TopicDetailView tree={tree} productId={productId} displayName={displayName} topic={selectedTopic} />;
  }
  return <ProductRoadmap tree={tree} productId={productId} displayName={displayName} />;
}

function renderLibraryPage(
  displayName: string,
  items: ReadonlyArray<{ id: string; title: string; href: string }>,
) {
  return (
    <main id="main" className="shell">
      <div className="stack" style={{ maxWidth: '62ch' }}>
        <p style={{ margin: 0 }}>
          <Link href="/access">← Your library</Link>
        </p>
        <h1 className="page-title">{displayName}</h1>
        <div className="status status-good" role="status">
          <p style={{ margin: 0 }}>
            <strong>Unlocked.</strong> This kit is part of your library.
          </p>
        </div>
        <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item) => (
            <li key={item.id}>
              <a className="btn btn-secondary btn-block" href={item.href}>
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

/**
 * The CMS-backed tree for `productId`, or null if the CMS path should
 * not be used (flag off, product out of CMS scope, or zero published
 * ASSET rows anywhere in it — the Variant-1 fallback boundary above).
 * Unlike the flat-list predecessor this replaces, CONTAINER rows are
 * kept (not pre-discarded) — the fallback count below still counts only
 * ASSET rows, preserving the exact existing fallback semantics.
 */
async function cmsLibraryTree(productId: ProductId, userId: string): Promise<ContentTreeNode[] | null> {
  if (!loadEnv().CMS_ACCESS_CUTOVER_ENABLED || !isCmsEligibleProduct(productId)) return null;

  const { contentItems, subscriptionPeriods } = commerceRepositories();
  const items = await listAccessibleCmsContent({ contentItems, subscriptionPeriods }, userId);
  const filtered = items.filter((item) => item.owningProductId === productId);
  const assetCount = filtered.filter((item) => item.nodeType === 'ASSET').length;

  if (assetCount === 0) {
    console.warn(
      JSON.stringify({
        event: 'access.cms_fallback_to_legacy',
        productId,
        reason: 'zero-published-cms-items',
      }),
    );
    return null;
  }

  return buildContentTree(filtered.map(toPublicContentItem));
}

export default async function ProductAccessPage({
  params,
  searchParams,
}: {
  params: { productId: string };
  searchParams?: { topic?: string | string[]; path?: string | string[] };
}) {
  if (!isValidProductId(params.productId)) notFound();
  const product = getProduct(params.productId);
  const access = await currentAccess();

  // Unknown visitor: they need to log in, not see an offer.
  if (!access.granted) redirect('/access');

  // Known customer, wrong product: send them to the offer for it.
  if (!canAccessProduct(access.context.purchased, product.id)) {
    redirect(`/upsell/${product.id}`);
  }

  const displayName = await getCustomerDisplayName(product.id);
  const cmsTree = await cmsLibraryTree(product.id, access.context.userId);
  const maxStatus = await getMaxSubscriptionStatus(access.context.userId);
  // Captured locally — TypeScript cannot carry the `access.granted`
  // narrowing established above into the nested renderContent() closure.
  const { customerEmail, purchased } = access.context;

  // Same branching this page always had, just captured into one value
  // instead of four early returns, so there is a single wrap point for
  // the AppShell below — no conditional logic here was changed.
  function renderContent(): JSX.Element {
    if (cmsTree) {
      // A repeated ?topic= (or ?path=) key arrives as a string[], not a
      // string — the `typeof === 'string'` guard intentionally treats
      // that as "none selected" rather than picking one of the duplicates.
      const topicParam = typeof searchParams?.topic === 'string' ? searchParams.topic : undefined;
      const pathParam = typeof searchParams?.path === 'string' ? searchParams.path : undefined;

      if (product.id === PLUS_PRODUCT_ID) {
        // CMS-PO-014 (Plus only): always resolve a learning path before
        // entering its Roadmap View / Topic-wise View (D1); ?path=
        // identifies which depth-0 container to scope into, mirroring
        // CMS-PO-013's ?topic= pattern on this same route.
        const selectedPath = resolvePathParam(cmsTree, pathParam);
        if (!selectedPath) {
          return (
            <LearningPathSelection paths={learningPaths(cmsTree)} productId={product.id} displayName={displayName} />
          );
        }
        return renderRoadmapOrTopic([selectedPath], product.id, displayName, topicParam);
      }

      if (product.id === PRO_PRODUCT_ID) {
        // Pro landing page: the bare overview (no path AND no topic) shows
        // one card per depth-0 container as a "repository". A ?topic=
        // deep link alone (no ?path=) is deliberately NOT routed through
        // this gate — unlike Plus, it still resolves directly over the
        // whole tree, so every pre-existing Pro topic deep-link test keeps
        // passing unchanged. ?path= scopes into a single repository,
        // reusing the exact same resolvePathParam/renderRoadmapOrTopic
        // plumbing Plus uses — the eventual dedicated repository detail
        // page is a separate, later piece of work.
        if (!pathParam && !topicParam) {
          return (
            <RepositorySelection repositories={learningPaths(cmsTree)} productId={product.id} displayName={displayName} />
          );
        }
        const selectedPath = resolvePathParam(cmsTree, pathParam);
        return renderRoadmapOrTopic(selectedPath ? [selectedPath] : cmsTree, product.id, displayName, topicParam);
      }

      return renderRoadmapOrTopic(cmsTree, product.id, displayName, topicParam);
    }

    const secret = loadEnv().DOWNLOAD_GRANT_SECRET;
    const legacyItems = deliverablesFor(product.id).map((asset) => ({
      id: asset.id,
      title: asset.title,
      href: `/api/downloads/${product.id}/${asset.id}?grant=${encodeURIComponent(
        createDownloadGrant({ productId: product.id, assetId: asset.id, customerEmail }, secret),
      )}`,
    }));
    return renderLibraryPage(displayName, legacyItems);
  }

  return (
    <div className={`${inter.variable} font-sans`}>
      <AppShell email={customerEmail} purchased={purchased} maxStatus={maxStatus}>
        {renderContent()}
      </AppShell>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { productId: string } }) {
  if (!isValidProductId(params.productId)) return { title: 'Your library' };
  return { title: await getCustomerDisplayName(params.productId) };
}
