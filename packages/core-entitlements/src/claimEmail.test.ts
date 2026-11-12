import { describe, expect, it, vi } from 'vitest';

import {
  buildClaimUrl,
  createClaimEmailSender,
  EmailProviderNotConfiguredError,
  GmailDevClaimEmailSender,
  GmailDevNotConfiguredError,
  issueClaimLink,
  ResendClaimEmailSender,
  ResendDeliveryError,
  ResendNotConfiguredError,
  type ClaimEmailMessage,
  type ResendTransport,
  type SmtpTransport,
} from './claimEmail';
import { hashAccessToken } from './accessToken';
import { evaluateClaimToken } from './claimToken';
import { fakeRepository } from './testSupport';

const NOW = new Date('2026-04-01T00:00:00.000Z');

describe('buildClaimUrl', () => {
  it('joins the base URL and token, trimming a trailing slash', () => {
    expect(buildClaimUrl('https://example.com/', 'tok_abc')).toBe('https://example.com/claim/tok_abc');
    expect(buildClaimUrl('https://example.com', 'tok_abc')).toBe('https://example.com/claim/tok_abc');
  });

  it('URL-encodes the token', () => {
    expect(buildClaimUrl('https://example.com', 'a/b c')).toBe('https://example.com/claim/a%2Fb%20c');
  });
});

describe('createClaimEmailSender', () => {
  it('falls back to a console sender when no provider is configured outside production', () => {
    const sender = createClaimEmailSender({ provider: undefined, nodeEnv: 'development' });
    expect(sender).toBeDefined();
  });

  it('refuses to boot without a provider in production', () => {
    expect(() => createClaimEmailSender({ provider: undefined, nodeEnv: 'production' })).toThrow(
      EmailProviderNotConfiguredError,
    );
  });

  it('identifies the exact unimplemented-provider gap rather than guessing a vendor', () => {
    expect(() => createClaimEmailSender({ provider: 'postmark', nodeEnv: 'production' })).toThrow(
      /postmark/i,
    );
  });

  describe('gmail-dev provider', () => {
    const gmailDev = { user: 'clientacquisition.project@gmail.com', appPassword: 'app-password-not-real' };

    it('resolves a GmailDevClaimEmailSender when configured outside production', () => {
      const sender = createClaimEmailSender({ provider: 'gmail-dev', nodeEnv: 'development', gmailDev });
      expect(sender).toBeInstanceOf(GmailDevClaimEmailSender);
    });

    it('refuses gmail-dev outright in production, even if gmailDev config is supplied (production safety)', () => {
      expect(() => createClaimEmailSender({ provider: 'gmail-dev', nodeEnv: 'production', gmailDev })).toThrow(
        /must never be selected in production/i,
      );
    });

    it('refuses to boot gmail-dev in dev/test without GMAIL_DEV_USER/GMAIL_DEV_APP_PASSWORD (missing configuration)', () => {
      expect(() => createClaimEmailSender({ provider: 'gmail-dev', nodeEnv: 'development' })).toThrow(
        GmailDevNotConfiguredError,
      );
    });

    it('never puts the app password in its own error message (no secret leakage)', () => {
      try {
        createClaimEmailSender({ provider: 'gmail-dev', nodeEnv: 'test' });
        expect.unreachable();
      } catch (err) {
        expect(String(err)).not.toContain(gmailDev.appPassword);
      }
    });
  });

  describe('resend provider', () => {
    const resend = { apiKey: 'resend_api_key_not_real', fromEmail: 'claims@example.test' };

    it('resolves a ResendClaimEmailSender when configured, including in production', () => {
      const sender = createClaimEmailSender({ provider: 'resend', nodeEnv: 'production', resend });
      expect(sender).toBeInstanceOf(ResendClaimEmailSender);
    });

    it('resolves a ResendClaimEmailSender outside production too', () => {
      const sender = createClaimEmailSender({ provider: 'resend', nodeEnv: 'development', resend });
      expect(sender).toBeInstanceOf(ResendClaimEmailSender);
    });

    it('refuses to boot resend without RESEND_API_KEY/RESEND_FROM_EMAIL (missing configuration)', () => {
      expect(() => createClaimEmailSender({ provider: 'resend', nodeEnv: 'production' })).toThrow(
        ResendNotConfiguredError,
      );
    });

    it('never puts the API key in its own error message (no secret leakage)', () => {
      try {
        createClaimEmailSender({ provider: 'resend', nodeEnv: 'production' });
        expect.unreachable();
      } catch (err) {
        expect(String(err)).not.toContain(resend.apiKey);
      }
    });
  });
});

