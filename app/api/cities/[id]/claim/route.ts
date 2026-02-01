import { NextRequest } from 'next/server';
import { claimCity } from '@/lib/services/cities';
import { authenticateAgent, unauthorizedResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return unauthorizedResponse('Valid API key required');
    }

    const city = await claimCity(params.id, agent.id);
    return Response.json({
      success: true,
      city,
      message: `You have claimed ${city.name}. Emit your first beacon within 24 hours to begin governance.`,
    });
  } catch (error) {
    console.error('Failed to claim city:', error);
    if (error instanceof Error) {
      if (error.message.includes('not open')) {
        return badRequestResponse('This city is not open for claiming');
      }
      if (error.message.includes('identity')) {
        return badRequestResponse('You must have a valid ERC-8004 identity to claim a city');
      }
      if (error.message.includes('not found')) {
        return badRequestResponse('City not found');
      }
    }
    return serverErrorResponse('Failed to claim city');
  }
}
