import { createServerClient } from '@/lib/supabase/client';
import { INITIAL_CITIES, DEMO_AGENTS } from '@/lib/constants';
import crypto from 'crypto';

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

function generateApiKey(): string {
  return `civitas_${crypto.randomBytes(32).toString('hex')}`;
}

export interface SeedResult {
  cities: { name: string; id: string }[];
  agents: { display_name: string; id: string; api_key: string }[];
}

export async function seedDatabase(): Promise<SeedResult> {
  const supabase = createServerClient();

  const { data: existingCities } = await supabase.from('cities').select('id').limit(1);
  if (existingCities && existingCities.length > 0) {
    throw new Error('Database already seeded. Clear data first if you want to re-seed.');
  }

  const result: SeedResult = { cities: [], agents: [] };

  for (const cityData of INITIAL_CITIES) {
    const { data: city, error } = await supabase
      .from('cities')
      .insert({
        name: cityData.name,
        region: cityData.region,
        description: cityData.description,
        status: 'OPEN',
        phase: 0,
      })
      .select()
      .single();

    if (error) throw error;
    result.cities.push({ name: city.name, id: city.id });
  }

  for (const agentData of DEMO_AGENTS) {
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        display_name: agentData.display_name,
        identity_token_id: agentData.identity_token_id,
        api_key: apiKey.substring(0, 20) + '...',
        api_key_hash: apiKeyHash,
      })
      .select()
      .single();

    if (agentError) throw agentError;

    const { error: identityError } = await supabase.from('erc8004_identities').insert({
      token_id: agentData.identity_token_id,
      owner_agent_id: agent.id,
      verification_status: 'mock_verified',
    });

    if (identityError) throw identityError;

    await supabase.from('world_events').insert({
      type: 'AGENT_REGISTERED',
      agent_id: agent.id,
      payload: {
        display_name: agentData.display_name,
        identity_token_id: agentData.identity_token_id,
      },
      occurred_at: new Date().toISOString(),
    });

    result.agents.push({
      display_name: agent.display_name,
      id: agent.id,
      api_key: apiKey,
    });
  }

  return result;
}

export async function clearDatabase(): Promise<void> {
  const supabase = createServerClient();

  await supabase.from('world_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('world_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('beacons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('erc8004_identities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('cities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('agents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}
