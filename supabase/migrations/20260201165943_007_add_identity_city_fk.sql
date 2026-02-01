/*
  # Add Foreign Key for First City Claimed
  
  1. Changes
    - Add foreign key constraint from erc8004_identities.first_city_claimed_id to cities.id
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'erc8004_identities_first_city_claimed_id_fkey'
  ) THEN
    ALTER TABLE erc8004_identities 
    ADD CONSTRAINT erc8004_identities_first_city_claimed_id_fkey 
    FOREIGN KEY (first_city_claimed_id) REFERENCES cities(id) ON DELETE SET NULL;
  END IF;
END $$;
