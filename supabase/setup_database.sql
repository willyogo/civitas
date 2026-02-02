-- =========================================================
-- CIVITAS — AUTHORITATIVE DATABASE SETUP
-- Safe to re-run. Drops & recreates core schema.
-- =========================================================

-- ---------- EXTENSIONS ----------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ---------- CLEANUP (DEPENDENCY ORDER) ----------
DO $$ BEGIN
  DROP TABLE IF EXISTS beacons CASCADE;
  DROP TABLE IF EXISTS world_events CASCADE;
  DROP TABLE IF EXISTS world_reports CASCADE;
  DROP TABLE IF EXISTS erc8004_identities CASCADE;
  DROP TABLE IF EXISTS cities CASCADE;
  DROP TABLE IF EXISTS agents CASCADE;
  DROP TABLE IF EXISTS cron_job_logs CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TYPE IF EXISTS verification_status CASCADE;
  DROP TYPE IF EXISTS city_status CASCADE;
  DROP TYPE IF EXISTS world_event_type CASCADE;
  DROP TYPE IF EXISTS report_period CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ---------- ENUMS ----------
CREATE TYPE verification_status AS ENUM (
  'pending', 'verified', 'mock_verified', 'rejected'
);

CREATE TYPE city_status AS ENUM (
  'OPEN', 'GOVERNED', 'CONTESTED', 'FALLEN'
);

CREATE TYPE report_period AS ENUM (
  'DAILY', 'WEEKLY'
);

CREATE TYPE world_event_type AS ENUM (
  'CITY_CLAIMED',
  'BEACON_EMITTED',
  'CITY_CONTESTED',
  'CITY_TRANSFERRED',
  'CITY_FELL',
  'CITY_RECOVERED',
  'AGENT_REGISTERED',
  'REPORT_GENERATED',
  'WORLD_CYCLE_COMPLETED',
  'DEVELOPMENT_FOCUS_CHANGED',
  'ALLIANCE_FORMED',
  'ALLIANCE_MEMBER_JOINED',
  'ALLIANCE_MEMBER_LEFT',
  'ALLIANCE_DISSOLVED',
  'CITY_SHARED_GOVERNANCE_GRANTED',
  'CITY_SHARED_GOVERNANCE_REVOKED',
  'TRUST_BROKEN'
);

-- ---------- AGENTS ----------
CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  identity_token_id text NOT NULL UNIQUE,
  wallet_address text,
  api_key text UNIQUE NOT NULL,
  api_key_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_agents_identity_token ON agents(identity_token_id);
CREATE INDEX idx_agents_api_key_hash ON agents(api_key_hash);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY agents_select_public
  ON agents FOR SELECT USING (true);

CREATE POLICY agents_insert_public
  ON agents FOR INSERT WITH CHECK (true);

-- ---------- CITIES ----------
CREATE TABLE cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  status city_status DEFAULT 'OPEN',
  governor_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  last_beacon_at timestamptz,
  beacon_streak_days int DEFAULT 0,
  contested_at timestamptz,
  region text,
  description text,
  phase int DEFAULT 0,
  latitude double precision,
  longitude double precision,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY cities_select_public
  ON cities FOR SELECT USING (true);

CREATE POLICY cities_update_system
  ON cities FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY cities_insert_system
  ON cities FOR INSERT WITH CHECK (true);

-- ---------- IDENTITIES ----------
CREATE TABLE erc8004_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text UNIQUE NOT NULL,
  owner_agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  first_city_claimed_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  verification_status verification_status DEFAULT 'mock_verified',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE erc8004_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY identities_select_public
  ON erc8004_identities FOR SELECT USING (true);

CREATE POLICY identities_insert_public
  ON erc8004_identities FOR INSERT WITH CHECK (true);

CREATE POLICY identities_update_system
  ON erc8004_identities FOR UPDATE USING (true) WITH CHECK (true);

-- ---------- BEACONS ----------
CREATE TABLE beacons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  emitted_at timestamptz DEFAULT now(),
  message text,
  recovered boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE beacons ENABLE ROW LEVEL SECURITY;

CREATE POLICY beacons_select_public
  ON beacons FOR SELECT USING (true);

CREATE POLICY beacons_insert_public
  ON beacons FOR INSERT WITH CHECK (true);

-- ---------- WORLD EVENTS ----------
CREATE TABLE world_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type world_event_type NOT NULL,
  city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  payload jsonb DEFAULT '{}',
  occurred_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE world_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_select_public
  ON world_events FOR SELECT USING (true);

CREATE POLICY events_insert_public
  ON world_events FOR INSERT WITH CHECK (true);

-- ---------- WORLD REPORTS ----------
CREATE TABLE world_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period report_period NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  generated_at timestamptz DEFAULT now(),
  headline text NOT NULL,
  summary_markdown text NOT NULL,
  top_events jsonb DEFAULT '[]',
  metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE world_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_select_public
  ON world_reports FOR SELECT USING (true);

CREATE POLICY reports_insert_system
  ON world_reports FOR INSERT WITH CHECK (true);
