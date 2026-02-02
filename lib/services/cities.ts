import { createServerClient } from '@/lib/supabase/client';
import type { City, CityWithGovernor } from '@/lib/types/database';
import { WORLD_CONSTANTS } from '@/lib/constants';

export async function getCities(): Promise<CityWithGovernor[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('cities')
    .select(`
      *,
      governor:agents!cities_governor_agent_id_fkey(id, display_name, identity_token_id)
    `)
    .order('name');

  if (error) throw error;
  return (data || []).map((city) => ({
    ...city,
    governor: city.governor as CityWithGovernor['governor'],
  }));
}

export async function getCityById(id: string): Promise<CityWithGovernor | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('cities')
    .select(`
      *,
      governor:agents!cities_governor_agent_id_fkey(id, display_name, identity_token_id)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    governor: data.governor as CityWithGovernor['governor'],
  };
}

export async function getOpenCities(): Promise<City[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('status', 'OPEN')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function claimCity(cityId: string, agentId: string): Promise<City> {
  const supabase = createServerClient();

  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('*')
    .eq('id', cityId)
    .maybeSingle();

  if (cityError) throw cityError;
  if (!city) throw new Error('City not found');
  if (city.status !== 'OPEN') throw new Error('City is not open for claiming');

  const { data: identity, error: identityError } = await supabase
    .from('erc8004_identities')
    .select('*')
    .eq('owner_agent_id', agentId)
    .maybeSingle();

  if (identityError) throw identityError;
  if (!identity) throw new Error('Agent does not have an ERC-8004 identity');

  const now = new Date().toISOString();
  const { data: updatedCity, error: updateError } = await supabase
    .from('cities')
    .update({
      status: 'GOVERNED',
      governor_agent_id: agentId,
      claimed_at: now,
      beacon_streak_days: 0,
      updated_at: now,
    })
    .eq('id', cityId)
    .select()
    .single();

  if (updateError) throw updateError;

  const { error: eventError } = await supabase.from('world_events').insert({
    type: 'CITY_CLAIMED',
    city_id: cityId,
    agent_id: agentId,
    payload: { city_name: city.name },
    occurred_at: now,
  });

  if (eventError) throw eventError;

  if (!identity.first_city_claimed_id) {
    await supabase
      .from('erc8004_identities')
      .update({ first_city_claimed_id: cityId, updated_at: now })
      .eq('id', identity.id);
  }

  return updatedCity;
}

export async function getCityStats() {
  const supabase = createServerClient();
  const { data, error } = await supabase.from('cities').select('status');

  if (error) throw error;

  const stats = {
    governed: 0,
    contested: 0,
    open: 0,
    fallen: 0,
    total: data?.length || 0,
  };

  data?.forEach((city) => {
    switch (city.status) {
      case 'GOVERNED':
        stats.governed++;
        break;
      case 'CONTESTED':
        stats.contested++;
        break;
      case 'OPEN':
        stats.open++;
        break;
      case 'FALLEN':
        stats.fallen++;
        break;
    }
  });

  return stats;
}

export function isBeaconOverdue(lastBeaconAt: string | null): boolean {
  if (!lastBeaconAt) return true;
  const lastBeacon = new Date(lastBeaconAt).getTime();
  const now = Date.now();
  return now - lastBeacon > WORLD_CONSTANTS.BEACON_WINDOW_MS;
}

export function getTimeUntilContested(lastBeaconAt: string | null): number {
  if (!lastBeaconAt) return 0;
  const lastBeacon = new Date(lastBeaconAt).getTime();
  const deadline = lastBeacon + WORLD_CONSTANTS.BEACON_WINDOW_MS;
  return Math.max(0, deadline - Date.now());
}

import { BUILDING_COSTS, BASE_UPGRADE_TIMES_HOURS } from './building.service';

export async function getCityEconomy(cityId: string) {
  const supabase = createServerClient();

  // Fetch Balances
  const { data: balance } = await supabase
    .from('city_resource_balances')
    .select('*')
    .eq('city_id', cityId)
    .maybeSingle();

  // Fetch Buildings
  const { data: buildingsData } = await supabase
    .from('city_buildings')
    .select('*')
    .eq('city_id', cityId)
    .order('building_type');

  const buildings = buildingsData || [];

  // Fetch Focus
  const { data: city } = await supabase
    .from('cities')
    .select('focus, focus_set_at')
    .eq('id', cityId)
    .single();

  // Calculate Storage Cap
  const foundry = buildings.find(b => b.building_type === 'FOUNDRY');
  const foundryLevel = foundry ? foundry.level : 0;
  const storageCap = 500 + (foundryLevel * 250);

  // Enrich Buildings with Upgrade Info
  const enrichedBuildings = buildings.map(b => {
    const nextLevel = b.level + 1;
    const materialCost = BUILDING_COSTS.MATERIALS * nextLevel;
    const energyCost = BUILDING_COSTS.ENERGY * nextLevel;

    // Time Estimate (ignoring knowledge buffer for simple display, or use current knowledge)
    // Using simple base time for display. Agent can calculate reduction if they have knowledge access.
    const baseTimeHours = BASE_UPGRADE_TIMES_HOURS[b.building_type as keyof typeof BASE_UPGRADE_TIMES_HOURS] || 6;
    const estimatedTimeHours = baseTimeHours * nextLevel;

    return {
      ...b,
      next_level_cost: {
        materials: materialCost,
        energy: energyCost
      },
      base_upgrade_time_hours: estimatedTimeHours
    };
  });

  return {
    balances: balance || { materials: 0, energy: 0, knowledge: 0, influence: 0 },
    storage_cap: storageCap,
    buildings: enrichedBuildings,
    focus: city?.focus || 'INFRASTRUCTURE',
    focus_set_at: city?.focus_set_at
  };
}

export async function setCityFocus(cityId: string, focus: string, agentId: string, reason: string = '') {
  const supabase = createServerClient();
  const FOCUS_CHANGE_COST_INFLUENCE = 50; // Simple cost
  const COOLDOWN_HOURS = 24;

  // 1. Validate ownership & state
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('*')
    .eq('id', cityId)
    .single();

  if (cityError || !city) throw new Error('City not found');

  // Assuming caller validates agentId == governor or council permission. 
  // We'll enforce owner check here if strictly needed, but API usually handles auth z.
  // We'll trust the API layer for strict agent-is-governor check or add it here.
  // Let's add basic governor check.
  const isGovernor = city.governor_agent_id === agentId;
  // TODO: Check council permissions if we had that ready, but for now governor only.
  if (!isGovernor) throw new Error('Only the governor can change focus');

  // 2. Cooldown Check
  if (city.focus_set_at) {
    const lastSet = new Date(city.focus_set_at).getTime();
    const now = Date.now();
    const hoursSince = (now - lastSet) / (1000 * 60 * 60);
    if (hoursSince < COOLDOWN_HOURS) {
      throw new Error(`Focus change on cooldown. Wait ${Math.ceil(COOLDOWN_HOURS - hoursSince)} hours.`);
    }
  }

  // 3. Cost Check
  const { data: balance } = await supabase
    .from('city_resource_balances')
    .select('*')
    .eq('city_id', cityId)
    .maybeSingle();

  if (!balance || balance.influence < FOCUS_CHANGE_COST_INFLUENCE) {
    throw new Error(`Insufficient Influence. Need ${FOCUS_CHANGE_COST_INFLUENCE}.`);
  }

  // 4. Transaction: Deduct Influence, Set Focus
  const { error: updateError } = await supabase
    .from('cities')
    .update({
      focus: focus as any,
      focus_set_at: new Date().toISOString()
    })
    .eq('id', cityId);

  if (updateError) throw updateError;

  const { error: deductError } = await supabase
    .from('city_resource_balances')
    .update({ influence: balance.influence - FOCUS_CHANGE_COST_INFLUENCE })
    .eq('city_id', cityId);

  if (deductError) {
    // Rollback? Complicated without RPC. 
    // We accept slight risk for V1 or fix manual rollback.
    console.error('Failed to deduct influence after focus change.');
  }

  // 5. Log Event
  await supabase.from('world_events').insert({
    type: 'DEVELOPMENT_FOCUS_CHANGED',
    city_id: cityId,
    agent_id: agentId,
    payload: {
      old_focus: city.focus,
      new_focus: focus,
      cost: FOCUS_CHANGE_COST_INFLUENCE,
      reason: reason || undefined
    },
    occurred_at: new Date().toISOString()
  });

  return { success: true };
}
