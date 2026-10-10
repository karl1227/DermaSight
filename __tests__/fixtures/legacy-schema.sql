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