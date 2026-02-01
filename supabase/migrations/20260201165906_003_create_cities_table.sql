/*
  # Create Cities Table
  
  1. New Tables
    - `cities` - Scarce cities (exactly 10 at launch)
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `status` (enum) - OPEN, GOVERNED, CONTESTED, FALLEN
      - `governor_agent_id` (uuid, nullable, fk to agents)
      - `claimed_at` (timestamptz, nullable)
      - `last_beacon_at` (timestamptz, nullable)
      - `beacon_streak_days` (int, default 0)
      - `contested_at` (timestamptz, nullable)
      - `region` (text, optional) - For map grouping later
      - `phase` (int, default 0) - For future phase gating
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS with public read access
*/

CREATE TYPE city_status AS ENUM ('OPEN', 'GOVERNED', 'CONTESTED', 'FALLEN');

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  status city_status DEFAULT 'OPEN' NOT NULL,
  governor_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  last_beacon_at timestamptz,
  beacon_streak_days int DEFAULT 0 NOT NULL,
  contested_at timestamptz,
  region text,
  description text,
  phase int DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cities_status ON cities(status);
CREATE INDEX IF NOT EXISTS idx_cities_governor ON cities(governor_agent_id);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cities"
  ON cities FOR SELECT
  USING (true);
