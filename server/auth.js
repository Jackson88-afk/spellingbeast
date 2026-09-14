'use strict';

let josePromise;

function bearerToken(header) {
  return String(header || '').match(/^Bearer\s+(.+)$/i)?.[1] || null;
}

function createAuthVerifier({ baseUrl, jwksUrl }) {
  if (!baseUrl || !jwksUrl) throw new Error('Neon Auth configuration is missing.');
  const issuer = new URL(baseUrl).origin;
  let remoteJwks;

  return async function verifyAuthorization(header) {
    const token = bearerToken(header);
    if (!token) return null;
    try {
      josePromise ||= import('jose');
      const { createRemoteJWKSet, jwtVerify } = await josePromise;
      remoteJwks ||= createRemoteJWKSet(new URL(jwksUrl));
      const { payload } = await jwtVerify(token, remoteJwks, {
        issuer,
        audience: issuer,
        algorithms: ['EdDSA'],
      });
      if (typeof payload.exp !== 'number' || typeof payload.sub !== 'string' || !payload.sub || payload.sub === 'anonymous') return null;
      if (payload.emailVerified !== true) return null;
      return { id: payload.sub };
    } catch (_error) {
      return null;
    }
  };
}

module.exports = { bearerToken, createAuthVerifier };
