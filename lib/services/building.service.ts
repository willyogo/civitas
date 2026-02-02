import { createServerClient, createAdminClient } from '@/lib/supabase/client';
import { Database, CityBuilding, CityResourceBalance } from '@/lib/types/database';

export const BUILDING_COSTS = {
    // Base costs * level
    MATERIALS: 100,
    ENERGY: 40,
};

export const BASE_UPGRADE_TIMES_HOURS = {
    FOUNDRY: 6,
    GRID: 8,
    ACADEMY: 10,
    FORUM: 12,
};

export const BUILDING_PRODUCTION = {
    FOUNDRY: { output: 10, energy_cost: 2 },
    GRID: { output: 12, energy_cost: 0 },
    ACADEMY: { output: 6, energy_cost: 2 },
    FORUM: { output: 4, energy_cost: 1 },
};

export async function getCityBuildings(cityId: string) {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('city_buildings')
        .select('*')
        .eq('city_id', cityId);

    if (error) throw error;
    return data as CityBuilding[];
}

export async function upgradeBuilding(cityId: string, buildingType: string, agentId: string, reason: string = '') {
    const supabase = createAdminClient();

    // 1. Validate building exists and is not upgrading
    const { data: building, error: buildingError } = await supabase
        .from('city_buildings')
        .select('*')
        .eq('city_id', cityId)
        .eq('building_type', buildingType)
        .single();

    if (buildingError) throw new Error('Building not found');
    if (building.upgrading) throw new Error('Building is already upgrading');

    // 2. Validate resources
    const nextLevel = building.level + 1;
    const materialCost = BUILDING_COSTS.MATERIALS * nextLevel;
    const energyCost = BUILDING_COSTS.ENERGY * nextLevel;

    const { data: balance, error: balanceError } = await supabase
        .from('city_resource_balances')
        .select('*')
        .eq('city_id', cityId)
        .single();

    if (balanceError || !balance) throw new Error('City resources not found');

    if (balance.materials < materialCost || balance.energy < energyCost) {
        throw new Error(`Insufficient resources. Needed: ${materialCost} Materials, ${energyCost} Energy`);
    }

    // 3. Calculate time with knowledge reduction
    const baseTimeHours = BASE_UPGRADE_TIMES_HOURS[buildingType as keyof typeof BASE_UPGRADE_TIMES_HOURS];
    // Knowledge reduces time: max 50% reduction at 1000 knowledge (simplified)
    // Formula: base_time * (1 - min(knowledge / 1000, 0.5))
    const knowledgeReduction = Math.min(balance.knowledge / 1000, 0.5);
    const effectiveTimeHours = baseTimeHours * nextLevel * (1 - knowledgeReduction);
    const upgradeCompleteAt = new Date(Date.now() + effectiveTimeHours * 3600 * 1000).toISOString();

    // 4. Perform Transaction (Deduct resources, Set upgrading state)
    // supabase-js doesn't natively support complex transactions easily without RPC, 
    // but we'll do optimistic sequence with checks. 
    // For robustness, an RPC `start_upgrade` would be better, but we'll implement TS logic for now as per plan.

    // Deduct
    const { error: deductionError } = await supabase
        .from('city_resource_balances')
        .update({
            materials: balance.materials - materialCost,
            energy: balance.energy - energyCost
        })
        .eq('city_id', cityId)
        .eq('materials', balance.materials) // Optimistic Lock
        .eq('energy', balance.energy);

    if (deductionError) throw new Error('Concurrency error or failed to deduct resources');

    // Start Upgrade
    const { error: updateError } = await supabase
        .from('city_buildings')
        .update({
            upgrading: true,
            upgrade_started_at: new Date().toISOString(),
            upgrade_complete_at: upgradeCompleteAt
        })
        .eq('id', building.id);

    if (updateError) {
        // Logic to refund would go here ideally
        throw new Error('Failed to start upgrade');
    }

    // Log Event
    await supabase.from('world_events').insert({
        type: 'BUILDING_UPGRADE_STARTED' as any, // Type cast until enum updated
        city_id: cityId,
        agent_id: agentId,
        payload: {
            building_type: buildingType,
            level: building.level,
            next_level: nextLevel,
            cost: { materials: materialCost, energy: energyCost },
            complete_at: upgradeCompleteAt,
            reason: reason || undefined
        }
    });

    return { success: true, complete_at: upgradeCompleteAt };
}

export async function checkBuildingUpgrades(cityId: string) {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Find upgrades that are upgrading AND complete_at <= now
    const { data: buildings, error } = await supabase
        .from('city_buildings')
        .select('*')
        .eq('city_id', cityId)
        .eq('upgrading', true)
        .lte('upgrade_complete_at', now);

    if (error) {
        console.error('Error checking upgrades:', error);
        return;
    }

    if (!buildings || buildings.length === 0) return;

    for (const building of buildings) {
        // Complete the upgrade
        const nextLevel = building.level + 1;

        const { error: updateError } = await supabase
            .from('city_buildings')
            .update({
                level: nextLevel,
                upgrading: false,
                upgrade_started_at: null,
                upgrade_complete_at: null,
                updated_at: now
            })
            .eq('id', building.id);

        if (updateError) {
            console.error(`Failed to complete upgrade for building ${building.id}:`, updateError);
            continue;
        }

        // Log completion
        await supabase.from('world_events').insert({
            type: 'BUILDING_UPGRADE_COMPLETED' as any,
            city_id: cityId,
            payload: {
                building_id: building.id,
                building_type: building.building_type,
                new_level: nextLevel,
            },
            occurred_at: now
        });
    }
}
