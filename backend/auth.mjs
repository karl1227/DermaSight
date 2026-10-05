import { DatabaseSync } from 'node:sqlite';
import {
  randomBytes,
  randomUUID,
  scrypt as derive,
  timingSafeEqual,
  createHash,
} from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(derive);
let activeDerivations = 0;
async function passwordKey(password, salt) {
  if (activeDerivations >= 2)
    throw new AuthError(503, 'The account service is busy. Try again shortly.');
  activeDerivations++;
  try {
    return await scrypt(password, salt, 64, COST);
  } finally {
    activeDerivations--;
  }
}
const digest = token => createHash('sha256').update(token).digest('hex');
const COST = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function createAuthStore(path = ':memory:', now = () => Date.now()) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      sex TEXT NOT NULL CHECK(sex IN ('Male','Female','Other')),
      password_salt TEXT NOT NULL, password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS federated_identities (
      provider TEXT NOT NULL, subject TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      PRIMARY KEY(provider, subject), UNIQUE(provider, user_id));`);
  const profile = row => ({
    id: row.id,
    email: row.email,
    name: row.name,
    sex: row.sex,
    created_at: row.created_at,
    updated_at: row.updated_at,
    authenticationMethods: [
      ...(db.prepare('SELECT password_hash FROM users WHERE id=?').get(row.id)
        ?.password_hash
        ? ['password']
        : []),
      ...(db
        .prepare(
          "SELECT 1 FROM federated_identities WHERE user_id=? AND provider='google'",
        )
        .get(row.id)
        ? ['google']
        : []),
    ],
  });
  const normalizeEmail = email =>
    typeof email === 'string' ? email.trim().toLowerCase() : '';
  function validate(email, password) {
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 128
    ) {
      throw new AuthError(
        400,
        'Use a valid email and a password of 8–128 characters.',
      );
    }
  }
  function session(user) {
    const token = randomBytes(32).toString('base64url');
    const expires = now() + 30 * 24 * 60 * 60 * 1000;
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now());
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(
      digest(token),
      user.id,
      expires,
    );
    return {
      user: profile(user),
      token,
      expiresAt: new Date(expires).toISOString(),
    };
  }
  return {
    async signup({ email, password, name, sex }) {
      email = normalizeEmail(email);
      validate(email, password);
      if (
        typeof name !== 'string' ||
        !name.trim() ||
        name.trim().length > 100 ||
        !['Male', 'Female', 'Other'].includes(sex)
      )
        throw new AuthError(400, 'Enter your name and sex.');
      const salt = randomBytes(16).toString('hex');
      const hash = (await passwordKey(password, salt)).toString('hex');
      const date = new Date(now()).toISOString();
      const user = {
        id: randomUUID(),
        email,
        name: name.trim(),
        sex,
        created_at: date,
        updated_at: date,
      };
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?,?)').run(
          user.id,
          email,
          user.name,
          sex,
          salt,
          hash,
          date,
          date,
        );
        const result = session(user);
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        if (String(error.message).includes('UNIQUE'))
          throw new AuthError(
            409,
            'An account already uses this email. Sign in instead.',
          );
        throw error;
      }
    },
    async login({ email, password }) {
      email = normalizeEmail(email);
      if (typeof password !== 'string' || password.length > 128)
        throw new AuthError(401, 'Email or password is incorrect.');
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      // Perform the same expensive derivation for unknown emails to reduce timing disclosure.
      const actual = await passwordKey(
        password,
        user?.password_salt ?? '00000000000000000000000000000000',
      );
      const expected = user?.password_hash
        ? Buffer.from(user.password_hash, 'hex')
        : Buffer.alloc(64);
      if (!timingSafeEqual(actual, expected) || !user?.password_hash)
        throw new AuthError(401, 'Email or password is incorrect.');
      return session(user);
    },
    me(token) {
      if (typeof token !== 'string' || token.length > 200)
        throw new AuthError(401, 'Please sign in again.');
      const user = db
        .prepare(
          `SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id
        WHERE s.token_hash=? AND s.expires_at>?`,
        )
        .get(digest(token), now());
      if (!user)
        throw new AuthError(
          401,
          'Your session has expired. Please sign in again.',
        );
      return profile(user);
    },
    updateProfile(token, { name, sex }) {
      const user = this.me(token);
      if (
        typeof name !== 'string' ||
        !name.trim() ||
        name.trim().length > 100 ||
        !['Male', 'Female', 'Other'].includes(sex)
      )
        throw new AuthError(400, 'Enter your full name and sex.');
      db.prepare('UPDATE users SET name=?, sex=?, updated_at=? WHERE id=?').run(
        name.trim(),
        sex,
        new Date(now()).toISOString(),
        user.id,
      );
      return this.me(token);
    },
    // Claims have already passed Google's signature, audience, issuer and expiry verification.
    async google(claims, { name, sex, password } = {}) {
      if (!claims?.sub || !claims.email || claims.email_verified !== true)
        throw new AuthError(401, 'Google could not verify your account.');
      const identity = db
        .prepare(
          "SELECT u.* FROM users u JOIN federated_identities f ON f.user_id=u.id WHERE f.provider='google' AND f.subject=?",
        )
        .get(claims.sub);
      if (identity) {
        // A fresh verified Google login can add a password to a Google-only account.
        // It never replaces an existing password as part of ordinary sign-in.
        if (password && !identity.password_hash) {
          validate(identity.email, password);
          const salt = randomBytes(16).toString('hex');
          const hash = (await passwordKey(password, salt)).toString('hex');
          db.prepare(
            "UPDATE users SET password_salt=?, password_hash=?, updated_at=? WHERE id=? AND password_hash=''",
          ).run(salt, hash, new Date(now()).toISOString(), identity.id);
        }
        return { ...session(identity), created: false };
      }
      const email = normalizeEmail(claims.email);
      const existing = db
        .prepare('SELECT * FROM users WHERE email=?')
        .get(email);
      if (existing) {
        if (!password)
          return {
            needsProfile: true,
            mode: 'link',
            name:
              typeof claims.name === 'string' ? claims.name.slice(0, 100) : '',
            email,
          };
        // Email match alone is not enough: prove the existing account's password too.
        if (
          typeof password !== 'string' ||
          password.length > 128 ||
          !existing.password_hash
        )
          throw new AuthError(
            401,
            'Sign in with your existing account to connect Google.',
          );
        const actual = await passwordKey(password, existing.password_salt);
        if (
          !timingSafeEqual(actual, Buffer.from(existing.password_hash, 'hex'))
        )
          throw new AuthError(
            401,
            'Your existing account password is incorrect.',
          );
        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare(
            "INSERT INTO federated_identities VALUES ('google',?,?)",
          ).run(claims.sub, existing.id);
          const result = { ...session(existing), created: false };
          db.exec('COMMIT');
          return result;
        } catch (error) {
          db.exec('ROLLBACK');
          if (String(error.message).includes('UNIQUE'))
            throw new AuthError(
              409,
              'This account is already connected to a different Google identity.',
            );
          throw error;
        }
      }
      if (!name || !sex)
        return {
          needsProfile: true,
          mode: 'create',
          name:
            typeof claims.name === 'string' ? claims.name.slice(0, 100) : '',
          email,
        };
      if (
        typeof name !== 'string' ||
        !name.trim() ||
        name.trim().length > 100 ||
        !['Male', 'Female', 'Other'].includes(sex)
      )
        throw new AuthError(400, 'Enter your full name and sex.');
      let salt = '',
        hash = '';
      if (password !== undefined && password !== '') {
        validate(email, password);
        salt = randomBytes(16).toString('hex');
        hash = (await passwordKey(password, salt)).toString('hex');
      }
      const date = new Date(now()).toISOString();
      const user = {
        id: randomUUID(),
        email,
        name: name.trim(),
        sex,
        created_at: date,
        updated_at: date,
      };
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?,?)').run(
          user.id,
          email,
          user.name,
          sex,
          salt,
          hash,
          date,
          date,
        );
        db.prepare(
          "INSERT INTO federated_identities VALUES ('google',?,?)",
        ).run(claims.sub, user.id);
        const result = { ...session(user), created: true };
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        if (String(error.message).includes('UNIQUE'))
          throw new AuthError(
            409,
            'This account changed during signup. Sign in again.',
          );
        throw error;
      }
    },
    async addPassword(token, claims, password) {
      const user = this.me(token);
      const identity = db
        .prepare(
          "SELECT user_id FROM federated_identities WHERE provider='google' AND subject=?",
        )
        .get(claims.sub);
      if (!identity || identity.user_id !== user.id)
        throw new AuthError(
          401,
          'Choose the Google account already connected to this profile.',
        );
      validate(user.email, password);
      const salt = randomBytes(16).toString('hex');
      const hash = (await passwordKey(password, salt)).toString('hex');
      const result = db
        .prepare(
          "UPDATE users SET password_salt=?,password_hash=?,updated_at=? WHERE id=? AND password_hash=''",
        )
        .run(salt, hash, new Date(now()).toISOString(), user.id);
      if (!result.changes)
        throw new AuthError(
          409,
          'This account already has a password. Sign in with your existing password.',
        );
      return this.me(token);
    },
    backupAccounts(file) {
      db.prepare('VACUUM INTO ?').run(file);
    },
    listAccounts() {
      return db
        .prepare('SELECT * FROM users ORDER BY created_at DESC')
        .all()
        .map(profile);
    },
    editAccount(id, { name, sex }) {
      if (
        typeof name !== 'string' ||
        !name.trim() ||
        name.trim().length > 100 ||
        !['Male', 'Female', 'Other'].includes(sex)
      )
        throw new AuthError(400, 'Enter a full name and sex.');
      const result = db
        .prepare('UPDATE users SET name=?,sex=?,updated_at=? WHERE id=?')
        .run(name.trim(), sex, new Date(now()).toISOString(), id);
      if (!result.changes) throw new AuthError(404, 'Account not found.');
    },
    deleteAccount(id) {
      if (typeof id !== 'string' || !id)
        throw new AuthError(400, 'Choose an account.');
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
        db.prepare('DELETE FROM federated_identities WHERE user_id=?').run(id);
        const result = db.prepare('DELETE FROM users WHERE id=?').run(id);
        if (!result.changes) throw new AuthError(404, 'Account not found.');
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    logout(token) {
      if (typeof token === 'string')
        db.prepare('DELETE FROM sessions WHERE token_hash=?').run(
          digest(token),
        );
    },
    close() {
      db.close();
    },
  };
}
