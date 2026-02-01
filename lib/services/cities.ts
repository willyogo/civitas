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
