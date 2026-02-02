-- Migration: add focus system to cities

-- 1. Create enum for city focus (safe if re-run)
DO $$ BEGIN
  CREATE TYPE city_focus AS ENUM (
    'INFRASTRUCTURE',
    'EDUCATION',
    'CULTURE',
    'DEFENSE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add focus columns to cities table
ALTER TABLE cities
  ADD COLUMN IF NOT EXISTS focus city_focus,
  ADD COLUMN IF NOT EXISTS focus_set_at timestamptz;

-- 3. Optional: backfill existing cities
UPDATE cities
SET focus = 'INFRASTRUCTURE',
    focus_set_at = now()
WHERE focus IS NULL;

-- 4. Optional: enforce not-null going forward
ALTER TABLE cities
  ALTER COLUMN focus SET NOT NULL;

-- 5. Index for gameplay queries
CREATE INDEX IF NOT EXISTS idx_cities_focus ON cities(focus);


-- 6. City resource balances table (required by seed)
CREATE TABLE IF NOT EXISTS city_resource_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  materials integer NOT NULL DEFAULT 0,
  energy integer NOT NULL DEFAULT 0,
  knowledge integer NOT NULL DEFAULT 0,
  influence integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(city_id)
);

CREATE INDEX IF NOT EXISTS idx_city_resource_balances_city_id
  ON city_resource_balances(city_id);

-- 7. City Buildings table
CREATE TABLE IF NOT EXISTS city_buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    building_type TEXT NOT NULL, -- 'FOUNDRY', 'GRID', 'ACADEMY', 'FORUM'
    level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0),
    upgrading BOOLEAN NOT NULL DEFAULT FALSE,
    upgrade_started_at TIMESTAMPTZ,
    upgrade_complete_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(city_id, building_type)
);

-- Constraint for building types
DO $$ BEGIN
    ALTER TABLE city_buildings
    ADD CONSTRAINT check_building_type 
    CHECK (building_type IN ('FOUNDRY', 'GRID', 'ACADEMY', 'FORUM'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_city_buildings_city_id ON city_buildings(city_id);
CREATE INDEX IF NOT EXISTS idx_city_buildings_type ON city_buildings(building_type);

-- RLS
ALTER TABLE city_buildings ENABLE ROW LEVEL SECURITY;

-- Policies (consistent with other tables in setup_database.sql)
DO $$ BEGIN
  CREATE POLICY buildings_select_public
    ON city_buildings FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Trigger for updated_at (assuming function exists from setup, or we create if not)
-- The setup_database.sql usually expects a trigger function, let's verify if we need to create one or if it's standard.
-- Checking setup_database.sql, it doesn't explicitly define update_updated_at_column.
-- Standard supabase function is moddatetime but usually we can just use a simple one or skip if not strictly needed.
-- We'll assume for now we can just rely on manual updates or basic defaults, or add the function if widely used.
-- Actually, let's just make it simple and only create trigger if function exists, or create function safely.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_city_buildings_updated_at
      BEFORE UPDATE ON city_buildings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- 8. Seed existing cities with buildings
INSERT INTO city_buildings (city_id, building_type, level)
SELECT id, 'FOUNDRY', 0 FROM cities
ON CONFLICT (city_id, building_type) DO NOTHING;

INSERT INTO city_buildings (city_id, building_type, level)
SELECT id, 'GRID', 0 FROM cities
ON CONFLICT (city_id, building_type) DO NOTHING;

INSERT INTO city_buildings (city_id, building_type, level)
SELECT id, 'ACADEMY', 0 FROM cities
ON CONFLICT (city_id, building_type) DO NOTHING;

INSERT INTO city_buildings (city_id, building_type, level)
SELECT id, 'FORUM', 0 FROM cities
ON CONFLICT (city_id, building_type) DO NOTHING;
