/**
 * DermaSight SQLite Database Service
 * Uses @op-engineering/op-sqlite v16 — compatible with RN 0.86 / New Arch.
 *
 * API notes for this version:
 *   - open()    → returns DB synchronously
 *   - db.execute(sql, params?) → Promise<QueryResult>
 *   - QueryResult.rows → Array<Record<string, Scalar>>  (plain array, no ._array)
 *   - QueryResult.insertId → number | undefined
 */

import { open, type DB } from '@op-engineering/op-sqlite';
import { ScreeningRecord } from '../types';
import { Owner, User } from '../auth/types';
import { secureId } from '../utils/secureId';

// Preserve the existing on-device database across the display-name change.
const DB_NAME = 'skinsense.db';

let db: DB | null = null;
let initialization: Promise<void> | null = null;

/** Open (or create) the database and run schema migrations */
export function initDatabase(): Promise<void> {
  if (!initialization)
    initialization = initialize().catch(error => {
      db?.close();
      db = null;
      initialization = null;
      throw error;
    });
  return initialization;
}
async function initialize(): Promise<void> {
  // open() is synchronous in op-sqlite v16
  db = open({ name: DB_NAME });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS screenings (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id             TEXT NOT NULL,
      full_name              TEXT NOT NULL,
      age                    INTEGER NOT NULL,
      sex                    TEXT NOT NULL,
      lesion_location        TEXT NOT NULL,
      selected_symptoms      TEXT NOT NULL,
      abcde_answers          TEXT NOT NULL,
      image_path             TEXT NOT NULL,
      predicted_lesion_type  TEXT NOT NULL,
      confidence_score       REAL NOT NULL,
      screening_status       TEXT NOT NULL,
      threshold_status       TEXT NOT NULL,
      matching_visual_features TEXT NOT NULL,
      recommendation_basis   TEXT NOT NULL,
      recommendation         TEXT NOT NULL,
      created_at             TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  await db.execute('PRAGMA foreign_keys = ON');
  // A server account can be deleted and recreated with the same email but a new
  // ID. Local historical profiles must coexist: scan ownership follows ID.
  const userIndexes = (await db.execute('PRAGMA index_list(users)')).rows;
  let hasUniqueEmail = false;
  for (const index of userIndexes) {
    if (!index.unique) continue;
    const columns = (
      await db.execute(
        `PRAGMA index_info("${String(index.name).replace(/"/g, '""')}")`,
      )
    ).rows;
    if (columns.length === 1 && columns[0].name === 'email')
      hasUniqueEmail = true;
  }
  if (hasUniqueEmail) {
    // Rebuild only the profile cache, preserving IDs and all referenced rows.
    // Foreign-key enforcement must be toggled outside the transaction.
    await db.execute('PRAGMA foreign_keys = OFF');
    try {
      await db.transaction(async tx => {
        await tx.execute(`CREATE TABLE users_next (
          id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL,
          sex TEXT NOT NULL CHECK(sex IN ('Male','Female','Other')),
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`);
        await tx.execute(
          'INSERT INTO users_next SELECT id,email,name,sex,created_at,updated_at FROM users',
        );
        await tx.execute('DROP TABLE users');
        await tx.execute('ALTER TABLE users_next RENAME TO users');
        if ((await tx.execute('PRAGMA foreign_key_check')).rows.length)
          throw new Error('Profile migration could not preserve references');
      });
    } finally {
      await db.execute('PRAGMA foreign_keys = ON');
    }
  }
  await db.transaction(async tx => {
    await tx.execute(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL,
      sex TEXT NOT NULL CHECK(sex IN ('Male','Female','Other')),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`);
    await tx.execute(`CREATE TABLE IF NOT EXISTS guest_sessions (
      id TEXT PRIMARY KEY, created_at TEXT NOT NULL, ended_at TEXT,
      migrated_user_id TEXT REFERENCES users(id))`);
    const columns = (
      await tx.execute('PRAGMA table_info(screenings)')
    ).rows.map(row => row.name);
    if (!columns.includes('user_id'))
      await tx.execute(
        'ALTER TABLE screenings ADD COLUMN user_id TEXT REFERENCES users(id)',
      );
    if (!columns.includes('guest_session_id'))
      await tx.execute(
        'ALTER TABLE screenings ADD COLUMN guest_session_id TEXT REFERENCES guest_sessions(id)',
      );
    if (!columns.includes('screening_id'))
      await tx.execute('ALTER TABLE screenings ADD COLUMN screening_id TEXT');
    // Keep pre-account history intact and unassigned. Never expose it to a new account.
    await tx.execute(
      "UPDATE screenings SET screening_id = 'legacy-' || id WHERE screening_id IS NULL",
    );
    await tx.execute(
      'CREATE UNIQUE INDEX IF NOT EXISTS screenings_identifier ON screenings(screening_id)',
    );
    await tx.execute(
      'CREATE INDEX IF NOT EXISTS screenings_user ON screenings(user_id, id)',
    );
    await tx.execute(
      'CREATE INDEX IF NOT EXISTS screenings_guest ON screenings(guest_session_id, id)',
    );
    for (const event of ['INSERT', 'UPDATE']) {
      await tx.execute(`CREATE TRIGGER IF NOT EXISTS screenings_owner_${event.toLowerCase()}
        BEFORE ${event} ON screenings
        WHEN (NEW.user_id IS NULL) = (NEW.guest_session_id IS NULL)
        BEGIN SELECT RAISE(ABORT, 'A screening must have exactly one owner'); END`);
    }
    await tx.execute('PRAGMA user_version = 2');
  });
}

/** Return whether the first-run onboarding and consent flow was completed. */
export async function hasCompletedFirstRun(): Promise<boolean> {
  const database = await getDb();
  const result = await database.execute(
    "SELECT value FROM app_settings WHERE key = 'first_run_completed'",
  );
  return result.rows?.[0]?.value === 'true';
}

/** Persist completion of the first-run onboarding and consent flow. */
export async function markFirstRunCompleted(): Promise<void> {
  const database = await getDb();
  await database.execute(
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('first_run_completed', 'true')",
  );
}

export async function accountNeedsOnboarding(userId: string): Promise<boolean> {
  const database = await getDb();
  const result = await database.execute(
    'SELECT value FROM app_settings WHERE key = ?',
    [`onboarding:${userId}`],
  );
  return result.rows[0]?.value === 'pending';
}
export async function setAccountOnboarding(
  userId: string,
  pending: boolean,
): Promise<void> {
  const database = await getDb();
  await database.execute(
    'INSERT OR REPLACE INTO app_settings (key,value) VALUES (?,?)',
    [`onboarding:${userId}`, pending ? 'pending' : 'complete'],
  );
}

/** Return the open DB instance, auto-initialising if needed */
async function getDb(): Promise<DB> {
  await initDatabase();
  return db!;
}

/** Insert a new screening record and return the new row id */
export async function insertScreening(
  record: Omit<ScreeningRecord, 'id' | 'user_id' | 'guest_session_id'>,
  owner: Owner,
): Promise<number> {
  const database = await getDb();

  const ownership = ownerFilter(owner);
  if (owner.kind === 'guest' && !(await isActiveGuest(owner.id)))
    throw new Error('Guest session ended');
  const result = await database.execute(
    `INSERT INTO screenings (
      screening_id, user_id, guest_session_id, patient_id, full_name, age, sex, lesion_location,
      selected_symptoms, abcde_answers, image_path,
      predicted_lesion_type, confidence_score, screening_status,
      threshold_status, matching_visual_features, recommendation_basis,
      recommendation, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(screening_id) DO NOTHING`,
    [
      record.screening_id,
      ownership.column === 'user_id' ? owner.id : null,
      ownership.column === 'guest_session_id' ? owner.id : null,
      record.patient_id,
      record.full_name,
      record.age,
      record.sex,
      record.lesion_location,
      record.selected_symptoms,
      record.abcde_answers,
      record.image_path,
      record.predicted_lesion_type,
      record.confidence_score,
      record.screening_status,
      record.threshold_status,
      record.matching_visual_features,
      record.recommendation_basis,
      record.recommendation,
      record.created_at,
    ],
  );

  if (result.rowsAffected && result.insertId) return result.insertId;
  const existing = await database.execute(
    `SELECT id FROM screenings WHERE screening_id = ? AND ${ownership.column} = ?`,
    [record.screening_id, owner.id],
  );
  if (!existing.rows[0]) throw new Error('Screening could not be saved');
  return Number(existing.rows[0].id);
}

/** Fetch all screening records ordered newest first */
export async function getAllScreenings(
  owner: Owner,
): Promise<ScreeningRecord[]> {
  const database = await getDb();
  const result = await database.execute(
    `SELECT * FROM screenings WHERE ${
      ownerFilter(owner).column
    } = ? ORDER BY id DESC`,
    [owner.id],
  );
  return (result.rows ?? []) as unknown as ScreeningRecord[];
}

/** Fetch a single record by id */
export async function getScreeningById(
  id: number,
  owner: Owner,
): Promise<ScreeningRecord | null> {
  const database = await getDb();
  const result = await database.execute(
    `SELECT * FROM screenings WHERE id = ? AND ${
      ownerFilter(owner).column
    } = ?`,
    [id, owner.id],
  );
  const rows = result.rows ?? [];
  return rows.length > 0 ? (rows[0] as unknown as ScreeningRecord) : null;
}

/** Delete a single record by id */
export async function deleteScreening(id: number, owner: Owner): Promise<void> {
  const database = await getDb();
  await database.execute(
    `DELETE FROM screenings WHERE id = ? AND ${ownerFilter(owner).column} = ?`,
    [id, owner.id],
  );
}

/** Delete ALL records (used from Settings screen) */
export async function deleteAllScreenings(owner: Owner): Promise<void> {
  const database = await getDb();
  await database.execute(
    `DELETE FROM screenings WHERE ${ownerFilter(owner).column} = ?`,
    [owner.id],
  );
}

/** Update patient info fields (full_name, age, sex) for a record */
export async function updatePatientInfo(
  id: number,
  fullName: string,
  age: number,
  sex: string,
  owner: Owner,
): Promise<void> {
  const database = await getDb();
  await database.execute(
    `UPDATE screenings SET full_name = ?, age = ?, sex = ? WHERE id = ? AND ${
      ownerFilter(owner).column
    } = ?`,
    [fullName, age, sex, id, owner.id],
  );
}

/** SQL identifiers are selected only from this allow-list, never caller input. */
export function ownerFilter(owner: Owner): {
  column: 'user_id' | 'guest_session_id';
} {
  if (!owner || typeof owner.id !== 'string' || !owner.id.trim())
    throw new Error('An active session is required');
  if (owner.kind === 'user') return { column: 'user_id' };
  if (owner.kind === 'guest') return { column: 'guest_session_id' };
  throw new Error('Invalid session');
}
export async function createGuestSession(): Promise<string> {
  const database = await getDb();
  const id = secureId();
  await database.execute(
    'INSERT INTO guest_sessions (id, created_at) VALUES (?,?)',
    [id, new Date().toISOString()],
  );
  return id;
}
export async function isActiveGuest(id: string): Promise<boolean> {
  const database = await getDb();
  const result = await database.execute(
    'SELECT id FROM guest_sessions WHERE id = ? AND ended_at IS NULL',
    [id],
  );
  return result.rows.length === 1;
}
export async function endGuestSession(id: string): Promise<void> {
  const database = await getDb();
  await database.execute(
    'UPDATE guest_sessions SET ended_at = ? WHERE id = ?',
    [new Date().toISOString(), id],
  );
}
/** Account profile cache and guest adoption commit together or both roll back. */
export async function activateAccount(
  user: User,
  guestId?: string,
): Promise<void> {
  const database = await getDb();
  await database.transaction(async tx => {
    await tx.execute(
      `INSERT INTO users (id,email,name,sex,created_at,updated_at) VALUES (?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name,sex=excluded.sex,updated_at=excluded.updated_at`,
      [
        user.id,
        user.email,
        user.name,
        user.sex,
        user.created_at,
        user.updated_at,
      ],
    );
    if (guestId) {
      const guest = (
        await tx.execute('SELECT * FROM guest_sessions WHERE id = ?', [guestId])
      ).rows[0];
      if (!guest || (guest.ended_at && guest.migrated_user_id !== user.id))
        throw new Error('Guest session cannot be migrated');
      await tx.execute(
        `UPDATE screenings SET user_id = ?, guest_session_id = NULL WHERE guest_session_id = ?`,
        [user.id, guestId],
      );
      await tx.execute(
        'UPDATE guest_sessions SET ended_at = ?, migrated_user_id = ? WHERE id = ?',
        [new Date().toISOString(), user.id, guestId],
      );
      await tx.execute('DELETE FROM app_settings WHERE key = ?', [
        `signup-upgrade:${user.id}`,
      ]);
    }
  });
}
export async function historyEnabledFor(owner: Owner): Promise<boolean> {
  ownerFilter(owner);
  const database = await getDb();
  const result = await database.execute(
    'SELECT value FROM app_settings WHERE key = ?',
    [`history:${owner.kind}:${owner.id}`],
  );
  return result.rows[0]?.value !== 'false';
}
export async function setHistoryEnabled(
  owner: Owner,
  enabled: boolean,
): Promise<void> {
  ownerFilter(owner);
  const database = await getDb();
  await database.execute(
    'INSERT OR REPLACE INTO app_settings (key,value) VALUES (?,?)',
    [`history:${owner.kind}:${owner.id}`, String(enabled)],
  );
}
/** Non-secret recovery intent. Only a verified login for this user can finish it. */
export async function stageGuestUpgrade(
  userId: string,
  guestId: string,
): Promise<void> {
  const database = await getDb();
  if (!(await isActiveGuest(guestId))) throw new Error('Guest session ended');
  await database.execute(
    'INSERT OR REPLACE INTO app_settings (key,value) VALUES (?,?)',
    [`signup-upgrade:${userId}`, guestId],
  );
}
export async function pendingGuestUpgrade(
  userId: string,
): Promise<string | undefined> {
  const database = await getDb();
  const result = await database.execute(
    'SELECT value FROM app_settings WHERE key = ?',
    [`signup-upgrade:${userId}`],
  );
  return typeof result.rows[0]?.value === 'string'
    ? result.rows[0].value
    : undefined;
}
