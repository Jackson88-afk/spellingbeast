'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isTransient, withRetry } = require('./database');

test('cold-start retry is bounded and succeeds after a transient connection failure', async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls += 1;
    if (calls < 3) throw Object.assign(new Error('connection closed'), { code: '08006' });
    return 'ready';
  }, { attempts: 3, delayMs: 1 });
  assert.equal(result, 'ready');
  assert.equal(calls, 3);
});

test('non-transient failures are not retried', async () => {
  let calls = 0;
  await assert.rejects(() => withRetry(async () => {
    calls += 1;
    throw Object.assign(new Error('bad query'), { code: '42601' });
  }, { delayMs: 1 }));
  assert.equal(calls, 1);
  assert.equal(isTransient({ code: '42601' }), false);
});
