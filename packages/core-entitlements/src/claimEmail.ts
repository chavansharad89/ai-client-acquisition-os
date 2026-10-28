import nodemailer from 'nodemailer';

import { mintClaimToken } from './claimToken';
import type { EntitlementRepository } from './repository';

// Claim-link issuance + delivery — DEC-014.
// -----------------------------------------------------------------------
// DEC-014 D1: a claim link must reach the buyer by email; Razorpay
// order-ID possession alone must never be enough to activate an account.
// This file is the one place that mints a claim token, persists it
// (which is what makes any previous unused token for the same order
// stop working — DEC-014 D4, enforced inside saveClaimToken), and hands
// it to an email sender. Every caller — the webhook handler's
// post-grant step, reconciliation, and the resend endpoint — goes
// through this, so "issue + invalidate-previous + send" cannot drift
// out of sync between call sites.
//
// Deliberately takes a sender and a base URL as parameters rather than
// reading env or choosing a provider itself: this package has no
// business knowing what EMAIL_PROVIDER is set to, matching how
// apps/worker already resolves provider/model selection once, at its
// own boot, and hands concrete values down rather than letting a core
// package reach into process.env.
// -----------------------------------------------------------------------

export interface ClaimEmailMessage {
  to: string;
  claimUrl: string;
  expiresAt: Date;
}

export interface ClaimEmailSender {
  send(message: ClaimEmailMessage): Promise<void>;
}

/** Logs the message instead of sending it. Only ever selected for a non-production boot — see createClaimEmailSender. */
export class ConsoleClaimEmailSender implements ClaimEmailSender {
  async send(message: ClaimEmailMessage): Promise<void> {
    console.log(
      JSON.stringify({
        event: 'claim_email.console_delivery',
        to: message.to,
        claimUrl: message.claimUrl,
        expiresAt: message.expiresAt.toISOString(),
      }),
    );
  }
}

/**
 * Minimal SMTP boundary this file talks to — satisfied by a real
 * nodemailer transporter, and by a fake in tests. Keeping this narrow
 * (one method, the fields we actually set) is what makes
 * GmailDevClaimEmailSender's constructor injectable without pulling
 * nodemailer's types into every test.
 */
export interface SmtpTransport {
  sendMail(message: { from: string; to: string; subject: string; text: string }): Promise<unknown>;
}

export interface GmailDevConfig {
  user: string;
  appPassword: string;
}

export class GmailDevNotConfiguredError extends Error {
  constructor() {
    super(
      'EMAIL_PROVIDER=gmail-dev requires GMAIL_DEV_USER and GMAIL_DEV_APP_PASSWORD to be set. ' +
        'See .env.example "Development Gmail claim-email delivery" for what a Gmail App ' +
        'Password is and how to create one — a normal account password will not work.',
    );
    this.name = 'GmailDevNotConfiguredError';
  }
}

function createGmailSmtpTransport(config: GmailDevConfig): SmtpTransport {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: config.user, pass: config.appPassword },
  });
}

/**
 * Development-only ClaimEmailSender over real Gmail SMTP.
 * -----------------------------------------------------------------------
 * Exists to let a developer actually receive a claim email in an inbox
 * before a production transactional-email provider (Resend etc.) is
 * configured — see createClaimEmailSender's 'gmail-dev' branch, which is
 * the only caller and which refuses this in production. This class
 * itself has no opinion on environment; that guard belongs in the
 * factory, once, not duplicated here.
 *
 * `transport` is injectable so tests exercise real send/subject/body/
 * recipient construction without opening a real SMTP connection — the
 * default factory (real nodemailer) is only reached outside tests.
 * -----------------------------------------------------------------------
 */
export class GmailDevClaimEmailSender implements ClaimEmailSender {
  private readonly config: GmailDevConfig;
  private readonly transport: SmtpTransport;

  constructor(config: GmailDevConfig, transport: SmtpTransport = createGmailSmtpTransport(config)) {
    this.config = config;
    this.transport = transport;
  }

