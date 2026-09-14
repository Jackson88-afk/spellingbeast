'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createAuthVerifier } = require('./auth');

async function authFixture(run) {
  const { exportJWK, generateKeyPair, SignJWT } = await import('jose');
  const { privateKey, publicKey } = await generateKeyPair('EdDSA');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'test-key', alg: 'EdDSA', use: 'sig' };
  const server = http.createServer((_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const sign = ({ issuer = origin, exp = '5m', verified = true, sub = 'user-1' } = {}) => new SignJWT({ emailVerified: verified })
    .setProtectedHeader({ alg: 'EdDSA', kid: 'test-key' })
    .setSubject(sub).setIssuer(issuer).setAudience(origin).setIssuedAt().setExpirationTime(exp).sign(privateKey);
  try { await run({ origin, sign }); } finally { await new Promise((resolve) => server.close(resolve)); }
}

test('verifies Neon EdDSA JWT signature, issuer, audience, expiry, and verified user subject', async () => authFixture(async ({ origin, sign }) => {
  const verify = createAuthVerifier({ baseUrl: `${origin}/neondb/auth`, jwksUrl: `${origin}/jwks` });
  assert.deepEqual(await verify(`Bearer ${await sign()}`), { id: 'user-1' });
  assert.equal(await verify(`Bearer ${await sign({ issuer: 'https://wrong.test' })}`), null);
  assert.equal(await verify(`Bearer ${await sign({ exp: '-1s' })}`), null);
  assert.equal(await verify(`Bearer ${await sign({ verified: false })}`), null);
  assert.equal(await verify('Bearer broken'), null);
}));
