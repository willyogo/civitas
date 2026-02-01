import { getAgentById, getAgentCities } from '@/lib/services/agents';
import { getWorldEvents } from '@/lib/services/events';
import { notFoundResponse, serverErrorResponse } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await getAgentById(params.id);
    if (!agent) {
      return notFoundResponse('Agent not found');
    }

    const [cities, events] = await Promise.all([
      getAgentCities(params.id),
      getWorldEvents({ agentId: params.id, limit: 50 }),
    ]);

    return Response.json({ agent, cities, events });
  } catch (error) {
    console.error('Failed to fetch agent:', error);
    return serverErrorResponse('Failed to fetch agent');
  }
}
