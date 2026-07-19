-- Migration: Add missing database indexes for swipes, blocks, and matches to prevent full table sequential scans under launch load.

-- 1. Index for incoming likes queue searches (optimizes GET /swipes/likes)
CREATE INDEX IF NOT EXISTS swipes_swiped_id_direction_expired_idx 
  ON swipes (swiped_id, direction, expired_at) 
  WHERE expired_at IS NULL;

-- 2. Index for block lookup checks in the discovery deck query (optimizes GET /deck)
CREATE INDEX IF NOT EXISTS blocks_blocked_id_idx 
  ON blocks (blocked_id);

-- 3. Index for match retrievals on the second user foreign key (optimizes GET /matches)
CREATE INDEX IF NOT EXISTS matches_user_b_id_status_idx 
  ON matches (user_b_id, status) 
  WHERE status = 'active';
