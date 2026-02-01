/*
  # Create World Reports Table
  
  1. New Tables
    - `world_reports` - Daily and weekly narrative summaries
      - `id` (uuid, primary key)
      - `period` (enum) - DAILY or WEEKLY
      - `period_start` (timestamptz)
      - `period_end` (timestamptz)
      - `generated_at` (timestamptz)
      - `headline` (text) - Main headline
      - `summary_markdown` (text) - Full narrative summary
      - `top_events` (jsonb) - Array of WorldEvent IDs
      - `metrics` (jsonb) - Statistics snapshot
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS with public read access
*/

CREATE TYPE report_period AS ENUM ('DAILY', 'WEEKLY');

CREATE TABLE IF NOT EXISTS world_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period report_period NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  generated_at timestamptz DEFAULT now() NOT NULL,
  headline text NOT NULL,
  summary_markdown text NOT NULL,
  top_events jsonb DEFAULT '[]' NOT NULL,
  metrics jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_period ON world_reports(period);
CREATE INDEX IF NOT EXISTS idx_reports_generated ON world_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_period_dates ON world_reports(period_start, period_end);

ALTER TABLE world_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view world reports"
  ON world_reports FOR SELECT
  USING (true);
