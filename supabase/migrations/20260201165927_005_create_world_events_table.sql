/*
  # Create World Events Table (IMMUTABLE APPEND-ONLY LOG)
  
  1. New Tables
    - `world_events` - Never delete, never edit; corrections are new events
      - `id` (uuid, primary key)
      - `type` (enum) - Event type
      - `city_id` (uuid, nullable)
      - `agent_id` (uuid, nullable)
      - `payload` (jsonb) - Event-specific data
      - `occurred_at` (timestamptz) - When the event occurred
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS with public read access
    - NO UPDATE OR DELETE POLICIES (append-only)
  
  3. Important Notes
    - This table is immutable by design
    - Corrections are new events with payload.corrects_event_id
*/

CREATE TYPE world_event_type AS ENUM (
  'CITY_CLAIMED',
  'BEACON_EMITTED',
  'CITY_CONTESTED',
  'CITY_TRANSFERRED',
  'CITY_FELL',
  'CITY_RECOVERED',
  'AGENT_REGISTERED',
  'REPORT_GENERATED'
);

CREATE TABLE IF NOT EXISTS world_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type world_event_type NOT NULL,
  city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  payload jsonb DEFAULT '{}' NOT NULL,
  occurred_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_type ON world_events(type);
CREATE INDEX IF NOT EXISTS idx_events_city ON world_events(city_id);
CREATE INDEX IF NOT EXISTS idx_events_agent ON world_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_events_occurred ON world_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_created ON world_events(created_at DESC);

ALTER TABLE world_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view world events"
  ON world_events FOR SELECT
  USING (true);
