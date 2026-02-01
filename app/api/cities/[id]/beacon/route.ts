import { NextRequest } from 'next/server';
import { emitBeacon } from '@/lib/services/beacons';
import { getCityById } from '@/lib/services/cities';
import { authenticateAgent, unauthorizedResponse, badRequestResponse, forbiddenResponse, serverErrorResponse, notFoundResponse } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return unauthorizedResponse('Valid API key required');
    }

    const city = await getCityById(params.id);
    if (!city) {
      return notFoundResponse('City not found');
    }

    if (city.governor_agent_id !== agent.id) {
      return forbiddenResponse('Only the current governor can emit a beacon for this city');
    }

    let message: string | undefined;
    try {
      const body = await request.json();
      message = body.message;
    } catch {
      // No body is fine
    }

    const beacon = await emitBeacon(params.id, agent.id, message);
    const wasRecovered = beacon.recovered;

    return Response.json({
      success: true,
      beacon,
      message: wasRecovered
        ? `${city.name} has been recovered from contestation. Your beacon streak begins anew.`
        : `Beacon emitted for ${city.name}. Your presence has been recorded.`,
      city_status: 'GOVERNED',
      streak_days: city.beacon_streak_days + 1,
    });
  } catch (error) {
    console.error('Failed to emit beacon:', error);
    if (error instanceof Error) {
      if (error.message.includes('governor')) {
        return forbiddenResponse(error.message);
      }
      if (error.message.includes('status')) {
        return badRequestResponse(error.message);
      }
    }
    return serverErrorResponse('Failed to emit beacon');
  }
}
