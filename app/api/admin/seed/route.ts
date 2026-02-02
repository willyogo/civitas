import { NextRequest } from 'next/server';
import { seedDatabase, clearDatabase } from '@/lib/services/seed';
import { badRequestResponse, serverErrorResponse } from '@/lib/auth';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'civitas-admin-secret';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] === ADMIN_SECRET : false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Admin authorization required' }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get('force') === 'true';

  try {
    if (force) {
      await clearDatabase();
    }

    const result = await seedDatabase();
    return Response.json({
      success: true,
      message: 'Database seeded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Failed to seed database:', error);
    if (error instanceof Error && error.message.includes('already seeded')) {
      return badRequestResponse(error.message);
    }
    return serverErrorResponse('Failed to seed database');
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Admin authorization required' }, { status: 401 });
  }

  try {
    await clearDatabase();
    return Response.json({
      success: true,
      message: 'Database cleared successfully',
    });
  } catch (error) {
    console.error('Failed to clear database:', error);
    return serverErrorResponse('Failed to clear database');
  }
}
