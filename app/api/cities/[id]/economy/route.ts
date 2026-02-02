
import { NextRequest } from 'next/server';
import { getCityEconomy } from '@/lib/services/cities';
import { notFoundResponse, serverErrorResponse, successResponse } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const economy = await getCityEconomy(params.id);
        if (!economy) return notFoundResponse('City not found');
        return successResponse(economy);
    } catch (error) {
        console.error('Failed to fetch economy:', error);
        return serverErrorResponse(`Failed to fetch city economy: ${error instanceof Error ? error.message : String(error)}`);
    }
}
