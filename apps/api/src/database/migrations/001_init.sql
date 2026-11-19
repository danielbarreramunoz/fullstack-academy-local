-- 001_init.sql — esquema base academy (PostgreSQL 16)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL CHECK (char_length(email::text) <= 255),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','mentor','admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- CITEXT requiere extensión citext; fallback a TEXT si no existe:
-- Si falla, crear extensión citext manualmente.

CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  order_index INT NOT NULL CHECK (order_index >= 0),
  description TEXT
);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  order_index INT NOT NULL CHECK (order_index >= 0),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  summary TEXT NOT NULL,
  theory_md TEXT NOT NULL DEFAULT '',
  lab_prompt TEXT NOT NULL DEFAULT '',
  checklist_json JSONB NOT NULL DEFAULT '{"items":[]}',
  estimated_minutes INT NOT NULL DEFAULT 30 CHECK (estimated_minutes BETWEEN 5 AND 240),
  UNIQUE (track_id, order_index)
);

CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  notes_md TEXT CHECK (char_length(notes_md) <= 20000),
  next_review_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS user_capabilities (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  capability TEXT NOT NULL CHECK (capability ~ '^[a-z_]+:[a-z]+$'),
  PRIMARY KEY (user_id, capability)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  status_code INT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices (EXPLAIN ANALYZE en lección M2L2)
CREATE INDEX IF NOT EXISTS idx_lessons_track_order ON lessons (track_id, order_index);
CREATE INDEX IF NOT EXISTS idx_progress_user_status ON user_progress (user_id, status);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON user_progress (lesson_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_created ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);
