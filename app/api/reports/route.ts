import { NextRequest } from 'next/server';
import { getReports, getLatestReport } from '@/lib/services/reports';
import type { ReportPeriod } from '@/lib/types/database';
import { serverErrorResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') as ReportPeriod | null;
    const latest = searchParams.get('latest') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (latest && period) {
      const report = await getLatestReport(period);
      return Response.json({ report });
    }

    const reports = await getReports(period || undefined, limit);
    return Response.json({ reports });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return serverErrorResponse('Failed to fetch reports');
  }
}
