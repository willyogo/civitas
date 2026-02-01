import { getCityById } from '@/lib/services/cities';
import { getBeaconsByCityId } from '@/lib/services/beacons';
import { getWorldEvents } from '@/lib/services/events';
import { notFoundResponse, serverErrorResponse } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const city = await getCityById(params.id);
    if (!city) {
      return notFoundResponse('City not found');
    }

    const [beacons, events] = await Promise.all([
      getBeaconsByCityId(params.id),
      getWorldEvents({ cityId: params.id, limit: 50 }),
    ]);

    return Response.json({ city, beacons, events });
  } catch (error) {
    console.error('Failed to fetch city:', error);
    return serverErrorResponse('Failed to fetch city');
  }
}
