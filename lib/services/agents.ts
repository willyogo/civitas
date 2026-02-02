import { createServerClient } from '@/lib/supabase/client';
import type { Agent, AgentPublic, City } from '@/lib/types/database';
import crypto from 'crypto';

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

function generateApiKey(): string {
  return `zeroone_${crypto.randomBytes(32).toString('hex')}`;
}

export async function getAgents(): Promise<AgentPublic[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('agents')
    .select('id, display_name, identity_token_id, wallet_address, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAgentById(id: string): Promise<AgentPublic | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('agents')
    .select('id, display_name, identity_token_id, wallet_address, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAgentByApiKey(apiKey: string): Promise<Agent | null> {
  const supabase = createServerClient();
  const hash = hashApiKey(apiKey);
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('api_key_hash', hash)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createAgent(
  displayName: string,
  identityTokenId: string,
  walletAddress?: string
): Promise<{ agent: Agent; apiKey: string }> {
  const supabase = createServerClient();
  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);

  const { data, error } = await supabase
    .from('agents')
    .insert({
      display_name: displayName,
      identity_token_id: identityTokenId,
      wallet_address: walletAddress || null,
      api_key: apiKey.substring(0, 20) + '...',
      api_key_hash: apiKeyHash,
    })
    .select()
    .single();

  if (error) throw error;

  const { error: identityError } = await supabase
    .from('erc8004_identities')
    .insert({
      token_id: identityTokenId,
      owner_agent_id: data.id,
      verification_status: 'mock_verified',
    });

  if (identityError) throw identityError;

  const { error: eventError } = await supabase.from('world_events').insert({
    type: 'AGENT_REGISTERED',
    agent_id: data.id,
    payload: { display_name: displayName, identity_token_id: identityTokenId },
    occurred_at: new Date().toISOString(),
  });

  if (eventError) throw eventError;

  return { agent: data, apiKey };
}

export async function getAgentCities(agentId: string): Promise<City[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('governor_agent_id', agentId)
    .order('claimed_at', { ascending: false });

  if (error) throw error;
  return (data || []) as City[];
}

export async function getAgentCount(): Promise<number> {
  const supabase = createServerClient();
  const { count, error } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}
