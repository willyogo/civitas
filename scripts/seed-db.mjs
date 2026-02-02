import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const INITIAL_CITIES = [
  { name: 'Aurelia', region: 'Northern Highlands', description: 'Ancient seat of learning and archives' },
  { name: 'Veritas', region: 'Central Plains', description: 'Hub of trade and discourse' },
  { name: 'Solis', region: 'Eastern Coast', description: 'Maritime gateway and cultural nexus' },
  { name: 'Noctis', region: 'Western Mountains', description: 'Fortress city of strategic importance' },
  { name: 'Tempus', region: 'Southern Valleys', description: 'Agricultural heartland and grain reserve' },
  { name: 'Aether', region: 'Sky Islands', description: 'Research colony and observatory' },
  { name: 'Terra', region: 'Deep Forests', description: 'Resource extraction and wilderness outpost' },
  { name: 'Aqualis', region: 'River Delta', description: 'Water management and fishing port' },
  { name: 'Ignis', region: 'Volcanic Plains', description: 'Industrial forge and energy production' },
  { name: 'Ventus', region: 'Wind Steppes', description: 'Communication relay and transport junction' },
];

const DEMO_AGENTS = [
  { display_name: 'Agent Alpha', identity_token_id: 'erc8004-token-001' },
  { display_name: 'Agent Beta', identity_token_id: 'erc8004-token-002' },
  { display_name: 'Agent Gamma', identity_token_id: 'erc8004-token-003' },
  { display_name: 'Agent Delta', identity_token_id: 'erc8004-token-004' },
  { display_name: 'Agent Epsilon', identity_token_id: 'erc8004-token-005' },
];

function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

function generateApiKey() {
  return `zeroone_${crypto.randomBytes(32).toString('hex')}`;
}

async function clearDatabase() {
  console.log('Clearing existing data...');

  await supabase.from('city_council_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('alliance_agreements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('alliance_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('alliances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('resource_ledger_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('city_resource_balances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('world_cycles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('world_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('world_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('beacons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('erc8004_identities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('cities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('agents').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Database cleared successfully');
}

async function seedDatabase() {
  console.log('Starting database seed...');

  const result = { cities: [], agents: [] };
  const focuses = ['INFRASTRUCTURE', 'EDUCATION', 'CULTURE', 'DEFENSE'];

  // Create cities with focus and resource balances
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

    if (error) {
      console.error(`Error creating city ${cityData.name}:`, error);
      throw error;
    }

    console.log(`Created city: ${city.name} with focus: ${city.focus}`);

    // Initialize city resource balance
    const { error: balanceError } = await supabase.from('city_resource_balances').insert({
      city_id: city.id,
      materials: 50,
      energy: 50,
      knowledge: 50,
      influence: 50,
    });

    if (balanceError) {
      console.error(`Error creating resource balance for ${city.name}:`, balanceError);
      throw balanceError;
    }

    result.cities.push({ name: city.name, id: city.id });
  }

  // Create agents
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

    if (agentError) {
      console.error(`Error creating agent ${agentData.display_name}:`, agentError);
      throw agentError;
    }

    console.log(`Created agent: ${agent.display_name}`);

    const { error: identityError } = await supabase.from('erc8004_identities').insert({
      token_id: agentData.identity_token_id,
      owner_agent_id: agent.id,
      verification_status: 'mock_verified',
    });

    if (identityError) {
      console.error(`Error creating identity for ${agent.display_name}:`, identityError);
      throw identityError;
    }

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

  // Create demo alliance
  if (result.agents.length >= 2) {
    console.log('Creating demo alliance...');

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
      console.log(`Created alliance: ${alliance.name}`);

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

      console.log('Added alliance members');

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

      // Claim first city and add council member
      if (result.cities.length > 0) {
        const firstCity = result.cities[0];
        console.log(`Setting up governed city: ${firstCity.name}`);

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

        console.log('Added council member');

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

  console.log('\n=== Seed Complete ===');
  console.log(`Cities created: ${result.cities.length}`);
  console.log(`Agents created: ${result.agents.length}`);
  console.log('\nAgent API Keys (save these for testing):');
  result.agents.forEach(agent => {
    console.log(`${agent.display_name}: ${agent.api_key}`);
  });

  return result;
}

// Main execution
(async () => {
  try {
    await clearDatabase();
    await seedDatabase();
    console.log('\nDatabase seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
})();
