
import { NextRequest } from 'next/server';
import { upgradeBuilding } from '@/lib/services/building.service';
import { badRequestResponse, serverErrorResponse, successResponse, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/client';
import crypto from 'crypto';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; type: string } }
) {
    try {
        const buildingType = params.type.toUpperCase();
        if (!['FOUNDRY', 'GRID', 'ACADEMY', 'FORUM'].includes(buildingType)) {
            return badRequestResponse('Invalid building type');
        }

        const supabase = createServerClient();

        // Auth Check (Duplicated from Focus route - should refactor later)
        const authHeader = request.headers.get('authorization');
        if (!authHeader) return unauthorizedResponse('Missing Authorization header');
        const apiKey = authHeader.replace('Bearer ', '');
        const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
        const { data: agent } = await supabase.from('agents').select('id').eq('api_key_hash', hash).single();
        if (!agent) return unauthorizedResponse('Invalid API Key');

        // Parse Reason (optional)
        let reason = '';
        try {
            const body = await request.json();
            reason = body.reason || '';
        } catch {
            // Body might be empty, ignore
        }

        const result = await upgradeBuilding(params.id, buildingType, agent.id, reason);
        return successResponse(result);

    } catch (error: any) {
        console.error('Failed to start upgrade:', error);
        return serverErrorResponse(error.message || 'Failed to start building upgrade');
    }
}
