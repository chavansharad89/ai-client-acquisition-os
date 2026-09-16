import Link from 'next/link';

// Post-payment page.
// -----------------------------------------------------------------------
// Reached after Razorpay returns, which means the BROWSER believes the
// payment went through. This page is therefore written to confirm receipt,
// not entitlement: it promises an email once the signed webhook settles,
// and it grants nothing. Anyone can navigate here directly, so it must
// never be the thing that unlocks a product.
// -----------------------------------------------------------------------

export const metadata = { title: 'Payment received' };

export default function CheckoutSuccessPage() {
  return (
    <main id="main" className="shell">
      <div className="stack" style={{ maxWidth: '60ch' }}>
        <h1 className="page-title">Payment received</h1>
        <p className="lede">
          Thanks — we have your payment and we&rsquo;re confirming it with our payment provider now.
          That usually takes under a minute.
        </p>
        <div className="status status-pending" role="status">
          <p style={{ margin: 0 }}>
            <strong>Your kit is on its way by email.</strong> You don&rsquo;t need to keep this page
            open. If it hasn&rsquo;t arrived in 15 minutes, check your spam folder, then contact
            support with your email address.
          </p>
        </div>
        <p>
          <Link className="btn btn-secondary" href="/">
            Back to all kits
          </Link>
        </p>
      </div>
    </main>
  );
}
