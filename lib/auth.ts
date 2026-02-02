import { NextRequest } from 'next/server';
import { getAgentByApiKey } from '@/lib/services/agents';
import type { Agent } from '@/lib/types/database';

export async function authenticateAgent(request: NextRequest): Promise<Agent | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const apiKey = match[1];
  if (!apiKey.startsWith('zeroone_')) return null;

  try {
    return await getAgentByApiKey(apiKey);
  } catch {
    return null;
  }
}

export function successResponse(data: unknown) {
  return Response.json(data, { status: 200 });
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return Response.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message: string = 'Forbidden') {
  return Response.json({ error: message }, { status: 403 });
}

export function badRequestResponse(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function notFoundResponse(message: string = 'Not found') {
  return Response.json({ error: message }, { status: 404 });
}

export function serverErrorResponse(message: string = 'Internal server error') {
  return Response.json({ error: message }, { status: 500 });
}