  async send(message: ClaimEmailMessage): Promise<void> {
    await this.transport.sendMail({
      from: this.config.user,
      to: message.to,
      subject: 'Your claim link',
      text:
        `Open this link to set your password and access your purchase:\n\n${message.claimUrl}\n\n` +
        `This link expires at ${message.expiresAt.toISOString()} and can only be used once. ` +
        `If you did not request this, you can ignore this email.`,
    });
  }
}

export class EmailProviderNotConfiguredError extends Error {
  constructor(provider: string | undefined) {
    super(
      provider
        ? `Email provider "${provider}" has no ClaimEmailSender implementation yet. ` +
          `Implement one and wire it into createClaimEmailSender before setting EMAIL_PROVIDER=${provider}.`
        : 'No transactional email provider is configured (EMAIL_PROVIDER unset) and this is a ' +
          'production boot, so claim-link emails cannot be delivered. Select a provider ' +
          '(e.g. Postmark, SES, Resend), add its credentials to env.ts/.env.example, and ' +
          'implement a ClaimEmailSender for it.',
    );
    this.name = 'EmailProviderNotConfiguredError';
  }
}

/**
 * Resolves the ClaimEmailSender for this process.
 *
 * No provider configured in a non-production environment: falls back to
 * logging, so local development and tests can exercise the claim flow
 * without real infrastructure. The same absence in production is a hard
 * failure — this must never silently pretend delivery happened.
 *
 * A provider NAME is configured: 'gmail-dev' selects
 * GmailDevClaimEmailSender — a development-only real-SMTP sender, never
 * available in production (see the guard below) — and resolves it from
 * `opts.gmailDev` rather than reading GMAIL_DEV_* out of process.env
 * itself, for the same reason this function already takes `provider`
 * and `nodeEnv` as parameters instead of calling loadEnv(): only the
 * caller (apps/web, apps/worker, each at their own boot) should decide
 * what environment this process is running in. Any other provider name
 * has no implementation yet, by design (see DEC-014's email-architecture
 * audit), and throws identifying exactly that gap rather than guessing
 * a vendor.
 */
export function createClaimEmailSender(opts: {
  provider: string | undefined;
  nodeEnv: string;
  gmailDev?: GmailDevConfig | undefined;
}): ClaimEmailSender {
  if (!opts.provider) {
    if (opts.nodeEnv === 'production') {
      throw new EmailProviderNotConfiguredError(undefined);
    }
    return new ConsoleClaimEmailSender();
  }
  if (opts.provider === 'gmail-dev') {
    if (opts.nodeEnv === 'production') {
      throw new Error(
        'EMAIL_PROVIDER=gmail-dev is a development-only sender over a personal Gmail account ' +
          'and must never be selected in production. Configure a real transactional provider instead.',
      );
    }
    if (!opts.gmailDev) {
      throw new GmailDevNotConfiguredError();
    }
    return new GmailDevClaimEmailSender(opts.gmailDev);
  }
  throw new EmailProviderNotConfiguredError(opts.provider);
}

export function buildClaimUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/claim/${encodeURIComponent(token)}`;
}

/**
 * Issues a new claim token for `orderId` and emails it to `customerEmail`.
 *
 * `customerEmail` must already be server-derived (from the order/
 * entitlement, never from a request body) by the time it reaches here —
 * this function does not re-derive or validate it, the same contract
 * saveClaimToken already has.
 */
export async function issueClaimLink(
  repository: Pick<EntitlementRepository, 'saveClaimToken'>,
  sender: ClaimEmailSender,
  input: { orderId: string; customerEmail: string; baseUrl: string },
  now: Date = new Date(),
): Promise<void> {
  const minted = mintClaimToken(now);
  await repository.saveClaimToken({
    tokenHash: minted.tokenHash,
    orderId: input.orderId,
    customerEmail: input.customerEmail,
    expiresAt: minted.expiresAt,
    now,
  });
  await sender.send({
    to: input.customerEmail,
    claimUrl: buildClaimUrl(input.baseUrl, minted.token),
    expiresAt: minted.expiresAt,
  });
}
