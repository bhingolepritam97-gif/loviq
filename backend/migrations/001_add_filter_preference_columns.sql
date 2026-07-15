-- Migration: add discovery filter preference and profile score columns to users table
-- Run once against your Postgres database (Neon / Render / local)
-- These columns power the persistent age-range, distance, and gender filters
-- and store the profile completeness score.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS age_min         INTEGER   DEFAULT 18   NOT NULL,
  ADD COLUMN IF NOT EXISTS age_max         INTEGER   DEFAULT 65   NOT NULL,
  ADD COLUMN IF NOT EXISTS max_distance_km   FLOAT     DEFAULT 80.5 NOT NULL,
  ADD COLUMN IF NOT EXISTS profile_score   INTEGER   DEFAULT 0    NOT NULL;

-- Backfill existing rows with sensible defaults
UPDATE users SET
  age_min          = COALESCE(age_min, 18),
  age_max          = COALESCE(age_max, 65),
  max_distance_km  = COALESCE(max_distance_km, 80.5),
  profile_score    = COALESCE(profile_score, 0)
WHERE age_min IS NULL OR age_max IS NULL OR max_distance_km IS NULL OR profile_score IS NULL;

