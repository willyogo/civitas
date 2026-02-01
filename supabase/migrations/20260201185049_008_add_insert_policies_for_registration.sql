/*
  # Add INSERT Policies for Agent Registration
  
  1. Problem
    - Agent registration fails because RLS only has SELECT policies
    - The API needs to INSERT into agents, erc8004_identities, and world_events tables
  
  2. Changes
    - Add INSERT policy on `agents` table for public registration
    - Add INSERT policy on `erc8004_identities` table for identity creation
    - Add INSERT policy on `world_events` table for event logging
  
  3. Security Notes
    - Agent registration is intentionally public (any bot can register)
    - Unique constraints prevent duplicate registrations
    - API validates input before database operations
*/

CREATE POLICY "Anyone can register as an agent"
  ON agents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can create identity records"
  ON erc8004_identities FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can log world events"
  ON world_events FOR INSERT
  WITH CHECK (true);