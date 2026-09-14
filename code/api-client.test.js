const test = require('node:test');
const assert = require('node:assert/strict');
const { createApiClient } = require('./api-client.js');

function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, async json() { return data; } };
}

test('restores Neon session and attaches a refreshed JWT to API requests', async () => {
  const calls = [];
  const auth = {
    async getSession() { return { session: { id: 'session-1' }, user: { id: 'user-1' } }; },
    async token() { return 'jwt-1'; },
  };
  const fetchImpl = async (url, options = {}) => {
    calls.push([String(url), options]);
    if (url === '/api/v2/config') return response({ neonAuthUrl: 'https://auth.example.test/neondb/auth' });
    if (url === '/api/v2/state') return response({ wordLists: [], activeMistakes: [] });
    throw new Error(String(url));
  };
  const client = createApiClient({ fetchImpl, authFactory: () => auth });
  await client.initialize();
  assert.equal((await client.getSession()).user.id, 'user-1');
  await client.request('/state');
  assert.equal(calls[1][1].headers.Authorization, 'Bearer jwt-1');
});

test('exposes registration, verification, reset, and logout operations', async () => {
  const called = [];
  const auth = new Proxy({}, { get: (_target, name) => async (...args) => { called.push([name, ...args]); return {}; } });
  const client = createApiClient({ fetchImpl: async () => response({ neonAuthUrl: 'https://auth.test' }), authFactory: () => auth });
  await client.signUp('parent@example.com', 'password1');
  await client.signIn('parent@example.com', 'password1');
  await client.verifyEmail('parent@example.com', '123456');
  await client.resendVerification('parent@example.com');
  await client.requestPasswordReset('parent@example.com');
  await client.resetPassword('parent@example.com', '123456', 'password2');
  await client.signOut();
  assert.deepEqual(called.map((entry) => entry[0]), ['signUp', 'signIn', 'verifyEmail', 'resendVerification', 'requestPasswordReset', 'resetPassword', 'signOut']);
});
