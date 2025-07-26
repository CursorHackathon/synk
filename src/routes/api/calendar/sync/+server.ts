import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { googleCalendarService } from '$lib/utils/google-calendar-service';
import { auth } from '$src/auth';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get session to ensure user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Sync calendar events for the user
    const result = await googleCalendarService.syncUserCalendarEvents(session.user.id);

    if (result.success) {
      return json({
        message: 'Calendar sync completed successfully',
        eventCount: result.eventCount,
        calendarsCount: result.calendarsCount,
        lastSyncAt: new Date().toISOString()
      });
    } else {
      return json(
        { 
          error: 'Calendar sync failed',
          details: result.error
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error syncing calendar:', error);
    return json(
      { error: 'Failed to sync calendar events' },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async ({ request }) => {
  // Same logic as POST for convenience
  return POST({ request } as any);
}; 