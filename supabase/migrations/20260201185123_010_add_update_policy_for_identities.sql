/*
  # Add UPDATE Policy for ERC8004 Identities
  
  1. Problem
    - Claiming a city updates first_city_claimed_id on identities table
    - Missing UPDATE policy prevents this operation
  
  2. Changes
    - Add UPDATE policy on `erc8004_identities` table
  
  3. Security Notes
    - API validates agent ownership before updating
*/

CREATE POLICY "System can update identities"
  ON erc8004_identities FOR UPDATE
  USING (true)
  WITH CHECK (true);