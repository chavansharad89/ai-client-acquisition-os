import nodemailer from 'nodemailer';

import { mintActivationToken } from './activationToken';
import type { IdentityRepository } from './repository';

// Activation-link issuance + delivery (AUTH Phase 2, AUTH-PO-12).
// -----------------------------------------------------------------------
// Near-identical sibling of @acos/core-entitlements' claimEmail.ts (same
// `send({ to, url, expiresAt })` shape, same provider-selection
// reasoning) — reused deliberately rather than generalizing claimEmail
// itself, per AUTH_PHASE_1_PURCHASE_IDENTITY_ACTIVATION_DESIGN.md §12:
// the two flows (claim vs. activation) must stay structurally separate
// so AUTH-PO-30 ("claim_tokens is frozen for new purchases") remains a
// fact about the code, not a convention to remember.
//
// This file is the one place that mints an activation token, persists it
// (which is what invalidates any previous unconsumed token for the same
// user_id — AUTH-PO-07, enforced inside IdentityRepository.saveActivationToken),
// and hands it to an email sender, so "issue + invalidate-previous +
// send" cannot drift out of sync between call sites.
// -----------------------------------------------------------------------

export interface ActivationEmailMessage {
  to: string;
  activationUrl: string;
  expiresAt: Date;
}

export interface ActivationEmailSender {
  send(message: ActivationEmailMessage): Promise<void>;
}

/** Logs the message instead of sending it. Only ever selected for a non-production boot — see createActivationEmailSender. */
export class ConsoleActivationEmailSender implements ActivationEmailSender {
  async send(message: ActivationEmailMessage): Promise<void> {
    console.log(
      JSON.stringify({
        event: 'activation_email.console_delivery',
        to: message.to,
        activationUrl: message.activationUrl,
        expiresAt: message.expiresAt.toISOString(),
      }),
    );
  }
}

/** Minimal SMTP boundary this file talks to — satisfied by a real nodemailer transporter, and by a fake in tests. */
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

/** Development-only ActivationEmailSender over real Gmail SMTP — same rationale as claimEmail.ts's GmailDevClaimEmailSender. */
export class GmailDevActivationEmailSender implements ActivationEmailSender {
  private readonly config: GmailDevConfig;
  private readonly transport: SmtpTransport;

  constructor(config: GmailDevConfig, transport: SmtpTransport = createGmailSmtpTransport(config)) {
    this.config = config;
    this.transport = transport;
  }

  async send(message: ActivationEmailMessage): Promise<void> {
    await this.transport.sendMail({
      from: this.config.user,
      to: message.to,
      subject: 'Activate your Client Finder account',
      text:
        `Open this link to activate your account and access Client Finder:\n\n${message.activationUrl}\n\n` +
        `This link expires at ${message.expiresAt.toISOString()} and can only be used once. ` +
        `If you requested multiple links, only the most recent one will work. ` +
        `If you did not request this, you can ignore this email.`,
    });
  }
}

export class EmailProviderNotConfiguredError extends Error {
  constructor(provider: string | undefined) {
    super(
      provider
        ? `Email provider "${provider}" has no ActivationEmailSender implementation yet. ` +
          `Implement one and wire it into createActivationEmailSender before setting EMAIL_PROVIDER=${provider}.`
        : 'No transactional email provider is configured (EMAIL_PROVIDER unset) and this is a ' +
          'production boot, so activation emails cannot be delivered. Set EMAIL_PROVIDER=resend ' +
          'and RESEND_API_KEY/RESEND_FROM_EMAIL (AUTH-PO-12).',
    );
    this.name = 'EmailProviderNotConfiguredError';
  }
}

/** Resend's send-email REST endpoint — the one call this adapter makes. */
export interface ResendTransport {
  send(message: { from: string; to: string; subject: string; text: string }): Promise<void>;
}

export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
}

export class ResendNotConfiguredError extends Error {
  constructor() {
    super(
      'EMAIL_PROVIDER=resend requires RESEND_API_KEY and RESEND_FROM_EMAIL to be set. ' +
        'See .env.example "Production Resend activation-email delivery (AUTH-PO-12)".',
    );
    this.name = 'ResendNotConfiguredError';
  }
}

