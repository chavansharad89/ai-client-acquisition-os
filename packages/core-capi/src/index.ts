import { createHash } from 'node:crypto';

import { fetchJsonTransport, type HttpTransport } from './transport';

export { fetchJsonTransport, MetaCapiTimeoutError, MetaCapiTransportError } from './transport';
export type { HttpTransport, HttpTransportResponse } from './transport';

export interface BuildPurchaseEventIdInput {
  paymentId: string;
}

/** Derive this once and persist it with the outbox record; never replace it on retry. */
export function buildPurchaseEventId({ paymentId }: BuildPurchaseEventIdInput): string {
  const normalized = paymentId.trim();
  if (!normalized) throw new MetaCapiValidationError('paymentId is required to build an event id');
  return `purchase_${createHash('sha256').update(normalized).digest('hex')}`;
}

export interface HashedUserData {
  em?: string;
  ph?: string;
}

export function hashUserData(raw: { email?: string; phone?: string }): HashedUserData {
  const email = raw.email?.trim().toLowerCase();
  const phone = raw.phone ? raw.phone.replace(/\D/g, '') : undefined;
  return { ...(email ? { em: sha256(email) } : {}), ...(phone ? { ph: sha256(phone) } : {}) };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Default HTTP timeout for a Meta CAPI call.
 *
 * Exported because the worker has to reason about it: its lease must
 * outlive any single request, and it cannot check that against a number
 * hidden inside this module. Two copies of this value would drift, and
 * the drift would only show up as duplicated conversions.
 */
export const DEFAULT_CAPI_TIMEOUT_MS = 10_000;

export interface MetaCapiConfig {
  pixelId: string;
  apiVersion: string;
  accessToken: string;
  timeoutMs?: number;
}

export interface SendMetaPurchaseInput {
  /** Persisted stable event id. Reuse this exact value on every retry. */
  eventId: string;
  /** Payment capture time, not the worker's retry time. */
  eventTime: Date;
  productId: string;
  productName: string;
  /** Major currency units (e.g. 499 for ₹499), not paise. */
  value: number;
  currency: string;
  email?: string;
  phone?: string;
  clientIp: string;
  userAgent: string;
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
}

export interface SendMetaPurchaseDeps {
  transport?: HttpTransport;
}

export class MetaCapiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MetaCapiValidationError';
  }
}

export class MetaCapiResponseError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'MetaCapiResponseError';
    this.status = status;
  }
}

/** Sends exactly one Meta Conversions API Purchase event. */
export async function sendMetaPurchase(
  config: MetaCapiConfig,
  input: SendMetaPurchaseInput,
  deps: SendMetaPurchaseDeps = {},
): Promise<void> {
  validateConfig(config);
  validateInput(input);
  const response = await (deps.transport ?? fetchJsonTransport)({
    url: `https://graph.facebook.com/${config.apiVersion}/${config.pixelId}/events`,
    timeoutMs: config.timeoutMs ?? DEFAULT_CAPI_TIMEOUT_MS,
    body: {
      access_token: config.accessToken,
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(input.eventTime.getTime() / 1000),
          action_source: 'website',
          event_id: input.eventId,
          ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
          user_data: {
            ...hashUserData({
              ...(input.email !== undefined ? { email: input.email } : {}),
              ...(input.phone !== undefined ? { phone: input.phone } : {}),
            }),
            client_ip_address: input.clientIp,
            client_user_agent: input.userAgent,
            ...(input.fbp ? { fbp: input.fbp } : {}),
            ...(input.fbc ? { fbc: input.fbc } : {}),
          },
          custom_data: {
            content_ids: [input.productId],
            contents: [{ id: input.productId, quantity: 1 }],
            content_name: input.productName,
            content_type: 'product',
            value: input.value,
            currency: input.currency,
          },
        },
      ],
    },
  });
  if (!response.ok)
    throw new MetaCapiResponseError(
      response.status,
      `Meta CAPI rejected the Purchase event (HTTP ${response.status})`,
    );
  if (!isAcceptedResponse(response.body))
    throw new MetaCapiResponseError(
      response.status,
      'Meta CAPI returned an invalid success response',
    );
}

function validateConfig(config: MetaCapiConfig): void {
  if (!config.pixelId.trim() || !config.accessToken.trim())
    throw new MetaCapiValidationError('Meta Pixel ID and access token are required');
  if (!/^v\d+\.\d+$/.test(config.apiVersion))
    throw new MetaCapiValidationError('Meta API version must use the format vNN.NN');
  if (
    config.timeoutMs !== undefined &&
    (!Number.isInteger(config.timeoutMs) || config.timeoutMs <= 0)
  )
    throw new MetaCapiValidationError('timeoutMs must be a positive integer');
}

function validateInput(input: SendMetaPurchaseInput): void {
  if (!input.eventId.trim() || !input.productId.trim() || !input.productName.trim())
    throw new MetaCapiValidationError('eventId, productId, and productName are required');
  if (!Number.isFinite(input.value) || input.value <= 0)
    throw new MetaCapiValidationError('value must be a positive finite number');
  if (!input.currency.trim() || !input.clientIp.trim() || !input.userAgent.trim())
    throw new MetaCapiValidationError('currency, clientIp, and userAgent are required');
  if (Number.isNaN(input.eventTime.getTime()))
    throw new MetaCapiValidationError('eventTime must be a valid date');
}

function isAcceptedResponse(body: unknown): body is { events_received: number } {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { events_received?: unknown }).events_received === 1
  );
}

// Compatibility aliases for callers written against the original scaffold.
export type DispatchCapiPurchaseInput = SendMetaPurchaseInput;
export const dispatchCapiPurchase = sendMetaPurchase;
