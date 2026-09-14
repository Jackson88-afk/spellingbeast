export async function requestToken(baseUrl, fetchImpl = fetch) {
  const response = await fetchImpl(`${String(baseUrl).replace(/\/$/, '')}/token`, {
    method: 'GET',
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  let payload = null;
  try { payload = await response.json(); } catch (_error) {}
  if (!response.ok || !payload?.token) {
    const error = new Error(payload?.message || 'Authentication required.');
    error.code = payload?.code || 'unauthorized';
    throw error;
  }
  return payload.token;
}