/** Thrown when Resend's API rejects or fails a send. Carries only the HTTP status — never the request/response body, which could echo the API key or recipient content into a log. */
export class ResendDeliveryError extends Error {
  constructor(status: number) {
    super(`Resend API request failed with status ${status}`);
    this.name = 'ResendDeliveryError';
  }
}

function createResendHttpTransport(apiKey: string): ResendTransport {
  return {
    async send(message) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      if (!response.ok) {
        throw new ResendDeliveryError(response.status);
      }
    },
  };
}

/**
 * Production ActivationEmailSender over the Resend HTTP API (AUTH-PO-12).
 *
 * `transport` is injectable (default: a real `fetch` call to Resend) so
 * tests exercise subject/body/recipient construction and failure
 * handling without a live API key or network call — the same shape as
 * GmailDevActivationEmailSender's injectable SmtpTransport above.
 */
export class ResendActivationEmailSender implements ActivationEmailSender {
  private readonly config: ResendConfig;
  private readonly transport: ResendTransport;

  constructor(config: ResendConfig, transport: ResendTransport = createResendHttpTransport(config.apiKey)) {
    this.config = config;
    this.transport = transport;
  }

  async send(message: ActivationEmailMessage): Promise<void> {
    await this.transport.send({
      from: this.config.fromEmail,
      to: message.to,
      subject: 'Activate your Client Finder account',
      text:
        `Open this link to activate your account and access Client Finder:\n\n${message.activationUrl}\n\n` +
        `This link expires at ${message.expiresAt.toISOString()} and can only be used once. ` +
        `If you requested multiple links, only the most recent one will work. ` +
        `If you did not request this, you can ignore this email.`,
    });
  }
}

/**
 * Resolves the ActivationEmailSender for this process — identical
 * selection rules to @acos/core-entitlements' createClaimEmailSender
 * (no provider in non-production -> console; 'gmail-dev' -> real Gmail
 * SMTP, never in production; 'resend' -> the AUTH-PO-12 production
 * provider; any other name, or none in production -> throws identifying
 * the gap).
 */
export function createActivationEmailSender(opts: {
  provider: string | undefined;
  nodeEnv: string;
  gmailDev?: GmailDevConfig | undefined;
  resend?: ResendConfig | undefined;
}): ActivationEmailSender {
  if (!opts.provider) {
    if (opts.nodeEnv === 'production') {
      throw new EmailProviderNotConfiguredError(undefined);
    }
    return new ConsoleActivationEmailSender();
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
    return new GmailDevActivationEmailSender(opts.gmailDev);
  }
  if (opts.provider === 'resend') {
    if (!opts.resend) {
      throw new ResendNotConfiguredError();
    }
    return new ResendActivationEmailSender(opts.resend);
  }
  throw new EmailProviderNotConfiguredError(opts.provider);
}

export function buildActivationUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/activate/${encodeURIComponent(token)}`;
}

/**
 * Issues a new activation token for `userId` and emails it to `email`.
 *
 * `email` must already be server-derived (read live from `users.email`
 * by the caller — design §5/§6 — never from a request body) by the time
 * it reaches here. The caller (an activation-eligibility service, not
 * this module) is responsible for deciding whether to call this at all —
 * this function always mints, invalidates-previous, and sends; it has no
 * opinion on eligibility, mirroring issueClaimLink's own boundary.
 */
export async function issueActivationLink(
  repository: Pick<IdentityRepository, 'saveActivationToken'>,
  sender: ActivationEmailSender,
  input: { userId: string; email: string; baseUrl: string },
  now: Date = new Date(),
): Promise<void> {
  const minted = mintActivationToken(now);
  await repository.saveActivationToken({
    tokenHash: minted.tokenHash,
    userId: input.userId,
    expiresAt: minted.expiresAt,
    now,
  });
  await sender.send({
    to: input.email,
    activationUrl: buildActivationUrl(input.baseUrl, minted.token),
    expiresAt: minted.expiresAt,
  });
}
