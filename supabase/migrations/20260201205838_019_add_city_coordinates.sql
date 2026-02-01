/*
  # Add Geographic Coordinates to Cities

  1. Schema Changes
    - `cities` table
      - `latitude` (double precision) - Geographic latitude coordinate (-90 to 90)
      - `longitude` (double precision) - Geographic longitude coordinate (-180 to 180)
  
  2. Purpose
    - Enable proper city positioning on both flat and 3D globe map views
    - Support zoom/pan navigation and interactive globe rotation
    - Cities will be mapped to real-world geographic locations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cities' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE cities ADD COLUMN latitude double precision;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cities' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE cities ADD COLUMN longitude double precision;
  END IF;
END $$;