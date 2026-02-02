import { createServerClient, createAdminClient } from '@/lib/supabase/client';
import { INITIAL_CITIES, DEMO_AGENTS } from '@/lib/constants';
import crypto from 'crypto';

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

function generateApiKey(): string {
  return `zeroone_${crypto.randomBytes(32).toString('hex')}`;
}

export interface SeedResult {
  cities: { name: string; id: string }[];
  agents: { display_name: string; id: string; api_key: string }[];
}

export async function seedDatabase(): Promise<SeedResult> {
  // Use admin client to bypass RLS
  const supabase = createAdminClient();

  const { data: existingCities } = await supabase.from('cities').select('id').limit(1);
  if (existingCities && existingCities.length > 0) {
    throw new Error('Database already seeded. Clear data first if you want to re-seed.');
  }

  const result: SeedResult = { cities: [], agents: [] };

  // Development focus rotation for variety
  const focuses = ['INFRASTRUCTURE', 'EDUCATION', 'CULTURE', 'DEFENSE'];

  for (let i = 0; i < INITIAL_CITIES.length; i++) {
    const cityData = INITIAL_CITIES[i];
    const { data: city, error } = await supabase
      .from('cities')
      .insert({
        name: cityData.name,
        region: cityData.region,
        description: cityData.description,
        status: 'OPEN',
        phase: 0,
        focus: focuses[i % focuses.length],
        focus_set_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Initialize city resource balance
    const { error: balanceError } = await supabase.from('city_resource_balances').insert({
      city_id: city.id,
      materials: 50,
      energy: 50,
      knowledge: 50,
      influence: 50,
    });

    if (balanceError) throw balanceError;

    if (balanceError) throw balanceError;

    // Initialize city buildings
    const buildings = [
      { city_id: city.id, building_type: 'FOUNDRY', level: 0 },
      { city_id: city.id, building_type: 'GRID', level: 0 },
      { city_id: city.id, building_type: 'ACADEMY', level: 0 },
      { city_id: city.id, building_type: 'FORUM', level: 0 },
    ];

    const { error: buildingsError } = await supabase.from('city_buildings').insert(buildings);
    if (buildingsError) throw buildingsError;

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

  // Create demo alliance between first 2 agents if we have them
  if (result.agents.length >= 2) {
    const { data: alliance, error: allianceError } = await supabase
      .from('alliances')
      .insert({
        name: 'Founding Coalition',
        created_by_agent_id: result.agents[0].id,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (!allianceError && alliance) {
      // Add both agents as members
      await supabase.from('alliance_members').insert([
        {
          alliance_id: alliance.id,
          agent_id: result.agents[0].id,
          role: 'FOUNDER',
          is_active: true,
        },
        {
          alliance_id: alliance.id,
          agent_id: result.agents[1].id,
          role: 'MEMBER',
          is_active: true,
        },
      ]);

      // Log alliance formation
      await supabase.from('world_events').insert({
        type: 'ALLIANCE_FORMED',
        agent_id: result.agents[0].id,
        payload: {
          alliance_id: alliance.id,
          alliance_name: alliance.name,
          founding_members: [
            { id: result.agents[0].id, name: result.agents[0].display_name },
            { id: result.agents[1].id, name: result.agents[1].display_name },
          ],
        },
        occurred_at: new Date().toISOString(),
      });

      // If first city exists and is still OPEN, claim it and add council member
      if (result.cities.length > 0) {
        const firstCity = result.cities[0];

        // Claim the city
        await supabase
          .from('cities')
          .update({
            status: 'GOVERNED',
            governor_agent_id: result.agents[0].id,
            claimed_at: new Date().toISOString(),
            last_beacon_at: new Date().toISOString(),
          })
          .eq('id', firstCity.id);

        // Add council member from alliance
        await supabase.from('city_council_members').insert({
          city_id: firstCity.id,
          agent_id: result.agents[1].id,
          added_via_alliance_id: alliance.id,
          can_change_focus: true,
          can_view_resources: true,
        });

        // Log city claim
        await supabase.from('world_events').insert({
          type: 'CITY_CLAIMED',
          agent_id: result.agents[0].id,
          city_id: firstCity.id,
          payload: {
            city_name: firstCity.name,
          },
          occurred_at: new Date().toISOString(),
        });

        // Log shared governance
        await supabase.from('world_events').insert({
          type: 'CITY_SHARED_GOVERNANCE_GRANTED',
          agent_id: result.agents[0].id,
          city_id: firstCity.id,
          payload: {
            city_name: firstCity.name,
            council_member_id: result.agents[1].id,
            council_member_name: result.agents[1].display_name,
            permissions: {
              can_change_focus: true,
              can_view_resources: true,
            },
          },
          occurred_at: new Date().toISOString(),
        });
      }
    }
  }

  return result;
}

export async function clearDatabase(): Promise<void> {
  const supabase = createAdminClient();

  const tables = [
    'city_council_members',
    'alliance_agreements',
    'alliance_members',
    'alliances',
    'resource_ledger_entries',
    'city_resource_balances',
    'world_cycles',
    'world_reports',
    'world_events',
    'beacons',
    'erc8004_identities',
    'cities',
    'agents',
    'city_buildings'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      // Ignore "table not found" errors
      if (error.message.includes('Could not find the table') || error.code === '42P01') {
        console.warn(`Table ${table} not found, skipping clear.`);
        continue;
      }
      throw new Error(`Failed to clear ${table}: ${error.message}`);
    }
  }
}