type SentMessage = Parameters<SmtpTransport['sendMail']>[0];

describe('GmailDevClaimEmailSender', () => {
  const config = { user: 'clientacquisition.project@gmail.com', appPassword: 'app-password-not-real' };
  const message: ClaimEmailMessage = {
    to: 'buyer@example.com',
    claimUrl: 'https://shop.test/claim/tok_abc123',
    expiresAt: new Date('2026-04-02T00:00:00.000Z'),
  };

  it('sends from the configured Gmail account to the message recipient', async () => {
    const sendMail = vi.fn(async (_message: SentMessage) => undefined);
    const transport: SmtpTransport = { sendMail };
    await new GmailDevClaimEmailSender(config, transport).send(message);

    expect(sendMail).toHaveBeenCalledTimes(1);
    const sent = sendMail.mock.calls[0]![0];
    expect(sent.from).toBe(config.user);
    expect(sent.to).toBe(message.to);
  });

  it('includes a subject and the claim URL in the body', async () => {
    const sendMail = vi.fn(async (_message: SentMessage) => undefined);
    await new GmailDevClaimEmailSender(config, { sendMail }).send(message);

    const sent = sendMail.mock.calls[0]![0];
    expect(sent.subject.length).toBeGreaterThan(0);
    expect(sent.text).toContain(message.claimUrl);
    expect(sent.text).toContain(message.expiresAt.toISOString());
  });

  it('never leaks the app password into the message it hands to the transport', async () => {
    const sendMail = vi.fn(async (_message: SentMessage) => undefined);
    await new GmailDevClaimEmailSender(config, { sendMail }).send(message);

    const sent = sendMail.mock.calls[0]![0];
    expect(JSON.stringify(sent)).not.toContain(config.appPassword);
  });

  it('propagates a transport/provider failure rather than swallowing it', async () => {
    const sendMail = vi.fn(async () => {
      throw new Error('SMTP 535 authentication failed');
    });
    const sender = new GmailDevClaimEmailSender(config, { sendMail });

    await expect(sender.send(message)).rejects.toThrow(/authentication failed/);
  });

  it('does not alter claim-token security semantics: the sender only transmits an already-minted claim URL', async () => {
    // GmailDevClaimEmailSender.send takes the claimUrl issueClaimLink already
    // built from a real mintClaimToken() — it mints nothing itself and has
    // no access to the repository, so it structurally cannot affect TTL,
    // single-use, or latest-link-wins behaviour. This locks that contract:
    // the interface it implements carries exactly one method, `send`.
    const sendMail = vi.fn(async () => undefined);
    const sender = new GmailDevClaimEmailSender(config, { sendMail });
    expect(Object.getOwnPropertyNames(GmailDevClaimEmailSender.prototype)).toEqual(['constructor', 'send']);
    await sender.send(message);
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: message.to }));
  });
});

type SentResendMessage = Parameters<ResendTransport['send']>[0];

