import { createServerClient } from '@/lib/supabase/client';
import { WORLD_CONSTANTS } from '@/lib/constants';
import { generateReport } from './reports';

export interface JobResult {
  job: string;
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export async function markOverdueCitiesContested(): Promise<JobResult> {
  const supabase = createServerClient();
  const cutoff = new Date(Date.now() - WORLD_CONSTANTS.BEACON_WINDOW_MS).toISOString();

  const { data: overdueCities, error: fetchError } = await supabase
    .from('cities')
    .select('*')
    .eq('status', 'GOVERNED')
    .lt('last_beacon_at', cutoff);

  if (fetchError) {
    return {
      job: 'mark_overdue_contested',
      success: false,
      message: `Failed to fetch overdue cities: ${fetchError.message}`,
    };
  }

  if (!overdueCities || overdueCities.length === 0) {
    return {
      job: 'mark_overdue_contested',
      success: true,
      message: 'No overdue cities found',
      details: { citiesProcessed: 0 },
    };
  }

  const now = new Date().toISOString();
  let processedCount = 0;

  for (const city of overdueCities) {
    const { error: updateError } = await supabase
      .from('cities')
      .update({
        status: 'CONTESTED',
        contested_at: now,
        beacon_streak_days: 0,
        updated_at: now,
      })
      .eq('id', city.id);

    if (updateError) continue;

    await supabase.from('world_events').insert({
      type: 'CITY_CONTESTED',
      city_id: city.id,
      agent_id: city.governor_agent_id,
      payload: {
        city_name: city.name,
        last_beacon_at: city.last_beacon_at,
        previous_streak: city.beacon_streak_days,
      },
      occurred_at: now,
    });

    processedCount++;
  }

  return {
    job: 'mark_overdue_contested',
    success: true,
    message: `Marked ${processedCount} cities as contested`,
    details: { citiesProcessed: processedCount, cityIds: overdueCities.map((c) => c.id) },
  };
}

export async function generateDailyReport(): Promise<JobResult> {
  try {
    const report = await generateReport('DAILY');
    return {
      job: 'generate_daily_report',
      success: true,
      message: 'Daily report generated successfully',
      details: { reportId: report.id, headline: report.headline },
    };
  } catch (error) {
    return {
      job: 'generate_daily_report',
      success: false,
      message: `Failed to generate daily report: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function generateWeeklyReport(): Promise<JobResult> {
  try {
    const report = await generateReport('WEEKLY');
    return {
      job: 'generate_weekly_report',
      success: true,
      message: 'Weekly report generated successfully',
      details: { reportId: report.id, headline: report.headline },
    };
  } catch (error) {
    return {
      job: 'generate_weekly_report',
      success: false,
      message: `Failed to generate weekly report: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function runAllJobs(): Promise<JobResult[]> {
  const results: JobResult[] = [];

  results.push(await markOverdueCitiesContested());

  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay();

  if (hour === 0) {
    results.push(await generateDailyReport());
  }

  if (hour === 0 && dayOfWeek === 1) {
    results.push(await generateWeeklyReport());
  }

  return results;
}
