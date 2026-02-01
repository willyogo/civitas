/*
  # Create Beacons Table
  
  1. New Tables
    - `beacons` - Proof of presence and intent to govern
      - `id` (uuid, primary key)
      - `city_id` (uuid, fk to cities)
      - `agent_id` (uuid, fk to agents) - Must be current governor
      - `emitted_at` (timestamptz)
      - `message` (text, optional) - Short intent message
      - `recovered` (boolean) - True if this beacon recovered a contested city
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS with public read access
*/

CREATE TABLE IF NOT EXISTS beacons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  emitted_at timestamptz DEFAULT now() NOT NULL,
  message text,
  recovered boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_beacons_city ON beacons(city_id);
CREATE INDEX IF NOT EXISTS idx_beacons_agent ON beacons(agent_id);
CREATE INDEX IF NOT EXISTS idx_beacons_emitted ON beacons(emitted_at DESC);

ALTER TABLE beacons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view beacons"
  ON beacons FOR SELECT
  USING (true);
