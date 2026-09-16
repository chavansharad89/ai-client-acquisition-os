/**
 * Thrown whenever an untrusted value fails to resolve to a known
 * ProductId. Callers at a system boundary (an API route reading a
 * request body) are expected to catch this and respond 400 — it should
 * never propagate as an unhandled 500, since "the client sent a product
 * id we don't recognize" is an expected, not exceptional, class of bad
 * input.
 */
export class InvalidProductIdError extends Error {
  public readonly receivedValue: unknown;

  constructor(receivedValue: unknown) {
    super(`Invalid product id: ${InvalidProductIdError.describe(receivedValue)}`);
    this.name = 'InvalidProductIdError';
    this.receivedValue = receivedValue;
  }

  private static describe(value: unknown): string {
    if (typeof value === 'string') return JSON.stringify(value);
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
