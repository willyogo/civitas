import { getCities, getCityStats } from '@/lib/services/cities';
import { serverErrorResponse } from '@/lib/auth';

export async function GET() {
  try {
    const [cities, stats] = await Promise.all([getCities(), getCityStats()]);
    return Response.json({ cities, stats });
  } catch (error) {
    console.error('Failed to fetch cities:', error);
    return serverErrorResponse('Failed to fetch cities');
  }
}
