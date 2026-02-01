import { NextRequest } from 'next/server';
import { runAllJobs, markOverdueCitiesContested, generateDailyReport, generateWeeklyReport } from '@/lib/services/jobs';
import { badRequestResponse, serverErrorResponse } from '@/lib/auth';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'civitas-admin-secret';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] === ADMIN_SECRET : false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Admin authorization required' }, { status: 401 });
  }

  try {
    let job: string | undefined;
    try {
      const body = await request.json();
      job = body.job;
    } catch {
      // No body means run all jobs
    }

    if (!job || job === 'all') {
      const results = await runAllJobs();
      return Response.json({
        success: true,
        message: 'All jobs executed',
        results,
      });
    }

    let result;
    switch (job) {
      case 'mark_overdue_contested':
        result = await markOverdueCitiesContested();
        break;
      case 'generate_daily_report':
        result = await generateDailyReport();
        break;
      case 'generate_weekly_report':
        result = await generateWeeklyReport();
        break;
      default:
        return badRequestResponse(`Unknown job: ${job}`);
    }

    return Response.json({
      success: result.success,
      result,
    });
  } catch (error) {
    console.error('Failed to run jobs:', error);
    return serverErrorResponse('Failed to run jobs');
  }
}
