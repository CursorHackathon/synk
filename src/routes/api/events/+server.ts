import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Event } from '../../../models/event.model';
import { connectDB } from '../../../db';

// POST /api/events - Create a new event
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = await locals.user;
    if (!user?.id) {
      return json({ error: 'Unauthorized: You must be logged in to create events' }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    const { title, description, date, location, emails, maxAttendees, hasVoting, voteOptions } = body;

    // Validate required fields
    if (!title || !date || !emails || !Array.isArray(emails) || emails.length === 0) {
      return json(
        { error: 'Title, date, and at least one email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return json(
        { error: 'Invalid email addresses found', invalidEmails },
        { status: 400 }
      );
    }

    // Remove duplicate emails
    const uniqueEmails = [...new Set(emails.map((email: string) => email.toLowerCase()))];

    // Generate unique event code
    let eventCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      eventCode = generateEventCode();
      const existingEvent = await Event.findOne({ eventCode });
      if (!existingEvent) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return json(
        { error: 'Unable to generate unique event code. Please try again.' },
        { status: 500 }
      );
    }

    // Create new event
    const newEvent = new Event({
      title,
      description,
      date: new Date(date),
      location,
      emails: uniqueEmails,
      eventCode: eventCode!,
      createdBy: user.id,
      maxAttendees,
      hasVoting: hasVoting || false,
      voteOptions: voteOptions || []
    });

    const savedEvent = await newEvent.save();

    return json({
      success: true,
      event: {
        id: savedEvent._id,
        title: savedEvent.title,
        description: savedEvent.description,
        date: savedEvent.date,
        location: savedEvent.location,
        eventCode: savedEvent.eventCode,
        emailCount: savedEvent.emails.length,
        maxAttendees: savedEvent.maxAttendees,
        createdAt: savedEvent.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// GET /api/events - Get events for a user
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    await connectDB();
    
    const searchParams = url.searchParams;
    const eventCode = searchParams.get('eventCode');
    
    // For public event lookup by code, no auth required
    // For user's events, auth is required

    if (eventCode) {
      // Find specific event by code
      const event = await Event.findOne({ eventCode: eventCode.toUpperCase() });
      if (!event) {
        return json({ error: 'Event not found' }, { status: 404 });
      }
      
      // Check if the user is the event creator
      const user = await locals.user;
      const isCreator = user?.id && event.createdBy === user.id;
      
      const votingStats = event.hasVoting ? event.getVotingStats() : null;
      
      return json({
        success: true,
        event: {
          id: event._id,
          title: event.title,
          description: event.description,
          date: event.date,
          location: event.location,
          eventCode: event.eventCode,
          emailCount: event.emails.length,
          maxAttendees: event.maxAttendees,
          rsvpStats: event.getRSVPStats(),
          createdAt: event.createdAt,
          hasVoting: event.hasVoting,
          voteOptions: isCreator ? event.voteOptions : undefined,
          votingStats: isCreator ? votingStats : undefined,
          // Include emails and rsvps if user is the creator
          emails: isCreator ? event.emails : undefined,
          rsvps: isCreator ? event.rsvps : undefined
        }
      });
    }

    // If no event code provided, return user's events (auth required)
    const user = await locals.user;
    if (!user?.id) {
      return json({ error: 'Unauthorized: You must be logged in to view your events' }, { status: 401 });
    }

    // Find events created by user
    const events = await Event.find({ createdBy: user.id })
      .sort({ createdAt: -1 })
      .select('-emails -rsvps'); // Don't return sensitive data

    return json({
      success: true,
      events: events.map(event => ({
        id: event._id,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        eventCode: event.eventCode,
        emailCount: event.emails.length,
        maxAttendees: event.maxAttendees,
        createdAt: event.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

function generateEventCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
} 