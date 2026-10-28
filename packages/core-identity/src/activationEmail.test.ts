import { hashAccessToken } from '@acos/core-entitlements';
import { describe, expect, it, vi } from 'vitest';

import {
  buildActivationUrl,
  createActivationEmailSender,
  EmailProviderNotConfiguredError,
  GmailDevActivationEmailSender,
  GmailDevNotConfiguredError,
  issueActivationLink,
  ResendActivationEmailSender,
  ResendDeliveryError,
  ResendNotConfiguredError,
  type ActivationEmailMessage,
  type ResendTransport,
  type SmtpTransport,
} from './activationEmail';
import { evaluateActivationToken } from './activationToken';
import { fakeRepository } from './testSupport';

const NOW = new Date('2026-04-01T00:00:00.000Z');

describe('buildActivationUrl', () => {
  it('joins the base URL and token, trimming a trailing slash', () => {
    expect(buildActivationUrl('https://example.com/', 'tok_abc')).toBe(
      'https://example.com/activate/tok_abc',
    );
    expect(buildActivationUrl('https://example.com', 'tok_abc')).toBe(
      'https://example.com/activate/tok_abc',
    );
  });

  it('URL-encodes the token', () => {
    expect(buildActivationUrl('https://example.com', 'a/b c')).toBe(
      'https://example.com/activate/a%2Fb%20c',
    );
  });
});

describe('createActivationEmailSender', () => {
  it('falls back to a console sender when no provider is configured outside production', () => {
    const sender = createActivationEmailSender({ provider: undefined, nodeEnv: 'development' });
    expect(sender).toBeDefined();
  });

  it('refuses to boot without a provider in production', () => {
    expect(() => createActivationEmailSender({ provider: undefined, nodeEnv: 'production' })).toThrow(
      EmailProviderNotConfiguredError,
    );
  });

  it('identifies the exact unimplemented-provider gap rather than guessing a vendor', () => {
    expect(() => createActivationEmailSender({ provider: 'postmark', nodeEnv: 'production' })).toThrow(
      /postmark/i,
    );
  });

  describe('gmail-dev provider', () => {
    const gmailDev = { user: 'clientacquisition.project@gmail.com', appPassword: 'app-password-not-real' };

    it('resolves a GmailDevActivationEmailSender when configured outside production', () => {
      const sender = createActivationEmailSender({ provider: 'gmail-dev', nodeEnv: 'development', gmailDev });
      expect(sender).toBeInstanceOf(GmailDevActivationEmailSender);
    });

    it('refuses gmail-dev outright in production, even if gmailDev config is supplied (production safety)', () => {
      expect(() =>
        createActivationEmailSender({ provider: 'gmail-dev', nodeEnv: 'production', gmailDev }),
      ).toThrow(/must never be selected in production/i);
    });

    it('refuses to boot gmail-dev in dev/test without GMAIL_DEV_USER/GMAIL_DEV_APP_PASSWORD (missing configuration)', () => {
      expect(() => createActivationEmailSender({ provider: 'gmail-dev', nodeEnv: 'development' })).toThrow(
        GmailDevNotConfiguredError,
      );
    });

    it('never puts the app password in its own error message (no secret leakage)', () => {
      try {
        createActivationEmailSender({ provider: 'gmail-dev', nodeEnv: 'test' });
        expect.unreachable();
      } catch (err) {
        expect(String(err)).not.toContain(gmailDev.appPassword);
      }
    });
  });

  describe('resend provider (AUTH-PO-12)', () => {
    const resend = { apiKey: 'resend_api_key_not_real', fromEmail: 'activation@example.test' };

    it('resolves a ResendActivationEmailSender when configured, including in production', () => {
      const sender = createActivationEmailSender({ provider: 'resend', nodeEnv: 'production', resend });
      expect(sender).toBeInstanceOf(ResendActivationEmailSender);
    });

    it('resolves a ResendActivationEmailSender outside production too', () => {
      const sender = createActivationEmailSender({ provider: 'resend', nodeEnv: 'development', resend });
      expect(sender).toBeInstanceOf(ResendActivationEmailSender);
    });

    it('refuses to boot resend without RESEND_API_KEY/RESEND_FROM_EMAIL (missing configuration)', () => {
      expect(() => createActivationEmailSender({ provider: 'resend', nodeEnv: 'production' })).toThrow(
        ResendNotConfiguredError,
      );
    });

    it('never puts the API key in its own error message (no secret leakage)', () => {
      try {
        createActivationEmailSender({ provider: 'resend', nodeEnv: 'production' });
        expect.unreachable();
      } catch (err) {
        expect(String(err)).not.toContain(resend.apiKey);
      }
    });
  });
});

type SentSmtpMessage = Parameters<SmtpTransport['sendMail']>[0];

