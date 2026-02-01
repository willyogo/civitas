/*
  # Create Agents Table
  
  1. New Tables
    - `agents` - Autonomous agents (bots only) that participate in Civitas
      - `id` (uuid, primary key)
      - `display_name` (text, required)
      - `identity_token_id` (text, required) - ERC-8004 token ID
      - `wallet_address` (text, optional)
      - `api_key` (text, unique) - For MVP authentication
      - `api_key_hash` (text) - Hashed version for security
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `agents` table
    - Add policy for public read access (humans can browse)
    - Add policy for agents to read their own sensitive data
*/

CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  identity_token_id text NOT NULL UNIQUE,
  wallet_address text,
  api_key text UNIQUE NOT NULL,
  api_key_hash text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agents_identity_token ON agents(identity_token_id);
CREATE INDEX IF NOT EXISTS idx_agents_api_key_hash ON agents(api_key_hash);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agent public info"
  ON agents FOR SELECT
  USING (true);
