import 'dotenv/config';

import { createServerClient } from '@/lib/supabase/client';
import { upgradeBuilding } from '@/lib/services/building.service';
import { getCityEconomy } from '@/lib/services/cities';

async function verify() {
    const supabase = createServerClient();

    // 1. Get a city
    const { data: city } = await supabase.from('cities').select('id, name, governor_agent_id').limit(1).single();
    if (!city) {
        console.log('No cities found to verify.');
        return;
    }

    console.log(`Verifying city: ${city.name} (${city.id})`);

    // 2. Initial State
    let economy = await getCityEconomy(city.id);
    console.log('Initial Economy Balances:', economy.balances);
    console.log('Initial Buildings Count:', economy.buildings.length);

    if (economy.buildings.length === 0) {
        console.log('No buildings found. Seeding buildings for test city...');
        const buildings = [
            { city_id: city.id, building_type: 'FOUNDRY', level: 0 },
            { city_id: city.id, building_type: 'GRID', level: 0 },
            { city_id: city.id, building_type: 'ACADEMY', level: 0 },
            { city_id: city.id, building_type: 'FORUM', level: 0 },
        ];
        const { error } = await supabase.from('city_buildings').insert(buildings);
        if (error) {
            console.error('Failed to seed buildings:', error.message);
            return;
        }
        // Re-fetch
        economy = await getCityEconomy(city.id);
        console.log('Refetched Buildings Count:', economy.buildings.length);
    }

    // 3. Start Upgrade
    // Ensure we have an agent. If governor unknown, use any agent.
    let agentId = city.governor_agent_id;
    if (!agentId) {
        const { data: agent } = await supabase.from('agents').select('id').limit(1).single();
        agentId = agent?.id;
        // If we are not governor, we might fail upgrade if check is strict.
        // But let's try.
        if (!agentId) {
            console.log('No agents found to test upgrade.');
            return;
        }
        console.log(`Using agent ${agentId} (not governor)`);
    }

    // Cheat: Grant resources
    console.log('Cheating: Granting resources for test...');
    await supabase.from('city_resource_balances')
        .update({ materials: 500, energy: 500, knowledge: 500 })
        .eq('city_id', city.id);

    try {
        console.log('Attempting to upgrade FOUNDRY...');
        const result = await upgradeBuilding(city.id, 'FOUNDRY', agentId);
        console.log('Upgrade Result:', result);

        const economyAfter = await getCityEconomy(city.id);
        const b = economyAfter.buildings.find(b => b.building_type === 'FOUNDRY');
        console.log('Foundry Level After:', b?.level);
        console.log('Foundry Upgrade Status:', b?.upgrading);
        console.log('Foundry Upgrade Complete At:', b?.upgrade_complete_at);

    } catch (e: any) {
        console.error('Upgrade failed:', e.message);
    }
}

verify();
