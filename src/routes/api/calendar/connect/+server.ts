import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { googleCalendarService } from '$lib/utils/google-calendar-service';
import { auth } from '$src/auth';

export const GET: RequestHandler = async ({ request, url }) => {
  // Get session to ensure user is authenticated
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session?.user?.id) {
    return json({ error: 'User not authenticated' }, { status: 401 });
  }

  // Generate Google Calendar authorization URL
  const authUrl = googleCalendarService.generateAuthUrl(session.user.id);
  
  // Return redirect to Google's authorization page
  return redirect(302, authUrl);
}; 