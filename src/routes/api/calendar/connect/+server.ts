import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { googleCalendarService } from '$lib/utils/google-calendar-service';
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

    // Generate Google Calendar authorization URL
    const authUrl = googleCalendarService.generateAuthUrl(session.user.id);
    
    // Redirect user to Google's authorization page
    throw redirect(302, authUrl);
  } catch (error) {
    console.error('Error initiating Google Calendar connection:', error);
    
    if (error instanceof Response) {
      throw error; // Re-throw redirect responses
    }
    
    return json(
      { error: 'Failed to initiate Google Calendar connection' },
      { status: 500 }
    );
  }
}; 