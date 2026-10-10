import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuthStore, AuthError } from './auth.mjs';
export function createAdminServer(auth, { backupDirectory, port = 3002 } = {}) {
  const csrf = randomBytes(32).toString('hex');
  const nonce = randomBytes(24).toString('base64');
  const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  const html = readFileSync(new URL('./admin.html', import.meta.url), 'utf8')
    .replaceAll('__NONCE__', nonce)
    .replace('__CSRF__', csrf);
  return http.createServer(async (req, res) => {
    const send = (status, value) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(JSON.stringify(value));
    };
    try {
      // Loopback binding + Host checks prevent exposure via LAN and DNS rebinding.
      if (!allowedHosts.has(req.headers.host))
        throw new AuthError(403, 'Local access only.');
      if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
        });
        return res.end(html);
      }
      // Even reads require a token only the same-origin admin page can retrieve.
      if (req.headers['x-admin-token'] !== csrf)
        throw new AuthError(403, 'Reload the account manager.');
      if (req.method === 'GET' && req.url === '/api/accounts')
        return send(200, { accounts: auth.listAccounts() });
      if (
        ['PATCH', 'DELETE'].includes(req.method) &&
        req.url === '/api/account'
      ) {
        if (req.headers.origin !== `http://${req.headers.host}`)
          throw new AuthError(403, 'Local page requests only.');
        let text = '';
        for await (const chunk of req) {
          text += chunk;
          if (Buffer.byteLength(text) > 8192)
            throw new AuthError(413, 'Request too large.');
        }
        let input;
        try {
          input = JSON.parse(text);
        } catch {
          throw new AuthError(400, 'Invalid request.');
        }
        if (typeof input?.id !== 'string' || !input.id || input.id.length > 128)
          throw new AuthError(400, 'Choose an account.');
        if (req.method === 'PATCH') {
          auth.editAccount(input.id, input);
          return send(200, { ok: true });
        }
        // Keep a consistent SQLite backup before deleting an account and its credential relations.
        if (!backupDirectory)
          throw new AuthError(503, 'Backups are not configured.');
        mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
        const backup = resolve(
          backupDirectory,
          `accounts-backup-${Date.now()}-${randomBytes(4).toString('hex')}.db`,
        );
        auth.backupAccounts(backup);
        auth.deleteAccount(input.id);
        return send(200, { ok: true, backup: basename(backup) });
      }
      throw new AuthError(404, 'Not found.');
    } catch (error) {
      send(error instanceof AuthError ? error.status : 500, {
        message:
          error instanceof AuthError
            ? error.message
            : 'Could not update accounts. No credentials are shown. Try again.',
      });
    }
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const file = resolve(
    process.env.AUTH_DB_PATH ||
      fileURLToPath(new URL('./data/auth.db', import.meta.url)),
  );
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const auth = createAuthStore(file);
  const server = createAdminServer(auth, { backupDirectory: dirname(file) });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.listen(3002, '127.0.0.1', () =>
    console.log('Local account manager: http://127.0.0.1:3002'),
  );
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () =>
      server.close(() => {
        auth.close();
        process.exit(0);
      }),
    );
}
