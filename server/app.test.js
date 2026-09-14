'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./app');

async function withServer(run) {
  const calls = [];
  const repository = {
    async loadState(owner) { calls.push(['load', owner]); return { wordLists: [], activeMistakes: [] }; },
    async upsertWordList(owner, body) { calls.push(['list', owner, body]); return body; },
    async upsertMistake(owner, body) { calls.push(['mistake', owner, body]); return { ...body, id: body.id || `${body.wordListId}::${body.word.toLowerCase()}` }; },
    async deleteMistake(owner, id) { calls.push(['delete', owner, id]); },
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

test('protected endpoints reject missing credentials', async () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v2/state`);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'unauthorized');
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
