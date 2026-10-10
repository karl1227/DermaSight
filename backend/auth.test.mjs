import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthStore } from './auth.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
const input = {
  email: 'Alice@example.com',
  password: 'correct horse battery',
  name: 'Alice',
  sex: 'Female',
};
test('real accounts reject invalid credentials, survive restart, and revoke/expire sessions', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dermasight-auth-'));
  const file = join(dir, 'auth.db');
  let clock = Date.now();
  let auth = createAuthStore(file, () => clock);
  try {
    await assert.rejects(
      auth.signup({ ...input, password: '123' }),
      /valid email/,
    );
    const first = await auth.signup(input);
    assert.equal(first.user.email, 'alice@example.com');
    assert.equal('password' in first.user, false);
    await assert.rejects(auth.signup(input), /already uses/);
    await assert.rejects(
      auth.login({ email: input.email, password: 'incorrect' }),
      /incorrect/,
    );
    await assert.rejects(
      auth.login({ email: 'missing@example.com', password: input.password }),
      /incorrect/,
    );
    const other = await auth.signup({
      ...input,
      email: 'bob@example.com',
      name: 'Bob',
      sex: 'Male',
    });
    assert.notEqual(first.user.id, other.user.id);
    assert.equal(auth.me(first.token).id, first.user.id);
    assert.equal(auth.me(other.token).id, other.user.id);
    auth.close();
    auth = createAuthStore(file, () => clock);
    const login = await auth.login({
      email: ' ALICE@example.com ',
      password: input.password,
    });
    assert.equal(login.user.id, first.user.id);
    const db = new DatabaseSync(file);
    const stored = db
      .prepare('SELECT * FROM users WHERE id=?')
      .get(first.user.id);
    assert.notEqual(stored.password_hash, input.password);
    assert.notEqual(stored.password_salt, '');
    assert.equal(
      db
        .prepare('SELECT COUNT(*) as count FROM sessions WHERE token_hash=?')
        .get(login.token).count,
      0,
    );
    db.close();
    auth.logout(login.token);
    assert.throws(() => auth.me(login.token), /expired/);
    assert.equal(auth.me(other.token).id, other.user.id);
    clock += 31 * 24 * 60 * 60 * 1000;
    assert.throws(() => auth.me(other.token), /expired/);
  } finally {
    auth.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Google identity requires a profile, preserves subject mapping, and refuses email takeover', async () => {
  const auth = createAuthStore();
  const claims = {
    sub: 'google-sub-1',
    email: 'google@example.com',
    email_verified: true,
    name: 'Google Profile',
  };
  try {
    await assert.rejects(
      auth.google({ ...claims, email_verified: false }),
      /verify/,
    );
    assert.deepEqual(await auth.google(claims), {
      needsProfile: true,
      mode: 'create',
      name: 'Google Profile',
      email: claims.email,
    });
    const created = await auth.google(claims, {
      name: 'Chosen Name',
      sex: 'Female',
    });
    assert.equal(created.created, true);
    assert.deepEqual(created.user.authenticationMethods, ['google']);
    await assert.rejects(
      auth.login({ email: claims.email, password: 'anything' }),
      /incorrect/,
    );
    const login = await auth.google({
      ...claims,
      email: 'changed@example.com',
    });
    assert.equal(login.user.id, created.user.id);
    assert.equal(login.created, false);
    const collision = await auth.google({ ...claims, sub: 'attacker-sub' });
    assert.equal(collision.mode, 'link');
    await assert.rejects(
      auth.google({ ...claims, sub: 'attacker-sub' }, { password: 'anything' }),
      /existing account/,
    );
    const updated = auth.updateProfile(created.token, {
      name: 'New Name',
      sex: 'Other',
    });
    assert.equal(updated.id, created.user.id);
    assert.equal(updated.email, claims.email);
    assert.equal(auth.me(login.token).sex, 'Other');
    assert.throws(
      () => auth.updateProfile('invalid', { name: 'Other User', sex: 'Male' }),
      /expired/,
    );
  } finally {
    auth.close();
  }
});

test('optional Google signup password and verified linking keep one permanent account ID', async () => {
  const auth = createAuthStore();
  const claims = {
    sub: 'google-sub',
    email: 'both@example.com',
    email_verified: true,
    name: 'Both Methods',
  };
  try {
    await assert.rejects(
      auth.google(claims, {
        name: claims.name,
        sex: 'Male',
        password: 'short',
      }),
      /valid email/,
    );
    const created = await auth.google(claims, {
      name: claims.name,
      sex: 'Male',
      password: input.password,
    });
    assert.deepEqual(created.user.authenticationMethods, [
      'password',
      'google',
    ]);
    const manual = await auth.login({
      email: claims.email,
      password: input.password,
    });
    assert.equal(manual.user.id, created.user.id);
    assert.equal((await auth.google(claims)).user.id, created.user.id);
    // Ordinary Google sign-in cannot overwrite an existing password.
    await auth.google(claims, { password: 'replacement-password' });
    await assert.rejects(
      auth.login({ email: claims.email, password: 'replacement-password' }),
      /incorrect/,
    );
    const existing = await auth.signup({
      ...input,
      email: 'existing@example.com',
    });
    const matching = {
      ...claims,
      sub: 'existing-google',
      email: existing.user.email,
    };
    assert.equal((await auth.google(matching)).mode, 'link');
    await assert.rejects(
      auth.google(matching, { password: 'wrong-password' }),
      /incorrect/,
    );
    assert.equal(auth.me(existing.token).id, existing.user.id);
    const linked = await auth.google(matching, { password: input.password });
    assert.equal(linked.created, false);
    assert.equal(linked.user.id, existing.user.id);
    assert.deepEqual(linked.user.authenticationMethods, ['password', 'google']);
    const otherGoogle = { ...matching, sub: 'different-google' };
    await assert.rejects(
      auth.google(otherGoogle, { password: input.password }),
      /different Google/,
    );
    assert.equal((await auth.google(matching)).user.id, existing.user.id);
  } finally {
    auth.close();
  }
});

test('existing Google-only account can add a password only using its own fresh Google identity', async () => {
  const auth = createAuthStore();
  const claims = {
    sub: 'own-google',
    email: 'own@example.com',
    email_verified: true,
  };
  try {
    const created = await auth.google(claims, { name: 'Owner', sex: 'Other' });
    await assert.rejects(
      auth.addPassword(
        created.token,
        { ...claims, sub: 'someone-else' },
        input.password,
      ),
      /Choose the Google/,
    );
    const updated = await auth.addPassword(
      created.token,
      claims,
      input.password,
    );
    assert.deepEqual(updated.authenticationMethods, ['password', 'google']);
    assert.equal(
      (await auth.login({ email: claims.email, password: input.password })).user
        .id,
      created.user.id,
    );
    await assert.rejects(
      auth.addPassword(created.token, claims, 'replace-existing-password'),
      /already has/,
    );
  } finally {
    auth.close();
  }
});
