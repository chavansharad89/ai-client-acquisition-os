import { describe, expect, it } from 'vitest';

import {
  collectAttribution,
  compactAttribution,
  deriveFbcFromClickId,
  mergeAttribution,
  parseUtm,
  readCookie,
} from './attribution';
import {
  assertNoPii,
  DEDUPLICATED_EVENTS,
  FUNNEL_EVENTS,
  PiiInEventError,
  toEventProperties,
  toPixelCustomData,
} from './funnelEvents';
import { buildPixelCall, MissingEventIdError } from './pixel';

const payload = {
  eventId: 'purchase_abc',
  productId: 'ai_freelancing_499' as const,
  value: 499,
  currency: 'INR',
  attribution: { utmSource: 'meta', fbp: 'fb.1.1.abc' },
};

describe('the ten funnel events', () => {
  it('are exactly the ones specified', () => {
    expect([...FUNNEL_EVENTS]).toEqual([
      'LandingPageView',
      'ProductView',
      'CheckoutStarted',
      'RazorpayOrderCreated',
      'PaymentCaptured',
      'Purchase',
      'UpsellShown',
      'UpsellAccepted',
      'UpsellDeclined',
      'ProductAccessed',
    ]);
  });

  it('mark Purchase as deduplicated against the server', () => {
    expect(DEDUPLICATED_EVENTS).toContain('Purchase');
  });
});

describe('UTM capture', () => {
  it('reads all four parameters', () => {
    expect(parseUtm('?utm_source=meta&utm_medium=cpc&utm_campaign=q2&utm_content=video_a')).toEqual(
      {
        utmSource: 'meta',
        utmMedium: 'cpc',
        utmCampaign: 'q2',
        utmContent: 'video_a',
      },
    );
  });

  it('omits absent parameters instead of sending empty strings', () => {
    expect(parseUtm('?utm_source=meta')).toEqual({ utmSource: 'meta' });
    expect(parseUtm('?utm_source=')).toEqual({});
    expect(parseUtm('')).toEqual({});
  });

  it('truncates a hostile campaign value', () => {
    const long = 'x'.repeat(500);
    expect(parseUtm(`?utm_campaign=${long}`).utmCampaign).toHaveLength(100);
  });

  it('keeps first touch when the visitor returns directly', () => {
    const merged = mergeAttribution(
      { utmSource: 'meta', utmCampaign: 'q2' },
      { utmSource: 'direct' },
    );
    expect(merged.utmSource).toBe('meta');
    expect(merged.utmCampaign).toBe('q2');
  });
});

describe('Meta browser identifiers', () => {
  it('reads _fbp and _fbc from the cookie jar', () => {
    const cookies = '_ga=x; _fbp=fb.1.1700.123; _fbc=fb.1.1700.click';
    expect(readCookie(cookies, '_fbp')).toBe('fb.1.1700.123');
    expect(readCookie(cookies, '_fbc')).toBe('fb.1.1700.click');
    expect(readCookie(cookies, '_missing')).toBeUndefined();
  });

  it('reconstructs fbc from fbclid when the cookie has not been written yet', () => {
    const attribution = collectAttribution({
      search: '?fbclid=CLICK123',
      cookies: '',
      now: 1_700_000_000_000,
    });
    expect(attribution.fbc).toBe('fb.1.1700000000000.CLICK123');
    expect(deriveFbcFromClickId('CLICK123', 1_700_000_000_000)).toBe(attribution.fbc);
  });

  it('prefers a real _fbc cookie over a reconstructed one', () => {
    const attribution = collectAttribution({
      search: '?fbclid=CLICK123',
      cookies: '_fbc=fb.1.1.real',
      now: 1,
    });
    expect(attribution.fbc).toBe('fb.1.1.real');
  });

  it('refreshes fbp/fbc rather than keeping a stale first touch', () => {
    const merged = mergeAttribution({ fbp: 'old' }, { fbp: 'new' });
    expect(merged.fbp).toBe('new');
  });

  it('omits unknown identifiers entirely', () => {
    expect(compactAttribution({ utmSource: 'meta', fbp: undefined } as never)).toEqual({
      utmSource: 'meta',
    });
    // mergeAttribution omits rather than sets undefined, so the key is gone.
    expect('fbp' in mergeAttribution({ utmSource: 'meta' }, {})).toBe(false);
  });
});

describe('no PII reaches the browser Pixel', () => {
  it.each([
    { email: 'a@b.com' },
    { customerEmail: 'a@b.com' },
    { phone: '+919876543210' },
    { customer_phone: '+919876543210' },
    { name: 'A Person' },
    { address: 'somewhere' },
    { ip: '203.0.113.8' },
  ])('refuses %s', (bad) => {
    expect(() => assertNoPii(bad)).toThrow(PiiInEventError);
  });

  it('refuses PII nested inside the payload', () => {
    expect(() => assertNoPii({ custom: { customerEmail: 'a@b.com' } })).toThrow(PiiInEventError);
  });

  it('allows the commercial and attribution fields', () => {
    expect(() => assertNoPii(toEventProperties(payload))).not.toThrow();
  });

  it('the Pixel payload carries no identifiers at all', () => {
    const data = toPixelCustomData(payload);
    expect(Object.keys(data).sort()).toEqual(['content_ids', 'content_type', 'currency', 'value']);
  });

  it('explains why, so the guard is not simply deleted', () => {
    expect(() => assertNoPii({ email: 'a@b.com' })).toThrow(/fbp\/fbc/);
  });
});

describe('event properties', () => {
  it('flatten attribution alongside the commercial facts', () => {
    expect(toEventProperties(payload)).toEqual({
      eventId: 'purchase_abc',
      productId: 'ai_freelancing_499',
      value: 499,
      currency: 'INR',
      utmSource: 'meta',
      fbp: 'fb.1.1.abc',
    });
  });

  it('carry value in rupees, never paise', () => {
    expect(toEventProperties(payload).value).toBe(499);
    expect(toEventProperties(payload).value).not.toBe(49_900);
  });
});

describe('Pixel deduplication', () => {
  it('passes eventID on every call', () => {
    expect(buildPixelCall('Purchase', payload).options).toEqual({ eventID: 'purchase_abc' });
  });

  it('maps funnel events onto Meta standard events where they exist', () => {
    expect(buildPixelCall('Purchase', payload)).toMatchObject({
      command: 'track',
      event: 'Purchase',
    });
    expect(buildPixelCall('ProductView', payload)).toMatchObject({
      command: 'track',
      event: 'ViewContent',
    });
    expect(buildPixelCall('CheckoutStarted', payload)).toMatchObject({
      command: 'track',
      event: 'InitiateCheckout',
    });
  });

  it('sends non-standard funnel events as custom events', () => {
    expect(buildPixelCall('UpsellShown', payload)).toMatchObject({
      command: 'trackCustom',
      event: 'UpsellShown',
    });
  });

  it('refuses to fire Purchase without an event id', () => {
    expect(() => buildPixelCall('Purchase', { ...payload, eventId: '' })).toThrow(
      MissingEventIdError,
    );
  });

  it('says why a missing id is fatal', () => {
    expect(() => buildPixelCall('Purchase', { ...payload, eventId: '' })).toThrow(/double-count/i);
  });
});
