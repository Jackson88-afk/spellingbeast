'use strict';

const { createApp } = require('./app');
const { createAuthVerifier } = require('./auth');
const { createDatabasePool } = require('./database');
const { createRepository } = require('./repository');

const required = ['DATABASE_URL', 'APP_ORIGIN', 'NEON_AUTH_BASE_URL', 'NEON_AUTH_JWKS_URL'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(JSON.stringify({ level: 'fatal', code: 'missing_configuration', keys: missing }));
  process.exit(1);
}

const pool = createDatabasePool(process.env.DATABASE_URL);
const app = createApp({
  pool,
  repository: createRepository(pool),
  verifyAuthorization: createAuthVerifier({
    baseUrl: process.env.NEON_AUTH_BASE_URL,
    jwksUrl: process.env.NEON_AUTH_JWKS_URL,
  }),
  publicConfig: { neonAuthUrl: process.env.NEON_AUTH_BASE_URL },
  appOrigin: process.env.APP_ORIGIN,
});
const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, '0.0.0.0', () => console.log(JSON.stringify({ level: 'info', event: 'listening', port })));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
