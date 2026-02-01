import { createServerClient } from '@/lib/supabase/client';
import type { WorldEvent, WorldEventWithRelations, WorldEventType } from '@/lib/types/database';

export interface EventFilters {
  cityId?: string;
  agentId?: string;
  type?: WorldEventType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export async function getWorldEvents(
  filters: EventFilters = {}
): Promise<WorldEventWithRelations[]> {
  const supabase = createServerClient();
  let query = supabase
    .from('world_events')
    .select(`
      *,
      city:cities(id, name),
      agent:agents(id, display_name)
    `)
    .order('occurred_at', { ascending: false });

  if (filters.cityId) {
    query = query.eq('city_id', filters.cityId);
  }
  if (filters.agentId) {
    query = query.eq('agent_id', filters.agentId);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.startDate) {
    query = query.gte('occurred_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('occurred_at', filters.endDate);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map((event) => ({
    ...event,
    city: event.city as WorldEventWithRelations['city'],
    agent: event.agent as WorldEventWithRelations['agent'],
  }));
}

export async function getEventsByPeriod(
  startDate: string,
  endDate: string
): Promise<WorldEvent[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('world_events')
    .select('*')
    .gte('occurred_at', startDate)
    .lte('occurred_at', endDate)
    .order('occurred_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getEventCountByType(
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('world_events')
    .select('type')
    .gte('occurred_at', startDate)
    .lte('occurred_at', endDate);

  if (error) throw error;

  const counts: Record<string, number> = {};
  data?.forEach((event) => {
    counts[event.type] = (counts[event.type] || 0) + 1;
  });
  return counts;
}

export async function appendEvent(
  type: WorldEventType,
  payload: Record<string, unknown>,
  cityId?: string,
  agentId?: string
): Promise<WorldEvent> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('world_events')
    .insert({
      type,
      city_id: cityId || null,
      agent_id: agentId || null,
      payload,
      occurred_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
