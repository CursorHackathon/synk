import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { googleCalendarService } from '$lib/utils/google-calendar-service';
import { Profile } from '$src/models/profile.model';
import { auth } from '$src/auth';

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // This contains the userId
    const error = url.searchParams.get('error');

    if (error) {
      console.error('Google Calendar OAuth error:', error);
      throw redirect(302, '/settings?calendar_error=access_denied');
    }

    if (!code || !state) {
      throw redirect(302, '/settings?calendar_error=invalid_callback');
    }

    const userId = state;

    // Exchange authorization code for tokens
    const tokens = await googleCalendarService.exchangeCodeForTokens(code);

    // Get or create user profile
    let profile = await Profile.findOne({ userId });
    
    if (!profile) {
      // Get user info from better-auth to create profile
      const session = await auth.api.getSession({
        headers: request.headers
      });

      if (!session?.user) {
        throw redirect(302, '/settings?calendar_error=user_not_found');
      }

      // Create new profile
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

    // Connect Google Calendar for the user
    const success = await googleCalendarService.connectGoogleCalendar(
      userId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date,
      tokens.scope
    );

    if (success) {
      throw redirect(302, '/settings?calendar_connected=true');
    } else {
      throw redirect(302, '/settings?calendar_error=connection_failed');
    }
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    
    if (error instanceof Response) {
      throw error; // Re-throw redirect responses
    }
    
    throw redirect(302, '/settings?calendar_error=unknown');
  }
}; 