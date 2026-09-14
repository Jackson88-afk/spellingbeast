(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SpellingBeastApi = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createApiClient({ fetchImpl = globalThis.fetch, authFactory } = {}) {
    let config = null;
    let auth = null;

    async function initialize() {
      if (auth) return;
      const response = await fetchImpl('/api/v2/config');
      if (!response.ok) throw Object.assign(new Error('Unable to load app configuration.'), { code: 'config_failed' });
      config = await response.json();
      if (!config.neonAuthUrl) throw Object.assign(new Error('App configuration is incomplete.'), { code: 'config_failed' });
      const factory = authFactory || globalThis.SpellingBeastNeonAuth?.createClient;
      if (!factory) throw Object.assign(new Error('Authentication client is unavailable.'), { code: 'config_failed' });
      auth = factory(config.neonAuthUrl);
    }

    async function callAuth(method, ...args) {
      await initialize();
      return auth[method](...args);
    }

    async function getSession() {
      const data = await callAuth('getSession');
      const session = data?.session || null;
      const user = data?.user || session?.user || null;
      return session && user ? { session, user } : null;
    }

    async function request(path, options = {}) {
      await initialize();
      const token = await auth.token();
      const response = await fetchImpl(`/api/v2${path}`, {
        ...options,
        headers: { 'content-type': 'application/json', ...(options.headers || {}), Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        let payload = null;
        try { payload = await response.json(); } catch (_error) {}
        throw Object.assign(new Error(payload?.error?.message || 'Request failed.'), {
          code: payload?.error?.code || 'request_failed',
          status: response.status,
        });
      }
      return response.status === 204 ? null : response.json();
    }

    return {
      initialize,
      getSession,
      request,
      signUp: (email, password) => callAuth('signUp', email, password),
      signIn: (email, password) => callAuth('signIn', email, password),
      verifyEmail: (email, otp) => callAuth('verifyEmail', email, otp),
      resendVerification: (email) => callAuth('resendVerification', email),
      requestPasswordReset: (email) => callAuth('requestPasswordReset', email),
      resetPassword: (email, otp, password) => callAuth('resetPassword', email, otp, password),
      signOut: () => callAuth('signOut'),
    };
  }

  return { createApiClient };
});
