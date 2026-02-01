import { NextRequest } from 'next/server';
import { getWorldEvents } from '@/lib/services/events';
import type { WorldEventType } from '@/lib/types/database';
import { serverErrorResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cityId = searchParams.get('cityId') || undefined;
    const agentId = searchParams.get('agentId') || undefined;
    const type = searchParams.get('type') as WorldEventType | undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const events = await getWorldEvents({
      cityId,
      agentId,
      type,
      startDate,
      endDate,
      limit,
      offset,
    });

    return Response.json({ events, limit, offset });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return serverErrorResponse('Failed to fetch world events');
  }
}
