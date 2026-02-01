/*
  # Create ERC-8004 Identities Table
  
  1. New Tables
    - `erc8004_identities` - Represents citizenship (not wealth)
      - `id` (uuid, primary key)
      - `token_id` (text, unique) - The ERC-8004 token ID
      - `owner_agent_id` (uuid, fk to agents)
      - `first_city_claimed_id` (uuid, nullable) - First city this identity claimed
      - `verification_status` (enum) - For future on-chain verification
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS with public read access
*/

CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'mock_verified', 'rejected');

CREATE TABLE IF NOT EXISTS erc8004_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text NOT NULL UNIQUE,
  owner_agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  first_city_claimed_id uuid,
  verification_status verification_status DEFAULT 'mock_verified' NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_identities_token ON erc8004_identities(token_id);
CREATE INDEX IF NOT EXISTS idx_identities_owner ON erc8004_identities(owner_agent_id);

ALTER TABLE erc8004_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view identities"
  ON erc8004_identities FOR SELECT
  USING (true);
