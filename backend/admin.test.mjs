import test from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createAuthStore } from './auth.mjs';
import { createAdminServer } from './admin.mjs';
test('local admin blocks foreign hosts/CSRF, hides credentials, and backs up scoped deletion', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'dermasight-admin-'));
  const auth = createAuthStore(join(directory, 'accounts.db'));
  const server = createAdminServer(auth, {
    backupDirectory: directory,
    port: 3003,
  });
  try {
    const first = await auth.signup({
      email: 'first@example.com',
      name: 'First',
      sex: 'Female',
      password: 'test-password-1',
    });
    const google = await auth.google(
      {
        sub: 'admin-fixture-sub',
        email: 'second@example.com',
        email_verified: true,
      },
      { name: 'Second', sex: 'Male' },
    );
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(3003, '127.0.0.1', resolve);
    });
    const url = 'http://127.0.0.1:3003';
    const page = await fetch(url);
    const html = await page.text();
    const csrf = html.match(/const csrf = '([a-f0-9]+)'/)[1];
    assert.ok(
      page.headers
        .get('content-security-policy')
        .includes("frame-ancestors 'none'"),
    );
    const foreignHost = await new Promise((resolve, reject) => {
      const request = http.get(
        url,
        { headers: { Host: 'attacker.invalid:3003' } },
        response => {
          response.resume();
          resolve(response.statusCode);
        },
      );
      request.on('error', reject);
    });
    assert.equal(foreignHost, 403);
    assert.equal((await fetch(url + '/api/accounts')).status, 403);
    const headers = {
      'X-Admin-Token': csrf,
      'Content-Type': 'application/json',
      Origin: url,
    };
    const list = await (await fetch(url + '/api/accounts', { headers })).json();
    assert.equal(list.accounts.length, 2);
    for (const account of list.accounts) {
      assert.equal('password_hash' in account, false);
      assert.equal('token' in account, false);
      assert.equal('subject' in account, false);
    }
    assert.equal(
      (
        await fetch(url + '/api/account', {
          method: 'DELETE',
          headers: { ...headers, Origin: 'https://attacker.invalid' },
          body: JSON.stringify({ id: first.user.id }),
        })
      ).status,
      403,
    );
    assert.equal(auth.listAccounts().length, 2);
    assert.equal(
      (
        await fetch(url + '/api/account', {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            id: first.user.id,
            name: 'Edited',
            sex: 'Other',
          }),
        })
      ).status,
      200,
    );
    assert.equal(auth.me(first.token).name, 'Edited');
    const deletion = await fetch(url + '/api/account', {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ id: google.user.id }),
    });
    assert.equal(deletion.status, 200);
    const result = await deletion.json();
    assert.throws(() => auth.me(google.token), /expired/);
    assert.equal(auth.me(first.token).id, first.user.id);
    const backup = new DatabaseSync(join(directory, result.backup));
    assert.equal(
      backup.prepare('SELECT count(*) AS count FROM users').get().count,
      2,
    );
    backup.close();
    assert.equal(
      readdirSync(directory).some(name => name.startsWith('accounts-backup-')),
      true,
    );
    assert.equal(
      (
        await auth.google({
          sub: 'admin-fixture-sub',
          email: 'second@example.com',
          email_verified: true,
        })
      ).mode,
      'create',
    );
  } finally {
    await new Promise(resolve => server.close(resolve));
    auth.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
