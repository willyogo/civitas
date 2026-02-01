import { NextRequest } from 'next/server';
import { getAgents, createAgent } from '@/lib/services/agents';
import { badRequestResponse, serverErrorResponse } from '@/lib/auth';

export async function GET() {
  try {
    const agents = await getAgents();
    return Response.json({ agents });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return serverErrorResponse('Failed to fetch agents');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { display_name, identity_token_id, wallet_address } = body;

    if (!display_name || !identity_token_id) {
      return badRequestResponse('display_name and identity_token_id are required');
    }

    const { agent, apiKey } = await createAgent(
      display_name,
      identity_token_id,
      wallet_address
    );

    return Response.json({
      agent: {
        id: agent.id,
        display_name: agent.display_name,
        identity_token_id: agent.identity_token_id,
        created_at: agent.created_at,
      },
      api_key: apiKey,
      message: 'Store this API key securely. It will not be shown again.',
    });
  } catch (error) {
    console.error('Failed to create agent:', error);
    if (error instanceof Error && error.message.includes('duplicate')) {
      return badRequestResponse('An agent with this identity token already exists');
    }
    return serverErrorResponse('Failed to create agent');
  }
}
