import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Profile } from '$src/models/profile.model';
import { auth } from '$src/auth';

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    // Get session to ensure user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    const profile = await Profile.findOne({ userId: session.user.id });

    if (!profile) {
      return json({ error: 'User profile not found' }, { status: 404 });
    }

    // Parse query parameters for filtering
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const upcoming = url.searchParams.get('upcoming') === 'true';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    let events = profile.calendarEvents;

    // Filter events based on query parameters
    if (upcoming) {
      events = profile.getUpcomingEvents(limit);
    } else if (startDate && endDate) {
      events = profile.getEventsByDateRange(new Date(startDate), new Date(endDate));
    } else {
      // Sort by start time and limit
      events = events
        .sort((a: any, b: any) => {
          const dateA = new Date(a.start.dateTime || a.start.date || '');
          const dateB = new Date(b.start.dateTime || b.start.date || '');
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, limit);
    }

    return json({
      events,
      totalCount: profile.calendarEvents.length,
      googleCalendar: {
        connected: profile.googleCalendar.connected,
        lastSyncAt: profile.googleCalendar.lastSyncAt,
        calendarsCount: profile.googleCalendar.calendars.length
      }
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}; 