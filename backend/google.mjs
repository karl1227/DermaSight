import { OAuth2Client } from 'google-auth-library';
import { AuthError } from './auth.mjs';
const client = new OAuth2Client();
export const verifyGoogle = idToken =>
  verifyGoogleToken(idToken, process.env.GOOGLE_WEB_CLIENT_ID);
export async function verifyGoogleToken(idToken, audience, verifier = client) {
  if (!audience)
    throw new AuthError(503, 'Google Sign-In is not configured yet.');
  if (typeof idToken !== 'string' || !idToken || idToken.length > 7000)
    throw new AuthError(401, 'Google Sign-In could not be verified.');
  try {
    const ticket = await verifier.verifyIdToken({ idToken, audience });
    const claims = ticket.getPayload();
    if (!claims?.sub || !claims.email || claims.email_verified !== true)
      throw new Error('Unverified identity');
    return claims;
  } catch {
    throw new AuthError(
      401,
      'Google Sign-In could not be verified. Try signing in again.',
    );
  }
}
