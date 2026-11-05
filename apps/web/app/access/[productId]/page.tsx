import { deliverablesFor, getProduct, isValidProductId, type ProductId } from '@acos/catalog';
import { loadEnv } from '@acos/config';
import { isCmsEligibleProduct, toPublicContentItem } from '@acos/core-cms';
import { canAccessProduct, createDownloadGrant } from '@acos/core-entitlements';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';


import { ProductRoadmap } from '../../../components/access/ProductRoadmap';
import { TopicDetailView } from '../../../components/access/TopicDetailView';
import { resolveTopicParam } from '../../../components/access/topicNavigation';
import { buildContentTree, type ContentTreeNode } from '../../../src/cms-admin/contentTree';
import { currentAccess } from '../../../src/server/access';
import { listAccessibleCmsContent } from '../../../src/server/cmsContentService';
import { commerceRepositories } from '../../../src/server/commerceRepositories';
import { getCustomerDisplayName } from '../../../src/server/customerDisplayName';

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
  searchParams?: { topic?: string | string[] };
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
  if (cmsTree) {
    // A repeated ?topic= key arrives as a string[], not a string — the
    // `typeof === 'string'` guard intentionally treats that as
    // "no topic selected" rather than picking one of the duplicates.
    const topicParam = typeof searchParams?.topic === 'string' ? searchParams.topic : undefined;
    const selectedTopic = resolveTopicParam(cmsTree, topicParam);
    if (selectedTopic) {
      return <TopicDetailView tree={cmsTree} productId={product.id} displayName={displayName} topic={selectedTopic} />;
    }
    return <ProductRoadmap tree={cmsTree} productId={product.id} displayName={displayName} />;
  }

  const secret = loadEnv().DOWNLOAD_GRANT_SECRET;
  const legacyItems = deliverablesFor(product.id).map((asset) => ({
    id: asset.id,
    title: asset.title,
    href: `/api/downloads/${product.id}/${asset.id}?grant=${encodeURIComponent(
      createDownloadGrant(
        { productId: product.id, assetId: asset.id, customerEmail: access.context.customerEmail },
        secret,
      ),
    )}`,
  }));
  return renderLibraryPage(displayName, legacyItems);
}

export async function generateMetadata({ params }: { params: { productId: string } }) {
  if (!isValidProductId(params.productId)) return { title: 'Your library' };
  return { title: await getCustomerDisplayName(params.productId) };
}
