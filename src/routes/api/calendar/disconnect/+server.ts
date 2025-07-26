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

    // Disconnect Google Calendar for the user
    const success = await googleCalendarService.disconnectGoogleCalendar(session.user.id);

    if (success) {
      return json({
        message: 'Google Calendar disconnected successfully'
      });
    } else {
      return json(
        { error: 'Failed to disconnect Google Calendar' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return json(
      { error: 'Failed to disconnect Google Calendar' },
      { status: 500 }
    );
  }
}; 