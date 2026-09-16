export interface HttpTransportResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

export type HttpTransport = (request: {
  url: string;
  body: unknown;
  timeoutMs: number;
}) => Promise<HttpTransportResponse>;

export class MetaCapiTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Meta CAPI request timed out after ${timeoutMs}ms`);
    this.name = 'MetaCapiTimeoutError';
  }
}

export class MetaCapiTransportError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'MetaCapiTransportError';
    if (cause !== undefined) this.cause = cause;
  }
}

/** Sends JSON without placing the access token in a loggable URL. */
export const fetchJsonTransport: HttpTransport = async ({ url, body, timeoutMs }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch (cause) {
      throw new MetaCapiTransportError('Meta CAPI returned a non-JSON response', cause);
    }
    return { ok: response.ok, status: response.status, body: responseBody };
  } catch (cause) {
    if (controller.signal.aborted) throw new MetaCapiTimeoutError(timeoutMs);
    if (cause instanceof MetaCapiTransportError) throw cause;
    throw new MetaCapiTransportError('Meta CAPI request failed', cause);
  } finally {
    clearTimeout(timer);
  }
};
