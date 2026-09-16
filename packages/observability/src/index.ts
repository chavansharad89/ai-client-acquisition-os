// observability
// -----------------------------------------------------------------------
// Owns: structured logging, correlation-id propagation, metrics emission
// wrappers. Every payment-relevant write should be able to carry a
// correlation ID through this module (architecture spec §1, §11).
//
// The concrete backend (pino + OpenTelemetry exporter, or similar) is
// still an implementation decision for Phase 0/1. REDACTION is not: see
// redact.ts and docs/SECURITY.md M-5. Whatever backend replaces the
// console here must keep passing `meta` through redact() — a logger that
// prints what it is given is a PII exfiltration path that every caller
// uses by accident.
// -----------------------------------------------------------------------

import { redact } from './redact';

export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Console-based logger. Structured output is still outstanding (see
 * architecture §11 — pino or similar); what is NOT outstanding any more
 * is redaction.
 *
 * Every `meta` object passes through `redact()` before it reaches the
 * console. This is the one thing that had to be true before any caller
 * existed, because the fix is invisible at the call site: the natural
 * line to write is `logger.error('capture failed', { order })`, and the
 * author of that line should not have to know which of an order's fields
 * are safe to print. The logger knows instead.
 *
 * Output is JSON rather than a formatted string so a collector can parse
 * it, and so a `meta` object cannot smuggle a newline into the log
 * stream and forge a second log line.
 */
function emit(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
  const line = JSON.stringify({
    level,
    message,
    ...(meta === undefined ? {} : { meta: redact(meta) }),
    time: new Date().toISOString(),
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}

export const logger: Logger = {
  info: (message, meta) => emit('info', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  error: (message, meta) => emit('error', message, meta),
};

/**
 * NOT IMPLEMENTED — correlation ID middleware/context propagation is
 * deferred to Phase 1 alongside core-payments.
 */
export function withCorrelationId<T>(_correlationId: string, _fn: () => T): T {
  throw new Error('observability.withCorrelationId: not implemented (Phase 1)');
}

export {
  ALLOWED_KEYS,
  isRedactedKey,
  redact,
  REDACTED,
  REDACTED_KEYS,
} from './redact';
