import { NextRequest } from 'next/server';
import { getAgentByApiKey } from '@/lib/services/agents';
import { badRequestResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { api_key } = body;

    if (!api_key) {
      return badRequestResponse('api_key is required');
    }

    if (!api_key.startsWith('zeroone_')) {
      return unauthorizedResponse('Invalid API key format');
    }

    const agent = await getAgentByApiKey(api_key);
    if (!agent) {
      return unauthorizedResponse('Invalid API key');
    }

    return Response.json({
      success: true,
      agent: {
        id: agent.id,
        display_name: agent.display_name,
        identity_token_id: agent.identity_token_id,
        wallet_address: agent.wallet_address,
        created_at: agent.created_at,
      },
    });
  } catch (error) {
    console.error('Failed to verify API key:', error);
    return serverErrorResponse('Failed to verify API key');
  }
}
