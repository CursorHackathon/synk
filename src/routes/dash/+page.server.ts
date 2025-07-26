import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { auth } from '$src/auth';
import { Profile } from '$src/models/profile.model';

export const load: PageServerLoad = async ({ request , locals }) => {
  console.log(locals);
  // Check if user is authenticated
  const session = locals.session;

  if (!session?.user) {
    throw redirect(302, '/login');
  }

  try {
    // Get user profile with calendar data
    let profile = await Profile.findOne({ userId: session.user.id });

    if (!profile) {
      // Create profile if it doesn't exist (fallback)
      profile = new Profile({
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        googleCalendar: {
          connected: false,
          syncEnabled: true,
          calendars: []
        },
        calendarEvents: [],
        preferences: {
          timezone: 'UTC',
          syncFrequency: 'daily',
          defaultCalendarVisibility: 'private',
          autoCreateEvents: false
        }
      });
      await profile.save();
    }

    // Get upcoming events
    const upcomingEvents = profile.getUpcomingEvents(10);
    
    // Get today's events
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const todayEvents = profile.getEventsByDateRange(today, tomorrow);

    return {
      user: session.user,
      profile: {
        googleCalendar: {
          connected: profile.googleCalendar.connected,
          lastSyncAt: profile.googleCalendar.lastSyncAt,
          calendarsCount: profile.googleCalendar.calendars.length
        },
        totalEvents: profile.calendarEvents.length,
        upcomingEvents,
        todayEvents
      }
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return {
      user: session.user,
      profile: {
        googleCalendar: {
          connected: false,
          lastSyncAt: null,
          calendarsCount: 0
        },
        totalEvents: 0,
        upcomingEvents: [],
        todayEvents: []
      }
    };
  }
}; 