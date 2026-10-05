import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { verifyGoogleToken } from './google.mjs';
test('Google library rejects forged signatures, wrong audience/issuer, expiry and unverified emails', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const verifier = new OAuth2Client();
  // Test certificate source only; Google's actual JWT signature/claim verification still runs.
  verifier.getFederatedSignonCertsAsync = async () => ({
    certs: { fixture: publicKey.export({ type: 'spki', format: 'pem' }) },
    format: 'PEM',
  });
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: 'stable-google-sub',
    email: 'sample@example.com',
    email_verified: true,
    iss: 'https://accounts.google.com',
    aud: 'web-client',
    iat: now,
    exp: now + 3600,
  };
  const token = (payload, key = privateKey) => {
    const parts = [
      Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'fixture' })).toString(
        'base64url',
      ),
      Buffer.from(JSON.stringify(payload)).toString('base64url'),
    ].join('.');
    return (
      parts +
      '.' +
      sign('RSA-SHA256', Buffer.from(parts), key).toString('base64url')
    );
  };
  assert.equal(
    (await verifyGoogleToken(token(claims), 'web-client', verifier)).sub,
    claims.sub,
  );
  for (const changed of [
    { aud: 'wrong-client' },
    { iss: 'https://attacker.invalid' },
    { iat: now - 4000, exp: now - 1000 },
    { email_verified: false },
  ])
    await assert.rejects(
      verifyGoogleToken(
        token({ ...claims, ...changed }),
        'web-client',
        verifier,
      ),
      /could not be verified/,
    );
  const forged = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  await assert.rejects(
    verifyGoogleToken(token(claims, forged), 'web-client', verifier),
    /could not be verified/,
  );
  await assert.rejects(
    verifyGoogleToken(token(claims), '', verifier),
    /not configured/,
  );
});
