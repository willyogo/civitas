/*
  # Add Policies for City and Beacon Operations
  
  1. Problem
    - Agents cannot claim cities or emit beacons due to missing RLS policies
    - The cities table needs UPDATE policy for claiming and beacon tracking
    - The beacons table needs INSERT policy for emitting beacons
    - The world_reports table needs INSERT policy for report generation
  
  2. Changes
    - Add UPDATE policy on `cities` table for city claiming and beacon updates
    - Add INSERT policy on `beacons` table for beacon emission
    - Add INSERT policy on `world_reports` table for report generation
  
  3. Security Notes
    - API validates agent ownership before allowing city updates
    - Unique constraints and business logic prevent abuse
*/

CREATE POLICY "System can update cities"
  ON cities FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can emit beacons"
  ON beacons FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can generate reports"
  ON world_reports FOR INSERT
  WITH CHECK (true);