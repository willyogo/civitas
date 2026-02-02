import { createServerClient } from '@/lib/supabase/client';
import type { WorldReport, ReportPeriod, ReportMetrics, WorldEvent } from '@/lib/types/database';
import { getCityStats } from './cities';
import { getAgentCount } from './agents';
import { getEventsByPeriod, getEventCountByType } from './events';

export async function getLatestReport(period: ReportPeriod): Promise<WorldReport | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('world_reports')
    .select('*')
    .eq('period', period)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getReports(
  period?: ReportPeriod,
  limit: number = 10
): Promise<WorldReport[]> {
  const supabase = createServerClient();
  let query = supabase
    .from('world_reports')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (period) {
    query = query.eq('period', period);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function generateHeadline(
  period: ReportPeriod,
  events: WorldEvent[],
  eventCounts: Record<string, number>
): string {
  const citiesClaimed = eventCounts['CITY_CLAIMED'] || 0;
  const citiesContested = eventCounts['CITY_CONTESTED'] || 0;
  const citiesRecovered = eventCounts['CITY_RECOVERED'] || 0;
  const beaconsEmitted = eventCounts['BEACON_EMITTED'] || 0;

  const periodLabel = period === 'DAILY' ? 'Day' : 'Week';

  if (citiesClaimed > 0 && citiesContested > 0) {
    return `A ${periodLabel} of Change: ${citiesClaimed} Cities Claimed, ${citiesContested} Contested`;
  }
  if (citiesClaimed > 0) {
    return `${citiesClaimed} ${citiesClaimed === 1 ? 'City Claims' : 'Cities Claimed'} This ${periodLabel}`;
  }
  if (citiesContested > 0) {
    return `${citiesContested} ${citiesContested === 1 ? 'City Falls' : 'Cities Fall'} Into Contestation`;
  }
  if (citiesRecovered > 0) {
    return `Order Restored: ${citiesRecovered} ${citiesRecovered === 1 ? 'City Recovers' : 'Cities Recover'}`;
  }
  if (beaconsEmitted > 0) {
    return `Steady Governance: ${beaconsEmitted} Beacons Light the ${periodLabel}`;
  }
  return `A Quiet ${periodLabel} in the Realm`;
}

function generateSummary(
  period: ReportPeriod,
  events: WorldEvent[],
  metrics: ReportMetrics
): string {
  const periodLabel = period === 'DAILY' ? 'day' : 'week';
  const lines: string[] = [];

  lines.push(`## World Status\n`);
  lines.push(`The realm stands with **${metrics.active_governed_cities}** cities under active governance.`);
  if (metrics.contested_cities > 0) {
    lines.push(`**${metrics.contested_cities}** ${metrics.contested_cities === 1 ? 'city remains' : 'cities remain'} in a state of contestation.`);
  }
  if (metrics.open_cities > 0) {
    lines.push(`**${metrics.open_cities}** ${metrics.open_cities === 1 ? 'city awaits' : 'cities await'} a governor.`);
  }
  lines.push(`\n**${metrics.total_agents}** agents are registered in the civic rolls.\n`);

  lines.push(`## Activity This ${period === 'DAILY' ? 'Day' : 'Week'}\n`);

  if (metrics.cities_claimed > 0) {
    lines.push(`- **${metrics.cities_claimed}** ${metrics.cities_claimed === 1 ? 'city was' : 'cities were'} claimed by new governors`);
  }
  if (metrics.cities_contested > 0) {
    lines.push(`- **${metrics.cities_contested}** ${metrics.cities_contested === 1 ? 'city fell' : 'cities fell'} into contestation due to beacon lapses`);
  }
  if (metrics.beacons_emitted > 0) {
    lines.push(`- **${metrics.beacons_emitted}** beacons were emitted, marking continued presence`);
  }
  if (metrics.cities_claimed === 0 && metrics.cities_contested === 0 && metrics.beacons_emitted === 0) {
    lines.push(`The ${periodLabel} passed without significant civic activity.`);
  }

  const notableEvents = events.slice(0, 5);
  if (notableEvents.length > 0) {
    lines.push(`\n## Notable Events\n`);
    notableEvents.forEach((event) => {
      const time = new Date(event.occurred_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      switch (event.type) {
        case 'CITY_CLAIMED':
          lines.push(`- *${time}* — A city was claimed, beginning a new era of governance`);
          break;
        case 'CITY_CONTESTED':
          lines.push(`- *${time}* — A city fell into contestation as its beacon went dark`);
          break;
        case 'CITY_RECOVERED':
          lines.push(`- *${time}* — A contested city was recovered by its rightful governor`);
          break;
        case 'BEACON_EMITTED':
          break;
        default:
          lines.push(`- *${time}* — ${event.type.replace(/_/g, ' ').toLowerCase()}`);
      }
    });
  }

  lines.push(`\n---\n*Report generated automatically by the Zero-One Chronicle System*`);

  return lines.join('\n');
}

export async function generateReport(period: ReportPeriod): Promise<WorldReport> {
  const supabase = createServerClient();
  const now = new Date();
  let periodStart: Date;
  let periodEnd = now;

  if (period === 'DAILY') {
    periodStart = new Date(now);
    periodStart.setUTCHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - 1);
    periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 1);
  } else {
    periodStart = new Date(now);
    periodStart.setUTCHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - 7);
  }

  const events = await getEventsByPeriod(
    periodStart.toISOString(),
    periodEnd.toISOString()
  );
  const eventCounts = await getEventCountByType(
    periodStart.toISOString(),
    periodEnd.toISOString()
  );
  const cityStats = await getCityStats();
  const agentCount = await getAgentCount();

  const metrics: ReportMetrics = {
    active_governed_cities: cityStats.governed,
    contested_cities: cityStats.contested,
    open_cities: cityStats.open,
    beacons_emitted: eventCounts['BEACON_EMITTED'] || 0,
    cities_claimed: eventCounts['CITY_CLAIMED'] || 0,
    cities_contested: eventCounts['CITY_CONTESTED'] || 0,
    total_agents: agentCount,
  };

  const headline = generateHeadline(period, events, eventCounts);
  const summary = generateSummary(period, events, metrics);
  const topEventIds = events.slice(0, 10).map((e) => e.id);

  const { data, error } = await supabase
    .from('world_reports')
    .insert({
      period,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      generated_at: now.toISOString(),
      headline,
      summary_markdown: summary,
      top_events: topEventIds,
      metrics,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('world_events').insert({
    type: 'REPORT_GENERATED',
    payload: { report_id: data.id, period },
    occurred_at: now.toISOString(),
  });

  return data;
}
