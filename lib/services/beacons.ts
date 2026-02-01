import { createServerClient } from '@/lib/supabase/client';
import type { Beacon } from '@/lib/types/database';
import { WORLD_CONSTANTS } from '@/lib/constants';

export async function emitBeacon(
  cityId: string,
  agentId: string,
  message?: string
): Promise<Beacon> {
  const supabase = createServerClient();

  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('*')
    .eq('id', cityId)
    .maybeSingle();

  if (cityError) throw cityError;
  if (!city) throw new Error('City not found');

  if (city.governor_agent_id !== agentId) {
    throw new Error('Only the current governor can emit a beacon');
  }

  if (city.status !== 'GOVERNED' && city.status !== 'CONTESTED') {
    throw new Error('Cannot emit beacon for this city status');
  }

  const now = new Date().toISOString();
  const wasContested = city.status === 'CONTESTED';
  const isWithinWindow =
    city.last_beacon_at &&
    Date.now() - new Date(city.last_beacon_at).getTime() < WORLD_CONSTANTS.BEACON_WINDOW_MS;

  const newStreakDays = isWithinWindow ? city.beacon_streak_days + 1 : 1;

  const { data: beacon, error: beaconError } = await supabase
    .from('beacons')
    .insert({
      city_id: cityId,
      agent_id: agentId,
      emitted_at: now,
      message: message || null,
      recovered: wasContested,
    })
    .select()
    .single();

  if (beaconError) throw beaconError;

  const { error: updateError } = await supabase
    .from('cities')
    .update({
      status: 'GOVERNED',
      last_beacon_at: now,
      beacon_streak_days: newStreakDays,
      contested_at: null,
      updated_at: now,
    })
    .eq('id', cityId);

  if (updateError) throw updateError;

  const eventType = wasContested ? 'CITY_RECOVERED' : 'BEACON_EMITTED';
  const { error: eventError } = await supabase.from('world_events').insert({
    type: eventType,
    city_id: cityId,
    agent_id: agentId,
    payload: {
      beacon_id: beacon.id,
      message: message || null,
      recovered: wasContested,
      streak_days: newStreakDays,
    },
    occurred_at: now,
  });

  if (eventError) throw eventError;

  return beacon;
}

export async function getBeaconsByCityId(cityId: string): Promise<Beacon[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('beacons')
    .select('*')
    .eq('city_id', cityId)
    .order('emitted_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBeaconsByAgentId(agentId: string): Promise<Beacon[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('beacons')
    .select('*')
    .eq('agent_id', agentId)
    .order('emitted_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getRecentBeaconsCount(hours: number = 24): Promise<number> {
  const supabase = createServerClient();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('beacons')
    .select('*', { count: 'exact', head: true })
    .gte('emitted_at', since);

  if (error) throw error;
  return count || 0;
}
