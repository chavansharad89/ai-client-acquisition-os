import { permanentRedirect } from 'next/navigation';

// This product (ai_client_acquisition_1499) is retired from new
// purchases (COMMERCIAL-PO-05/17) — this route no longer offers a
// purchase path. Redirecting rather than deleting the route preserves
// any existing bookmarks/links while sending a new visitor to the
// current ₹1,499 product, AI Client Finder — 30 Days.
export default function ClientAcquisitionSystemPage(): never {
  permanentRedirect('/kits');
}
