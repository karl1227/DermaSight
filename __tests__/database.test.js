const { DatabaseSync } = require('node:sqlite');
const { readFileSync } = require('node:fs');
let mockSqlite;
let mockFailMigration = false;
function mockExecute(sql, params = []) {
  if (mockFailMigration && sql.includes('UPDATE screenings SET user_id'))
    throw new Error('simulated disk failure');
  const statement = mockSqlite.prepare(sql);
  if (statement.columns().length)
    return Promise.resolve({ rows: statement.all(...params), rowsAffected: 0 });
  const result = statement.run(...params);
  return Promise.resolve({
    rows: [],
    rowsAffected: Number(result.changes),
    insertId: Number(result.lastInsertRowid),
  });
}
jest.mock('@op-engineering/op-sqlite', () => ({
  open: () => ({
    execute: mockExecute,
    close: () => mockSqlite.close(),
    transaction: async fn => {
      mockSqlite.exec('BEGIN IMMEDIATE');
      try {
        await fn({ execute: mockExecute });
        mockSqlite.exec('COMMIT');
      } catch (error) {
        mockSqlite.exec('ROLLBACK');
        throw error;
      }
    },
  }),
}));
jest.mock('../src/utils/secureId', () => ({
  secureId: () => require('node:crypto').randomUUID(),
}));
const record = id => ({
  screening_id: id,
  patient_id: id,
  full_name: 'Sample',
  age: 21,
  sex: 'Female',
  lesion_location: 'Arm',
  selected_symptoms: '{}',
  abcde_answers: '{}',
  image_path: '/local/sample.jpg',
  predicted_lesion_type: 'Melanocytic Nevi',
  confidence_score: 91,
  screening_status: 'Generally Benign',
  threshold_status: 'Above Threshold',
  matching_visual_features: '[]',
  recommendation_basis: '',
  recommendation: '',
  created_at: '2026-10-05T00:00:00Z',
});
const user = id => ({
  id,
  email: `${id}@example.com`,
  name: id,
  sex: 'Female',
  created_at: '2026-10-05T00:00:00Z',
  updated_at: '2026-10-05T00:00:00Z',
});
beforeEach(() => {
  jest.resetModules();
  mockSqlite = new DatabaseSync(':memory:');
  mockFailMigration = false;
});
afterEach(() => mockSqlite.close());
test('two guests, two users, report lookup, edits and deletion are isolated; saving is idempotent', async () => {
  const db = require('../src/database/database');
  await db.initDatabase();
  const g1 = { kind: 'guest', id: await db.createGuestSession() };
  const g2 = { kind: 'guest', id: await db.createGuestSession() };
  const a = { kind: 'user', id: 'a' };
  const b = { kind: 'user', id: 'b' };
  await db.activateAccount(user('a'));
  await db.activateAccount(user('b'));
  const g1id = await db.insertScreening(record('g1-scan'), g1);
  await db.insertScreening(record('g2-scan'), g2);
  const aid = await db.insertScreening(record('a-scan'), a);
  await db.insertScreening(record('b-scan'), b);
  expect(await db.insertScreening(record('a-scan'), a)).toBe(aid);
  for (const owner of [g1, g2, a, b])
    expect(await db.getAllScreenings(owner)).toHaveLength(1);
  expect(await db.getScreeningById(aid, b)).toBeNull();
  expect(await db.getScreeningById(g1id, g2)).toBeNull();
  await db.updatePatientInfo(aid, 'Wrong owner', 99, 'Male', b);
  expect((await db.getScreeningById(aid, a)).full_name).toBe('Sample');
  await db.deleteScreening(aid, b);
  expect(await db.getAllScreenings(a)).toHaveLength(1);
  await db.deleteAllScreenings(b);
  expect(await db.getAllScreenings(b)).toHaveLength(0);
  expect(await db.getAllScreenings(a)).toHaveLength(1);
  await expect(db.getAllScreenings(null)).rejects.toThrow('active session');
  await expect(
    db.insertScreening(record('no-owner'), { kind: 'user', id: 'missing' }),
  ).rejects.toThrow();
});
test('guest adoption rolls back on failure, preserves screening IDs/images, and retries idempotently', async () => {
  const db = require('../src/database/database');
  const id = await db.createGuestSession();
  const guest = { kind: 'guest', id };
  await db.insertScreening(record('scan-1'), guest);
  await db.insertScreening(record('scan-2'), guest);
  mockFailMigration = true;
  await expect(db.activateAccount(user('a'), id)).rejects.toThrow('disk');
  mockFailMigration = false;
  expect(await db.getAllScreenings(guest)).toHaveLength(2);
  expect(await db.isActiveGuest(id)).toBe(true);
  expect(mockSqlite.prepare('SELECT * FROM users').all()).toHaveLength(0);
  await db.activateAccount(user('a'), id);
  await db.activateAccount(user('a'), id);
  const records = await db.getAllScreenings({ kind: 'user', id: 'a' });
  expect(records).toHaveLength(2);
  expect(records.map(r => r.screening_id).sort()).toEqual(['scan-1', 'scan-2']);
  expect(
    records.every(
      r => r.guest_session_id === null && r.image_path === '/local/sample.jpg',
    ),
  ).toBe(true);
  await expect(db.activateAccount(user('b'), id)).rejects.toThrow(
    'cannot be migrated',
  );
  await expect(db.insertScreening(record('late-scan'), guest)).rejects.toThrow(
    'ended',
  );
});
test('legacy records survive migration without being exposed to new sessions', async () => {
  mockSqlite.exec(
    readFileSync(__dirname + '/fixtures/legacy-schema.sql', 'utf8'),
  );
  const legacy = record('old');
  delete legacy.screening_id;
  mockSqlite
    .prepare(
      `INSERT INTO screenings (${Object.keys(legacy).join(
        ',',
      )}) VALUES (${Object.keys(legacy)
        .map(() => '?')
        .join(',')})`,
    )
    .run(...Object.values(legacy));
  const db = require('../src/database/database');
  await Promise.all([db.initDatabase(), db.initDatabase()]);
  const guest = { kind: 'guest', id: await db.createGuestSession() };
  expect(await db.getAllScreenings(guest)).toEqual([]);
  const saved = mockSqlite.prepare('SELECT * FROM screenings').get();
  expect(saved.full_name).toBe('Sample');
  expect(saved.screening_id).toBe('legacy-1');
  expect(saved.user_id).toBeNull();
  expect(saved.guest_session_id).toBeNull();
});
test('guest exit creates no account; new guest and user settings stay separate', async () => {
  const db = require('../src/database/database');
  const g1 = { kind: 'guest', id: await db.createGuestSession() };
  await db.insertScreening(record('scan'), g1);
  await db.setHistoryEnabled(g1, false);
  await db.endGuestSession(g1.id);
  const g2 = { kind: 'guest', id: await db.createGuestSession() };
  expect(g1.id).not.toBe(g2.id);
  expect(await db.getAllScreenings(g2)).toEqual([]);
  expect(await db.historyEnabledFor(g2)).toBe(true);
  expect(await db.historyEnabledFor(g1)).toBe(false);
  expect(mockSqlite.prepare('SELECT * FROM users').all()).toHaveLength(0);
});
test('old unique-email cache migrates without losing scans when an email is registered again', async () => {
  let db = require('../src/database/database');
  await db.initDatabase();
  const oldUser = { ...user('old-id'), email: 'same@example.com' };
  await db.activateAccount(oldUser);
  const oldOwner = { kind: 'user', id: oldUser.id };
  await db.insertScreening(record('old-account-scan'), oldOwner);
  const guestId = await db.createGuestSession();
  await db.activateAccount(oldUser, guestId);
  mockSqlite.exec(`PRAGMA foreign_keys=OFF;
    BEGIN;
    CREATE TABLE users_v1 (id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,
      sex TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    INSERT INTO users_v1 SELECT * FROM users;
    DROP TABLE users;
    ALTER TABLE users_v1 RENAME TO users;
    PRAGMA user_version=1;
    COMMIT;
    PRAGMA foreign_keys=ON;`);
  jest.resetModules();
  db = require('../src/database/database');
  await db.initDatabase();
  await db.activateAccount({ ...user('new-id'), email: oldUser.email });
  expect(await db.getAllScreenings({ kind: 'user', id: 'new-id' })).toEqual([]);
  expect(await db.getAllScreenings(oldOwner)).toHaveLength(1);
  expect(
    mockSqlite.prepare('SELECT * FROM users WHERE email=?').all(oldUser.email),
  ).toHaveLength(2);
  expect(
    mockSqlite
      .prepare('SELECT migrated_user_id FROM guest_sessions WHERE id=?')
      .get(guestId).migrated_user_id,
  ).toBe(oldUser.id);
  expect(mockSqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  expect(mockSqlite.prepare('PRAGMA foreign_keys').get().foreign_keys).toBe(1);
  await db.initDatabase();
});

test('account onboarding completion is persistent and isolated by account ID', async () => {
  const db = require('../src/database/database');
  await db.initDatabase();
  expect(await db.accountNeedsOnboarding('existing')).toBe(false);
  await db.setAccountOnboarding('new-account', true);
  expect(await db.accountNeedsOnboarding('new-account')).toBe(true);
  expect(await db.accountNeedsOnboarding('other-account')).toBe(false);
  await db.setAccountOnboarding('new-account', false);
  expect(await db.accountNeedsOnboarding('new-account')).toBe(false);
});
