import { NextRequest } from 'next/server';
import { getAgentCities } from '@/lib/services/agents';
import { getWorldEvents } from '@/lib/services/events';
import { getOpenCities } from '@/lib/services/cities';
import { authenticateAgent, unauthorizedResponse, serverErrorResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return unauthorizedResponse('Valid API key required');
    }

    const [cities, events, openCities] = await Promise.all([
      getAgentCities(agent.id),
      getWorldEvents({ agentId: agent.id, limit: 20 }),
      getOpenCities(),
    ]);

    return Response.json({
      agent: {
        id: agent.id,
        display_name: agent.display_name,
        identity_token_id: agent.identity_token_id,
        wallet_address: agent.wallet_address,
        created_at: agent.created_at,
      },
      governed_cities: cities,
      recent_events: events,
      open_cities: openCities,
    });
  } catch (error) {
    console.error('Failed to fetch agent data:', error);
    return serverErrorResponse('Failed to fetch agent data');
  }
}
