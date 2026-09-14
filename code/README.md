# SpellingBeast v2

SpellingBeast is a bilingual spelling-practice app for children. v2 uses Neon PostgreSQL, Neon Managed Better Auth, and one Render Node.js Web Service.

## Local setup

1. Copy `.env.example` to a local ignored `.env.local` and fill in the Neon/Render values.
2. Enable Neon Managed Better Auth for the database branch.
3. In Neon Auth settings, enable email/password, require verification at sign-up, and choose numeric verification codes.
4. Configure an email provider and add the local/production origins as trusted origins.
5. Install, build, migrate, and start:

```sh
npm ci
npm run build
set -a; source .env.local; set +a
npm run migrate
npm start
```

The app binds to `0.0.0.0:$PORT` and serves the frontend plus same-origin `/api/v2/*` endpoints.

## Required environment variables

- `DATABASE_URL`: pooled Neon runtime connection string with TLS.
- `DATABASE_URL_UNPOOLED`: direct Neon connection string used only by `npm run migrate`.
- `APP_ORIGIN`: exact public Render origin, such as `https://spellingbeast.onrender.com`.
- `NEON_AUTH_BASE_URL`: public Managed Better Auth URL.
- `NEON_AUTH_JWKS_URL`: Managed Better Auth JWKS URL.
- `PORT`: optional locally; Render supplies it.

Only `NEON_AUTH_BASE_URL` is returned to the browser. Database credentials and JWKS configuration remain server-side.

## Render

`render.yaml` defines one Web Service:

- Build: `npm ci && npm run build && npm run migrate`
- Start: `npm start`
- Health check: `/health`

The migration is part of the build so a failed schema update stops deployment before the new runtime starts. Do not configure Render health probes against `/ready`; it queries Neon and would prevent Free-plan scale-to-zero.

## Routes

Public:

- `GET /health`: process-only health.
- `GET /ready`: explicit Neon connectivity check.
- `GET /api/v2/config`: public Neon Auth URL only.

Authenticated:

- `GET /api/v2/state`
- `PUT /api/v2/word-lists/:id`
- `POST /api/v2/mistakes`
- `DELETE /api/v2/mistakes/:id`
- `POST /api/v2/migrate`

Protected requests use short-lived Neon Auth JWTs. The API verifies EdDSA signature, issuer, audience, expiration, verified-email status, and derives ownership only from `sub`.

## Tests

```sh
npm test
```

Tests cover the existing domain behavior plus Neon session integration, auth operations, JWT validation, owner derivation, origin validation, cold-start retry, and idempotent local migration behavior.
