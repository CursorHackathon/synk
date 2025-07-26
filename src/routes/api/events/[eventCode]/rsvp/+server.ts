import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Event } from '$src/models/event.model';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const { eventCode } = params;
    const { email, status } = await request.json();
    
    // Validate input
    if (!eventCode || !email || !status) {
      return json(
        { error: 'Event code, email, and status are required' },
        { status: 400 }
      );
    }

    if (!['accepted', 'declined'].includes(status)) {
      return json(
        { error: 'Status must be either "accepted" or "declined"' },
        { status: 400 }
      );
    }

    // Find event by code
    const event = await Event.findOne({ eventCode: eventCode.toUpperCase() });

    if (!event) {
      return json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if email is invited
    const emailLower = email.toLowerCase();
    if (!event.emails.includes(emailLower)) {
      return json(
        { error: 'This email is not on the guest list' },
        { status: 403 }
      );
    }

    // Add or update RSVP
    await event.addRSVP(emailLower, status);

    // Get updated stats
    const rsvpStats = event.getRSVPStats();

    return json({
      message: 'RSVP submitted successfully',
      rsvpStats
    });
  } catch (error) {
    console.error('Error submitting RSVP:', error);
    return json(
      { error: 'Failed to submit RSVP' },
      { status: 500 }
    );
  }
}; 