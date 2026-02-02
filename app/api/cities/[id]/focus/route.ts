
import { NextRequest } from 'next/server'; // Correct import for NextRequest
import { setCityFocus } from '@/lib/services/cities';
import { badRequestResponse, serverErrorResponse, successResponse, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/client';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { focus, reason = '' } = body;

        if (!['INFRASTRUCTURE', 'EDUCATION', 'CULTURE', 'DEFENSE'].includes(focus)) {
            return badRequestResponse('Invalid focus type');
        }

        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Use a service method to get agent by user id, or assume we pass agent_id if using API keys.
        // Assuming cookie auth for now based on 'createServerClient', but if using API keys we'd extract from header.
        // Let's support both or assume standard `auth.getUser()` works for now. 
        // Wait, the project uses `agents` table and API keys for agents.
        // We should check `lib/auth.ts` to see how to get the authenticated agent.
        // For now I'll use a placeholder for auth check. 
        // Actually, let's verify auth approach.

        // Simple mock auth for MVP if real auth is complex:
        // We check headers for 'x-agent-id' or bearer token?
        // Project usually uses `api_key` in header? 
        // Let's assume standard auth middleware puts user in session or we check API key.

        // REVISIT: For now assuming createServerClient().auth.getUser() returns the user, 
        // and we need to map user to agent? Or does user == agent?
        // "Agents have api_key".

        // Let's try to get agent from API key header for now.
        const authHeader = request.headers.get('authorization');
        if (!authHeader) return unauthorizedResponse('Missing Authorization header');

        const apiKey = authHeader.replace('Bearer ', '');
        // Hash key and find agent -> this logic is duplicated. Should be in auth utils.
        // Let's do it inline for robustness or check if `getAuthenticatedAgent` exists.

        // Temporary: We will Query agent by api_key directly (insecure if not hashed?)
        // "api_key text UNIQUE NOT NULL". Stored plain? 
        // Migration said: "api_key text UNIQUE NOT NULL, api_key_hash text NOT NULL".
        // Code in `seed.ts` hashes it. So we must hash it to look it up.
        // But `jobs/route.ts` checked `request.headers.get('authorization')`.

        // Let's use `crypto` to hash and look up.
        // Or just import helper.
        // I'll skip complex auth implementation details here and assume we can find the agent.
        // ... Actually, I'll just write a basic lookup query for now.

        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

        const { data: agent } = await supabase.from('agents').select('id').eq('api_key_hash', hash).single();
        if (!agent) return unauthorizedResponse('Invalid API Key');

        await setCityFocus(params.id, focus, agent.id, reason);
        return successResponse({ success: true, focus });
    } catch (error: any) { // Type as any for error message access
        console.error('Failed to set focus:', error);
        return serverErrorResponse(error.message || 'Failed to set city focus');
    }
}
