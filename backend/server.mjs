import http from 'node:http';
import { verifyGoogle } from './google.mjs';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuthStore, AuthError } from './auth.mjs';
const file = resolve(
  process.env.AUTH_DB_PATH ||
    fileURLToPath(new URL('./data/auth.db', import.meta.url)),
);
mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
const auth = createAuthStore(file);
const attempts = new Map();
const limiter = setInterval(() => {
  for (const [key, value] of attempts)
    if (value.until <= Date.now()) attempts.delete(key);
}, 60_000);
limiter.unref();
const send = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
};
async function body(req) {
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (Buffer.byteLength(text) > 8192)
      throw new AuthError(413, 'Request is too large.');
  }
  try {
    const value = JSON.parse(text);
    if (!value || Array.isArray(value) || typeof value !== 'object')
      throw new Error();
    return value;
  } catch {
    throw new AuthError(400, 'Invalid request.');
  }
}
const server = http.createServer(async (req, res) => {
  try {
    // Production must run behind a TLS reverse proxy; trust proxy headers only when configured.
    if (
      process.env.NODE_ENV === 'production' &&
      !(
        process.env.TRUST_PROXY === 'true' &&
        req.headers['x-forwarded-proto'] === 'https'
      )
    ) {
      throw new AuthError(400, 'HTTPS is required.');
    }
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : '';
    if (req.method === 'GET' && req.url === '/health')
      return send(res, 200, { ok: true });
    if (
      req.method === 'POST' &&
      [
        '/auth/signup',
        '/auth/login',
        '/auth/google',
        '/auth/password',
      ].includes(req.url)
    ) {
      const ip = req.socket.remoteAddress;
      let entry = attempts.get(ip);
      if (!entry || entry.until <= Date.now()) {
        entry = { count: 0, until: Date.now() + 15 * 60_000 };
        attempts.set(ip, entry);
      }
      if (++entry.count > 20)
        throw new AuthError(429, 'Too many attempts. Try again in 15 minutes.');
      const input = await body(req);
      if (req.url === '/auth/password') {
        auth.me(token);
        return send(res, 200, {
          user: await auth.addPassword(
            token,
            await verifyGoogle(input.idToken),
            input.password,
          ),
        });
      }
      const result =
        req.url === '/auth/google'
          ? await auth.google(await verifyGoogle(input.idToken), input)
          : req.url === '/auth/signup'
          ? await auth.signup(input)
          : await auth.login(input);
      return send(res, req.url === '/auth/signup' ? 201 : 200, result);
    }
    if (req.method === 'GET' && req.url === '/auth/me')
      return send(res, 200, { user: auth.me(token) });
    if (req.method === 'PATCH' && req.url === '/auth/profile')
      return send(res, 200, {
        user: auth.updateProfile(token, await body(req)),
      });
    if (req.method === 'POST' && req.url === '/auth/logout') {
      auth.logout(token);
      return send(res, 200, { ok: true });
    }
    throw new AuthError(404, 'Not found.');
  } catch (error) {
    send(res, error instanceof AuthError ? error.status : 500, {
      message:
        error instanceof AuthError
          ? error.message
          : 'The account service is unavailable. Try again.',
    });
  }
});
server.requestTimeout = 15_000;
server.headersTimeout = 10_000;
server.listen(
  Number(process.env.AUTH_PORT || 3001),
  process.env.AUTH_HOST || '127.0.0.1',
  () => {
    console.log(
      'DermaSight account service ready on port ' +
        (process.env.AUTH_PORT || 3001),
    );
  },
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      auth.close();
      process.exit(0);
    }),
  );
