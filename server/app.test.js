'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./app');

async function withServer(run) {
  const calls = [];
  const repository = {
    async loadState(owner) { calls.push(['load', owner]); return { wordLists: [], activeMistakes: [], levelProgress: [] }; },
    async upsertWordList(owner, body) { calls.push(['list', owner, body]); return body; },
    async upsertMistake(owner, body) { calls.push(['mistake', owner, body]); return { ...body, id: body.id || `${body.wordListId}::${body.word.toLowerCase()}` }; },
    async deleteMistake(owner, id) { calls.push(['delete', owner, id]); },
    async deleteWordList(owner, id) { calls.push(['delete-list', owner, id]); },
    async upsertLevelProgress(owner, body) {
      calls.push(['level-progress', owner, body]);
      if (!Number.isInteger(body.bestStars) || body.bestStars < 0 || body.bestStars > 3 || !Number.isInteger(body.levelNumber) || body.levelNumber < 1) {
        throw Object.assign(new Error('Adventure progress is invalid.'), { code: 'invalid_level_progress' });
      }
      return { ...body, updatedAt: '2026-01-01T00:00:00.000Z' };
    },
    async migrate(owner, body) { calls.push(['migrate', owner, body]); return body; },
  };
  const app = createApp({
    repository,
    pool: { query: async () => ({ rows: [{ '?column?': 1 }] }) },
    verifyAuthorization: async (header) => header === 'Bearer alpha' ? { id: 'owner-alpha' } : header === 'Bearer beta' ? { id: 'owner-beta' } : null,
    publicConfig: { neonAuthUrl: 'https://auth.example.test/neondb/auth' },
    appOrigin: 'https://app.example.test',
    logger: { error() {} },
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`, calls); } finally { await new Promise((resolve) => server.close(resolve)); }
}

test('health, readiness, and public config are available', async () => withServer(async (base) => {
  assert.equal((await fetch(`${base}/health`)).status, 200);
  assert.equal((await fetch(`${base}/ready`)).status, 200);
  const config = await (await fetch(`${base}/api/v2/config`)).json();
  assert.equal(config.neonAuthUrl, 'https://auth.example.test/neondb/auth');
}));

test('auth proxy keeps session cookies first-party', async () => {
  const upstreamCalls = [];
  const app = createApp({
    repository: {},
    pool: { query: async () => ({ rows: [] }) },
    verifyAuthorization: async () => null,
    publicConfig: { neonAuthUrl: '/api/auth' },
    appOrigin: 'https://app.example.test',
    authBaseUrl: 'https://auth.example.test/neondb/auth',
    authFetch: async (url, options) => {
      upstreamCalls.push({ url, options });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'set-cookie': '__Secure-neon-auth.session_token=secret; Domain=auth.example.test; Path=/; HttpOnly; Secure; SameSite=None',
        },
      });
    },
    logger: { error() {} },
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(`${base}/api/auth/sign-in/email?return=1`, {
      method: 'POST',
      headers: { Origin: 'https://app.example.test', Cookie: '__Secure-neon-auth.session_token=incoming', 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'parent@example.com', password: 'password1' }),
    });
    assert.equal(response.status, 200);
    assert.equal(upstreamCalls[0].url, 'https://auth.example.test/neondb/auth/sign-in/email?return=1');
    assert.equal(upstreamCalls[0].options.headers.cookie, '__Secure-neon-auth.session_token=incoming');
    assert.equal(upstreamCalls[0].options.headers.origin, 'https://app.example.test');
    assert.deepEqual(JSON.parse(upstreamCalls[0].options.body), { email: 'parent@example.com', password: 'password1' });
    assert.match(response.headers.get('set-cookie'), /session_token=secret/);
    assert.doesNotMatch(response.headers.get('set-cookie'), /Domain=/i);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test('protected endpoints reject missing credentials', async () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v2/state`);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'unauthorized');
}));

test('state response includes Adventure level progress', async () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v2/state`, { headers: { Authorization: 'Bearer alpha' } });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).levelProgress, []);
}));

test('owner comes from verified token for reads and writes', async () => withServer(async (base, calls) => {
  await fetch(`${base}/api/v2/state`, { headers: { Authorization: 'Bearer alpha' } });
  await fetch(`${base}/api/v2/word-lists/list-1`, {
    method: 'PUT', headers: { Authorization: 'Bearer beta', Origin: 'https://app.example.test', 'content-type': 'application/json' },
    body: JSON.stringify({ ownerId: 'attacker', name: 'Animals', words: ['cat'] }),
  });
  assert.deepEqual(calls[0], ['load', 'owner-alpha']);
  assert.equal(calls[1][0], 'list');
  assert.equal(calls[1][1], 'owner-beta');
  assert.equal(calls[1][2].id, 'list-1');
}));

test('write endpoints reject a non-matching Origin', async () => withServer(async (base, calls) => {
  const response = await fetch(`${base}/api/v2/mistakes`, {
    method: 'POST',
    headers: { Authorization: 'Bearer alpha', Origin: 'https://evil.example', 'content-type': 'application/json' },
    body: JSON.stringify({ wordListId: 'list-1', word: 'cat' }),
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'invalid_origin');
  assert.equal(calls.length, 0);
}));

test('word-list deletion is authenticated and owner scoped', async () => withServer(async (base, calls) => {
  const response = await fetch(`${base}/api/v2/word-lists/list-1`, {
    method: 'DELETE', headers: { Authorization: 'Bearer alpha', Origin: 'https://app.example.test' },
  });
  assert.equal(response.status, 204);
  assert.deepEqual(calls, [['delete-list', 'owner-alpha', 'list-1']]);
}));

test('Adventure progress writes are origin protected, owner scoped, and strictly validated', async () => withServer(async (base, calls) => {
  const valid = await fetch(`${base}/api/v2/word-lists/list-1/levels/2/progress`, {
    method: 'PUT', headers: { Authorization: 'Bearer beta', Origin: 'https://app.example.test', 'content-type': 'application/json' },
    body: JSON.stringify({ bestStars: 2, ownerId: 'attacker' }),
  });
  assert.equal(valid.status, 200);
  assert.deepEqual(calls[0], ['level-progress', 'owner-beta', { wordListId: 'list-1', levelNumber: 2, bestStars: 2 }]);

  const invalid = await fetch(`${base}/api/v2/word-lists/list-1/levels/0/progress`, {
    method: 'PUT', headers: { Authorization: 'Bearer alpha', Origin: 'https://app.example.test', 'content-type': 'application/json' },
    body: JSON.stringify({ bestStars: 4 }),
  });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, 'invalid_level_progress');

  const stringStars = await fetch(`${base}/api/v2/word-lists/list-1/levels/1/progress`, {
    method: 'PUT', headers: { Authorization: 'Bearer alpha', Origin: 'https://app.example.test', 'content-type': 'application/json' },
    body: JSON.stringify({ bestStars: '2' }),
  });
  assert.equal(stringStars.status, 400);
}));

test('ready fails when database is unavailable', async () => {
  const app = createApp({
    repository: {}, pool: { query: async () => { throw new Error('offline'); } },
    verifyAuthorization: async () => null, publicConfig: {}, logger: { error() {} },
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/ready`);
    assert.equal(response.status, 503);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