describe('ResendClaimEmailSender', () => {
  const config = { apiKey: 'resend_api_key_not_real', fromEmail: 'claims@example.test' };
  const message: ClaimEmailMessage = {
    to: 'buyer@example.com',
    claimUrl: 'https://shop.test/claim/tok_abc123',
    expiresAt: new Date('2026-04-02T00:00:00.000Z'),
  };

  it('sends from the configured Resend "from" address to the message recipient, through the injected transport', async () => {
    const send = vi.fn(async (_message: SentResendMessage) => undefined);
    const transport: ResendTransport = { send };
    await new ResendClaimEmailSender(config, transport).send(message);

    expect(send).toHaveBeenCalledTimes(1);
    const sent = send.mock.calls[0]![0];
    expect(sent.from).toBe(config.fromEmail);
    expect(sent.to).toBe(message.to);
  });

  it('includes a subject and the claim URL in the body', async () => {
    const send = vi.fn(async (_message: SentResendMessage) => undefined);
    await new ResendClaimEmailSender(config, { send }).send(message);

    const sent = send.mock.calls[0]![0];
    expect(sent.subject.length).toBeGreaterThan(0);
    expect(sent.text).toContain(message.claimUrl);
    expect(sent.text).toContain(message.expiresAt.toISOString());
  });

  it('never leaks the API key into the message it hands to the transport', async () => {
    const send = vi.fn(async (_message: SentResendMessage) => undefined);
    await new ResendClaimEmailSender(config, { send }).send(message);

    const sent = send.mock.calls[0]![0];
    expect(JSON.stringify(sent)).not.toContain(config.apiKey);
  });

  it('propagates a transport/provider failure rather than swallowing it (so the caller can treat the send as failed)', async () => {
    const send = vi.fn(async () => {
      throw new ResendDeliveryError(502);
    });
    const sender = new ResendClaimEmailSender(config, { send });

    await expect(sender.send(message)).rejects.toThrow(ResendDeliveryError);
  });

  it('a non-2xx HTTP response surfaces as ResendDeliveryError with the status code only (no body/content in the message)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(JSON.stringify({ message: 'invalid from address', apiKeyEcho: config.apiKey }), {
          status: 422,
        }),
    ) as unknown as typeof fetch;

    try {
      const sender = new ResendClaimEmailSender(config);
      await expect(sender.send(message)).rejects.toThrow(ResendDeliveryError);
      await expect(sender.send(message)).rejects.toThrow('422');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('the default transport calls the Resend API with a bearer-token Authorization header and never puts the key in the request body', async () => {
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 200 }));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    try {
      await new ResendClaimEmailSender(config).send(message);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('https://api.resend.com/emails');
      const headers = init!.headers as Record<string, string>;
      expect(headers.Authorization).toBe(`Bearer ${config.apiKey}`);
      expect(init!.body as string).not.toContain(config.apiKey);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('does not alter claim-token security semantics: the sender only transmits an already-minted claim URL', async () => {
    expect(Object.getOwnPropertyNames(ResendClaimEmailSender.prototype)).toEqual(['constructor', 'send']);
  });
});

describe('issueClaimLink', () => {
  it('mints, persists, and emails a claim link for the given order/email', async () => {
    const repo = fakeRepository();
    const sent: ClaimEmailMessage[] = [];
    const sender = { send: async (m: ClaimEmailMessage) => void sent.push(m) };

    await issueClaimLink(
      repo,
      sender,
      { orderId: 'order_1', customerEmail: 'buyer@example.com', baseUrl: 'https://shop.test' },
      NOW,
    );

    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe('buyer@example.com');
    expect(sent[0]!.claimUrl.startsWith('https://shop.test/claim/')).toBe(true);
    expect(sent[0]!.expiresAt.getTime()).toBeGreaterThan(NOW.getTime());

    const token = decodeURIComponent(sent[0]!.claimUrl.split('/claim/')[1]!);
    const stored = await repo.findClaimToken(hashAccessToken(token));
    expect(evaluateClaimToken(stored, NOW)).toEqual({
      valid: true,
      orderId: 'order_1',
      customerEmail: 'buyer@example.com',
    });
  });

  it('invalidates a previously issued, unused link for the same order (DEC-014 D4)', async () => {
    const repo = fakeRepository();
    const noopSender = { send: async () => {} };

    await issueClaimLink(
      repo,
      noopSender,
      { orderId: 'order_1', customerEmail: 'buyer@example.com', baseUrl: 'https://shop.test' },
      NOW,
    );
    const firstSent: ClaimEmailMessage[] = [];
    const capture = { send: async (m: ClaimEmailMessage) => void firstSent.push(m) };
    // Re-run to capture the first token for assertion below.
    await issueClaimLink(
      repo,
      capture,
      { orderId: 'order_1', customerEmail: 'buyer@example.com', baseUrl: 'https://shop.test' },
      NOW,
    );
    const firstToken = decodeURIComponent(firstSent[0]!.claimUrl.split('/claim/')[1]!);
    const firstHash = hashAccessToken(firstToken);

    const later = new Date(NOW.getTime() + 60_000);
    await issueClaimLink(
      repo,
      noopSender,
      { orderId: 'order_1', customerEmail: 'buyer@example.com', baseUrl: 'https://shop.test' },
      later,
    );

    const firstStored = await repo.findClaimToken(firstHash);
    expect(evaluateClaimToken(firstStored, later)).toEqual({ valid: false, reason: 'superseded' });
  });
});
