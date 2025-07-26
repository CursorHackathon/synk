import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Profile } from '$src/models/profile.model';
import { auth } from '$src/auth';

export const GET: RequestHandler = async ({ request }) => {
  try {
    // Get session to ensure user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    let profile = await Profile.findOne({ userId: session.user.id });

    // Create profile if it doesn't exist
    if (!profile) {
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

    // Return profile without sensitive data
    const safeProfile = {
      userId: profile.userId,
      email: profile.email,
      name: profile.name,
      image: profile.image,
      googleCalendar: {
        connected: profile.googleCalendar.connected,
        lastSyncAt: profile.googleCalendar.lastSyncAt,
        syncEnabled: profile.googleCalendar.syncEnabled,
        calendars: profile.googleCalendar.calendars
      },
      preferences: profile.preferences,
      upcomingEvents: profile.getUpcomingEvents(5),
      totalEvents: profile.calendarEvents.length,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };

    return json(safeProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    // Get session to ensure user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    const updateData = await request.json();
    const profile = await Profile.findOne({ userId: session.user.id });

    if (!profile) {
      return json({ error: 'User profile not found' }, { status: 404 });
    }

    // Update allowed fields
    if (updateData.preferences) {
      Object.assign(profile.preferences, updateData.preferences);
    }

    if (updateData.googleCalendar?.syncEnabled !== undefined) {
      profile.googleCalendar.syncEnabled = updateData.googleCalendar.syncEnabled;
    }

    await profile.save();

    return json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}; 