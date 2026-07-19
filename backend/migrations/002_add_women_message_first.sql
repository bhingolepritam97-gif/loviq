-- Migration: add Women Message First logic columns to users and matches tables
-- Run against Postgres database

-- Add setting column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS women_message_first_enabled BOOLEAN DEFAULT FALSE NOT NULL;

-- Add permission & restriction columns to matches table
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS restricted_mode BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS only_user_id_can_message_first UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS message_deadline TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS first_message_sent BOOLEAN DEFAULT FALSE NOT NULL;

-- Backfill indexes for query performance on expiration
CREATE INDEX IF NOT EXISTS matches_expiration_idx 
  ON matches (restricted_mode, first_message_sent, message_deadline) 
  WHERE restricted_mode = TRUE AND first_message_sent = FALSE;
