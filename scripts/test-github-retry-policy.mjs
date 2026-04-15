import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const retry = require('../packages/sdd-ticket-management/retry.cjs');

assert.equal(retry.shouldRetry({ status: 429 }), true, '429 debe reintentarse');
assert.equal(retry.shouldRetry({ status: 503 }), true, '503 debe reintentarse');
assert.equal(retry.shouldRetry({ status: 404 }), false, '404 no debe reintentarse');
assert.equal(retry.shouldRetry({ status: 401 }), false, '401 no debe reintentarse');

let attempts = 0;
const result = await retry.withRetry(async () => {
  attempts += 1;
  if (attempts < 3) {
    const error = new Error('temporary failure');
    error.status = 503;
    throw error;
  }
  return { ok: true };
}, { retries: 3, baseDelayMs: 1 });

assert.equal(result.ok, true, 'el resultado final debe ser exitoso');
assert.equal(attempts, 3, 'debe reintentar hasta recuperar');

console.log('OK: github retry policy smoke test passed');
