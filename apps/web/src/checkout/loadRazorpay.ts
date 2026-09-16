// Lazily loads Razorpay Checkout.
// -----------------------------------------------------------------------
// The 100KB+ SDK is fetched on the first checkout attempt, not on page
// load, so a product page stays fast for the majority of visitors who
// never open checkout. The promise is cached, so a retry after a
// dismissed modal does not re-download it.
// -----------------------------------------------------------------------

const SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { email?: string; contact?: string };
  handler: (response: { razorpay_payment_id: string }) => void;
  modal: { ondismiss: () => void };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let pending: Promise<RazorpayConstructor> | null = null;

export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('loadRazorpay: browser only'));
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (pending) return pending;

  pending = new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error('Razorpay Checkout loaded but did not initialise'));
    };
    script.onerror = () => {
      // Let a retry try again rather than caching the failure forever.
      pending = null;
      reject(new Error('Razorpay Checkout failed to load'));
    };
    document.head.appendChild(script);
  });
  return pending;
}
