import { describe, it } from 'vitest';

// TODO(Phase 2): add a real (sandboxed) Meta CAPI request/response
// fixture and assert our payload builder produces a byte-for-byte
// compatible shape, and that our response parser handles Meta's actual
// success/error response shapes.
describe('Meta CAPI payload contract', () => {
  it.todo('builds a Purchase event payload matching Meta CAPI v20+ schema');
  it.todo('parses a real Meta CAPI success response');
  it.todo('parses a real Meta CAPI 4xx rejection response (dead-letter path)');
});