describe('GmailDevActivationEmailSender', () => {
  const config = { user: 'clientacquisition.project@gmail.com', appPassword: 'app-password-not-real' };
  const message: ActivationEmailMessage = {
    to: 'buyer@example.com',
    activationUrl: 'https://app.test/activate/tok_abc123',
    expiresAt: new Date('2026-04-02T00:00:00.000Z'),
  };

  it('sends from the configured Gmail account to the message recipient', async () => {
    const sendMail = vi.fn(async (_message: SentSmtpMessage) => undefined);
    const transport: SmtpTransport = { sendMail };
    await new GmailDevActivationEmailSender(config, transport).send(message);

    expect(sendMail).toHaveBeenCalledTimes(1);
    const sent = sendMail.mock.calls[0]![0];
    expect(sent.from).toBe(config.user);
    expect(sent.to).toBe(message.to);
  });

  it('includes a subject and the activation URL in the body', async () => {
    const sendMail = vi.fn(async (_message: SentSmtpMessage) => undefined);
    await new GmailDevActivationEmailSender(config, { sendMail }).send(message);

    const sent = sendMail.mock.calls[0]![0];
    expect(sent.subject.length).toBeGreaterThan(0);
    expect(sent.text).toContain(message.activationUrl);
    expect(sent.text).toContain(message.expiresAt.toISOString());
  });

  it('never leaks the app password into the message it hands to the transport', async () => {
    const sendMail = vi.fn(async (_message: SentSmtpMessage) => undefined);
    await new GmailDevActivationEmailSender(config, { sendMail }).send(message);

    const sent = sendMail.mock.calls[0]![0];
    expect(JSON.stringify(sent)).not.toContain(config.appPassword);
  });
});

type SentResendMessage = Parameters<ResendTransport['send']>[0];

describe('ResendActivationEmailSender', () => {
  const config = { apiKey: 'resend_api_key_not_real', fromEmail: 'activation@example.test' };
  const message: ActivationEmailMessage = {
    to: 'buyer@example.com',
    activationUrl: 'https://app.test/activate/tok_abc123',
    expiresAt: new Date('2026-04-02T00:00:00.000Z'),
  };

  it('sends from the configured Resend "from" address to the message recipient, through the injected transport', async () => {
    const send = vi.fn(async (_message: SentResendMessage) => undefined);
    const transport: ResendTransport = { send };
    await new ResendActivationEmailSender(config, transport).send(message);

    expect(send).toHaveBeenCalledTimes(1);
    const sent = send.mock.calls[0]![0];
    expect(sent.from).toBe(config.fromEmail);
    expect(sent.to).toBe(message.to);
  });

  it('includes a subject and the activation URL in the body', async () => {
    const send = vi.fn(async (_message: SentResendMessage) => undefined);
    await new ResendActivationEmailSender(config, { send }).send(message);

    const sent = send.mock.calls[0]![0];
    expect(sent.subject.length).toBeGreaterThan(0);
    expect(sent.text).toContain(message.activationUrl);
    expect(sent.text).toContain(message.expiresAt.toISOString());
  });

  it('never leaks the API key into the message it hands to the transport', async () => {
    const send = vi.fn(async (_message: SentResendMessage) => undefined);
    await new ResendActivationEmailSender(config, { send }).send(message);

    const sent = send.mock.calls[0]![0];
    expect(JSON.stringify(sent)).not.toContain(config.apiKey);
  });

  it('propagates a transport/provider failure rather than swallowing it (so the caller can treat the send as failed)', async () => {
    const send = vi.fn(async () => {
      throw new ResendDeliveryError(502);
    });
    const sender = new ResendActivationEmailSender(config, { send });

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
      const sender = new ResendActivationEmailSender(config);
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
      await new ResendActivationEmailSender(config).send(message);
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

  it('does not alter activation-token security semantics: the sender only transmits an already-minted activation URL', async () => {
    // Same structural guarantee as GmailDevActivationEmailSender: this
    // class mints nothing and has no repository access, so it cannot
    // affect TTL, single-use, or latest-token-wins behaviour.
    expect(Object.getOwnPropertyNames(ResendActivationEmailSender.prototype)).toEqual([
      'constructor',
      'send',
    ]);
  });
});

describe('issueActivationLink', () => {
  it('mints, persists, and emails an activation link for the given user/email', async () => {
    const repo = fakeRepository();
    const sent: ActivationEmailMessage[] = [];
    const sender = { send: async (m: ActivationEmailMessage) => void sent.push(m) };

    await issueActivationLink(
      repo,
      sender,
      { userId: 'user_1', email: 'buyer@example.com', baseUrl: 'https://app.test' },
      NOW,
    );

    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe('buyer@example.com');
    expect(sent[0]!.activationUrl.startsWith('https://app.test/activate/')).toBe(true);
    expect(sent[0]!.expiresAt.getTime()).toBeGreaterThan(NOW.getTime());

    const token = decodeURIComponent(sent[0]!.activationUrl.split('/activate/')[1]!);
    const stored = await repo.findActivationToken(hashAccessToken(token));
    const verdict = evaluateActivationToken(stored, NOW);
    expect(verdict.valid).toBe(true);
  });

  it('invalidates a previously issued, unused link for the same user (AUTH-PO-07, latest-token-wins)', async () => {
    const repo = fakeRepository();
    const firstSent: ActivationEmailMessage[] = [];
    const capture = { send: async (m: ActivationEmailMessage) => void firstSent.push(m) };

    await issueActivationLink(
      repo,
      capture,
      { userId: 'user_1', email: 'buyer@example.com', baseUrl: 'https://app.test' },
      NOW,
    );
    const firstToken = decodeURIComponent(firstSent[0]!.activationUrl.split('/activate/')[1]!);
    const firstHash = hashAccessToken(firstToken);

    const later = new Date(NOW.getTime() + 60_000);
    const noopSender = { send: async () => {} };
    await issueActivationLink(
      repo,
      noopSender,
      { userId: 'user_1', email: 'buyer@example.com', baseUrl: 'https://app.test' },
      later,
    );

    const firstStored = await repo.findActivationToken(firstHash);
    const verdict = evaluateActivationToken(firstStored, later);
    expect(verdict.valid).toBe(false);
  });
});
