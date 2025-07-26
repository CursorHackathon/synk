import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Event } from '$src/models/event.model';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { eventCode } = params;
    
    if (!eventCode) {
      return json({ error: 'Event code is required' }, { status: 400 });
    }

    // Find event by code (public access, no auth required)
    const event = await Event.findOne({ eventCode: eventCode.toUpperCase() });

    if (!event) {
      return json({ error: 'Event not found' }, { status: 404 });
    }

    // Return event with RSVP stats but limited information
    const rsvpStats = event.getRSVPStats();
    
    return json({
      event: {
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        maxAttendees: event.maxAttendees,
        emails: event.emails, // Guests need to see all emails to find theirs
        rsvps: event.rsvps, // Include RSVP status
        rsvpStats,
        eventCode: event.eventCode
      }
    });
  } catch (error) {
    console.error('Error fetching public event:', error);
    return json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}; 