/**
 * SkinSense SQLite Database Service
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

const DB_NAME = 'skinsense.db';

let db: DB | null = null;

/** Open (or create) the database and run schema migrations */
export async function initDatabase(): Promise<void> {
  if (db) return; // already initialised

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
}

/** Return the open DB instance, auto-initialising if needed */
async function getDb(): Promise<DB> {
  if (!db) await initDatabase();
  return db!;
}

/** Insert a new screening record and return the new row id */
export async function insertScreening(
  record: Omit<ScreeningRecord, 'id'>,
): Promise<number> {
  const database = await getDb();

  const result = await database.execute(
    `INSERT INTO screenings (
      patient_id, full_name, age, sex, lesion_location,
      selected_symptoms, abcde_answers, image_path,
      predicted_lesion_type, confidence_score, screening_status,
      threshold_status, matching_visual_features, recommendation_basis,
      recommendation, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
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

  return result.insertId ?? 0;
}

/** Fetch all screening records ordered newest first */
export async function getAllScreenings(): Promise<ScreeningRecord[]> {
  const database = await getDb();
  const result = await database.execute(
    'SELECT * FROM screenings ORDER BY id DESC',
  );
  return (result.rows ?? []) as unknown as ScreeningRecord[];
}

/** Fetch a single record by id */
export async function getScreeningById(
  id: number,
): Promise<ScreeningRecord | null> {
  const database = await getDb();
  const result = await database.execute(
    'SELECT * FROM screenings WHERE id = ?',
    [id],
  );
  const rows = result.rows ?? [];
  return rows.length > 0 ? (rows[0] as unknown as ScreeningRecord) : null;
}

/** Delete a single record by id */
export async function deleteScreening(id: number): Promise<void> {
  const database = await getDb();
  await database.execute('DELETE FROM screenings WHERE id = ?', [id]);
}

/** Delete ALL records (used from Settings screen) */
export async function deleteAllScreenings(): Promise<void> {
  const database = await getDb();
  await database.execute('DELETE FROM screenings');
}
