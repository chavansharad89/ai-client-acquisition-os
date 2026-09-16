// Attribution: UTM parameters and Meta's browser identifiers.
// -----------------------------------------------------------------------
// Captured once on the landing page and carried for the rest of the
// session, because the UTM parameters only exist on the first URL — by
// the time someone reaches checkout they are long gone from the address
// bar.
//
// sessionStorage is the right home for this and not a contradiction of
// "never trust client storage for entitlement": attribution is a
// marketing signal, not a permission. Nothing is unlocked by it, and the
// worst case of a forged value is a mislabelled campaign.
// -----------------------------------------------------------------------

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  /** Meta's browser id cookie (_fbp). */
  fbp?: string;
  /** Meta's click id cookie (_fbc), or one derived from ?fbclid. */
  fbc?: string;
}

const STORAGE_KEY = 'acos_attribution';

const UTM_KEYS = [
  ['utm_source', 'utmSource'],
  ['utm_medium', 'utmMedium'],
  ['utm_campaign', 'utmCampaign'],
  ['utm_content', 'utmContent'],
] as const;

/** Campaign values are attacker-supplied URL text; keep them short and inert. */
function sanitise(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, 100);
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Pure: reads UTM parameters out of a query string. */
export function parseUtm(search: string): Attribution {
  const params = new URLSearchParams(search);
  const result: Attribution = {};
  for (const [param, field] of UTM_KEYS) {
    const value = sanitise(params.get(param));
    if (value) result[field] = value;
  }
  return result;
}

/** Pure: reads a named cookie out of a document.cookie string. */
export function readCookie(cookieString: string, name: string): string | undefined {
  for (const part of cookieString.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return sanitise(rest.join('=')) ?? undefined;
  }
  return undefined;
}

/**
 * Builds the `_fbc` value Meta expects when the cookie is absent.
 *
 * Format: `fb.<subdomainIndex>.<timestampMs>.<fbclid>`. Meta's own Pixel
 * writes this cookie, but only after it loads — a visitor who converts
 * before that, or with the Pixel blocked, would otherwise lose click
 * attribution entirely, so we reconstruct it from the URL.
 */
export function deriveFbcFromClickId(fbclid: string, now: number): string {
  return `fb.1.${now}.${fbclid}`;
}

export interface AttributionSources {
  search: string;
  cookies: string;
  now: number;
}

/** Pure: everything the session should remember about where this visit came from. */
export function collectAttribution({ search, cookies, now }: AttributionSources): Attribution {
  const attribution = parseUtm(search);

  const fbp = readCookie(cookies, '_fbp');
  if (fbp) attribution.fbp = fbp;

  const fbc = readCookie(cookies, '_fbc');
  if (fbc) {
    attribution.fbc = fbc;
  } else {
    const fbclid = sanitise(new URLSearchParams(search).get('fbclid'));
    if (fbclid) attribution.fbc = deriveFbcFromClickId(fbclid, now);
  }

  return attribution;
}

/**
 * Merges a newly observed attribution over what the session already knows.
 *
 * First touch wins for UTM — a visitor who arrives from a campaign, browses,
 * and returns via a direct link should still be credited to the campaign.
 * fbp/fbc are refreshed, because the newest cookie is the correct one.
 */
export function mergeAttribution(stored: Attribution, observed: Attribution): Attribution {
  // Built conditionally rather than with `?? undefined`: the project runs
  // exactOptionalPropertyTypes, so an absent field must be ABSENT, not
  // present-and-undefined. That distinction also keeps `undefined` out of
  // the JSON we persist and out of every event payload.
  const first = (a?: string, b?: string) => a ?? b;
  const merged: Attribution = {};
  const assign = (key: keyof Attribution, value: string | undefined) => {
    if (value !== undefined) merged[key] = value;
  };
  assign('utmSource', first(stored.utmSource, observed.utmSource));
  assign('utmMedium', first(stored.utmMedium, observed.utmMedium));
  assign('utmCampaign', first(stored.utmCampaign, observed.utmCampaign));
  assign('utmContent', first(stored.utmContent, observed.utmContent));
  assign('fbp', first(observed.fbp, stored.fbp));
  assign('fbc', first(observed.fbc, stored.fbc));
  return merged;
}

/** Drops undefined keys so events carry only what is actually known. */
export function compactAttribution(attribution: Attribution): Attribution {
  return Object.fromEntries(
    Object.entries(attribution).filter(([, value]) => value !== undefined),
  ) as Attribution;
}

export function loadAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {}; // private mode, blocked storage — attribution is optional
  }
}

/** Captures the current page's attribution, first-touch-wins, and persists it. */
export function captureAttribution(now: number = Date.now()): Attribution {
  if (typeof window === 'undefined') return {};
  const merged = compactAttribution(
    mergeAttribution(
      loadAttribution(),
      collectAttribution({
        search: window.location.search,
        cookies: document.cookie,
        now,
      }),
    ),
  );
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Non-fatal; the event still carries the values for this page view.
  }
  return merged;
}
