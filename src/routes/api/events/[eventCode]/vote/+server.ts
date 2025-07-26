import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Event } from '$src/models/event.model';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const { eventCode } = params;
    const { email, votes } = await request.json();
    
    // Validate input
    if (!eventCode || !email || !votes || !Array.isArray(votes)) {
      return json(
        { error: 'Event code, email, and votes are required' },
        { status: 400 }
      );
    }

    // Find event by code
    const event = await Event.findOne({ eventCode: eventCode.toUpperCase() });

    if (!event) {
      return json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if voting is enabled
    if (!event.hasVoting) {
      return json(
        { error: 'Voting is not enabled for this event' },
        { status: 403 }
      );
    }

    // Check if email is invited
    const emailLower = email.toLowerCase();
    if (!event.emails.includes(emailLower)) {
      return json(
        { error: 'This email is not on the guest list' },
        { status: 403 }
      );
    }

    // Validate votes match event options
    const validOptionIds = event.voteOptions.map((opt: any) => opt.id);
    const invalidVotes = votes.filter(v => !validOptionIds.includes(v.optionId));
    
    if (invalidVotes.length > 0) {
      return json(
        { error: 'Invalid vote options provided' },
        { status: 400 }
      );
    }

    // Add or update votes
    await event.addVotes(emailLower, votes);

    // Get updated voting stats
    const votingStats = event.getVotingStats();

    return json({
      message: 'Votes submitted successfully',
      votingStats
    });
  } catch (error) {
    console.error('Error submitting votes:', error);
    return json(
      { error: 'Failed to submit votes' },
      { status: 500 }
    );
  }
}; 