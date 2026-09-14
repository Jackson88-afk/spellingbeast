import { createAuthClient } from '@neondatabase/neon-js/auth';

function unwrap(result, fallbackCode = 'auth_failed') {
  if (result?.error) {
    const error = new Error(result.error.message || 'Authentication failed.');
    error.code = result.error.code || fallbackCode;
    throw error;
  }
  return result?.data || null;
}

function createClient(baseUrl) {
  const client = createAuthClient(baseUrl, {
    fetchOptions: { credentials: 'include' },
  });

  return {
    async getSession() {
      return unwrap(await client.getSession(), 'session_failed');
    },
    async token() {
      const data = unwrap(await client.token(), 'token_failed');
      if (!data?.token) throw Object.assign(new Error('Authentication required.'), { code: 'unauthorized' });
      return data.token;
    },
    async signUp(email, password) {
      return unwrap(await client.signUp.email({ email, password, name: 'SpellingBeast User' }), 'signup_failed');
    },
    async signIn(email, password) {
      return unwrap(await client.signIn.email({ email, password, rememberMe: true }), 'signin_failed');
    },
    async verifyEmail(email, otp) {
      return unwrap(await client.emailOtp.verifyEmail({ email, otp }), 'verification_failed');
    },
    async resendVerification(email) {
      return unwrap(await client.emailOtp.sendVerificationOtp({ email, type: 'email-verification' }), 'verification_failed');
    },
    async requestPasswordReset(email) {
      return unwrap(await client.forgetPassword.emailOtp({ email }), 'reset_failed');
    },
    async resetPassword(email, otp, password) {
      return unwrap(await client.emailOtp.resetPassword({ email, otp, password }), 'reset_failed');
    },
    async signOut() {
      return unwrap(await client.signOut(), 'signout_failed');
    },
  };
}

window.SpellingBeastNeonAuth = { createClient };
