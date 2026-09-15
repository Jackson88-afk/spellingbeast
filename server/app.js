'use strict';

const express = require('express');
const path = require('node:path');

function createRateLimiter({ limit = 60, windowMs = 60_000 } = {}) {
  const buckets = new Map();
  return (req, res, next) => {
    const key = `${req.ip}:${req.user?.id || 'anonymous'}`;
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > limit) return res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests.' } });
    next();
  };
}

function createOriginGuard(appOrigin) {
  const expected = appOrigin ? new URL(appOrigin).origin : null;
  return (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (!expected || origin !== expected) return res.status(403).json({ error: { code: 'invalid_origin', message: 'Request origin is not allowed.' } });
    next();
  };
}

function firstPartyCookie(value) {
  return value.replace(/;\s*Domain=[^;]+/ig, '');
}

function createAuthProxy({ authBaseUrl, appOrigin, authFetch = fetch }) {
  const upstreamBase = String(authBaseUrl || '').replace(/\/$/, '');
  const origin = appOrigin ? new URL(appOrigin).origin : null;
  if (!upstreamBase || !origin) throw new Error('Auth proxy configuration is missing.');

  return async (req, res, next) => {
    try {
      const suffix = req.originalUrl.slice('/api/auth'.length);
      const headers = {
        accept: req.get('accept') || 'application/json',
        origin,
      };
      if (req.get('content-type')) headers['content-type'] = req.get('content-type');
      if (req.get('cookie')) headers.cookie = req.get('cookie');
      if (req.get('x-neon-client-info')) headers['x-neon-client-info'] = req.get('x-neon-client-info');
      const options = { method: req.method, headers, redirect: 'manual' };
      if (!['GET', 'HEAD'].includes(req.method) && req.body !== undefined) options.body = JSON.stringify(req.body);

      const upstream = await authFetch(`${upstreamBase}${suffix}`, options);
      for (const name of ['cache-control', 'content-type', 'location', 'set-auth-jwt', 'set-auth-token']) {
        const value = upstream.headers.get(name);
        if (value) res.set(name, value);
      }
      const cookies = typeof upstream.headers.getSetCookie === 'function'
        ? upstream.headers.getSetCookie()
        : [upstream.headers.get('set-cookie')].filter(Boolean);
      for (const cookie of cookies) res.append('set-cookie', firstPartyCookie(cookie));
      res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
    } catch (error) {
      next(error);
    }
  };
}

function createApp({ repository, verifyAuthorization, pool, publicConfig, appOrigin, authBaseUrl, authFetch, logger = console }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '256kb' }));

  if (authBaseUrl) app.all('/api/auth/*path', createAuthProxy({ authBaseUrl, appOrigin, authFetch }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', async (_req, res) => {
    try {
      await pool.query('select 1');
      res.json({ status: 'ready' });
    } catch (_error) {
      res.status(503).json({ error: { code: 'database_unavailable', message: 'Database is unavailable.' } });
    }
  });
  app.get('/api/v2/config', (_req, res) => res.json(publicConfig));
  app.use('/api/v2', createOriginGuard(appOrigin));

  app.use('/api/v2', async (req, res, next) => {
    try {
      const user = await verifyAuthorization(req.get('authorization'));
      if (!user) return res.status(401).json({ error: { code: 'unauthorized', message: 'Authentication required.' } });
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  const writeLimiter = createRateLimiter();
  app.get('/api/v2/state', async (req, res, next) => {
    try { res.json(await repository.loadState(req.user.id)); } catch (error) { next(error); }
  });
  app.put('/api/v2/word-lists/:id', writeLimiter, async (req, res, next) => {
    try {
      const saved = await repository.upsertWordList(req.user.id, { ...req.body, id: req.params.id });
      res.json({ wordList: saved });
    } catch (error) { next(error); }
  });
  app.delete('/api/v2/word-lists/:id', writeLimiter, async (req, res, next) => {
    try {
      await repository.deleteWordList(req.user.id, req.params.id);
      res.status(204).end();
    } catch (error) { next(error); }
  });
  app.post('/api/v2/mistakes', writeLimiter, async (req, res, next) => {
    try { res.json({ mistake: await repository.upsertMistake(req.user.id, req.body) }); } catch (error) { next(error); }
  });
  app.delete('/api/v2/mistakes/:id', writeLimiter, async (req, res, next) => {
    try {
      await repository.deleteMistake(req.user.id, req.params.id);
      res.status(204).end();
    } catch (error) { next(error); }
  });
  app.post('/api/v2/migrate', writeLimiter, async (req, res, next) => {
    try { res.json(await repository.migrate(req.user.id, req.body)); } catch (error) { next(error); }
  });

  app.use(express.static(path.join(__dirname, '..', 'code'), { extensions: ['html'] }));
  app.get('/*path', (_req, res) => res.sendFile(path.join(__dirname, '..', 'code', 'index.html')));

  app.use((error, req, res, _next) => {
    const validationCodes = new Set(['invalid_word_list', 'empty_word_list', 'invalid_mistake']);
    const status = Number(error.status)
      || (error.type === 'entity.too.large' ? 413 : validationCodes.has(error.code) ? 400 : 500);
    const code = error.code || (status === 413 ? 'request_too_large' : 'request_failed');
    logger.error(JSON.stringify({ level: 'error', code, method: req.method, path: req.path }));
    res.status(status).json({ error: { code, message: status >= 500 ? 'Request failed.' : error.message } });
  });
  return app;
}

module.exports = { createApp, createAuthProxy, createOriginGuard, createRateLimiter, firstPartyCookie };
