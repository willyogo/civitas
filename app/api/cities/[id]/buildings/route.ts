
import { NextRequest } from 'next/server';
import { getCityBuildings } from '@/lib/services/building.service';
import { serverErrorResponse, successResponse } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const buildings = await getCityBuildings(params.id);
        return successResponse(buildings);
    } catch (error) {
        console.error('Failed to fetch buildings:', error);
        return serverErrorResponse('Failed to fetch city buildings');
    }
}
