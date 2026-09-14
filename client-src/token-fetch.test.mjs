import test from 'node:test';
import assert from 'node:assert/strict';
import { requestToken } from './token-fetch.mjs';

test('requests the JWT endpoint directly with first-party credentials', async () => {
  const calls = [];
  const token = await requestToken('https://app.example.test/api/auth', async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ token: 'jwt-value' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  assert.equal(token, 'jwt-value');
  assert.deepEqual(calls, [{
    url: 'https://app.example.test/api/auth/token',
    options: { method: 'GET', credentials: 'include', headers: { accept: 'application/json' } },
  }]);
});

test('preserves a structured auth error from the token endpoint', async () => {
  await assert.rejects(
    requestToken('/api/auth', async () => new Response(JSON.stringify({ code: 'UNAUTHORIZED', message: 'No session' }), { status: 401 })),
    (error) => error.code === 'UNAUTHORIZED' && error.message === 'No session',
  );
});
