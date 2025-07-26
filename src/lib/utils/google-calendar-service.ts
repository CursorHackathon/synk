import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { Profile, type ICalendarEvent, type IGoogleCalendarInfo } from '$src/models/profile.model';

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.APP_URL || 'http://localhost:5173'}/api/calendar/callback`
    );
  }

  /**
   * Generate authorization URL for Google Calendar access
   */
  generateAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId, // Pass userId in state to identify user during callback
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
    scope: string;
  }> {
    const { tokens } = await this.oauth2Client.getAccessToken(code);
    
    if (!tokens.access_token) {
      throw new Error('Failed to obtain access token');
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      scope: tokens.scope || '',
    };
  }

  /**
   * Set credentials for the OAuth2 client
   */
  setCredentials(accessToken: string, refreshToken?: string, expiryDate?: number) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate,
    });
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expiry_date?: number;
  }> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    return {
      access_token: credentials.access_token,
      expiry_date: credentials.expiry_date || undefined,
    };
  }

  /**
   * Get user's calendar list
   */
  async getUserCalendars(): Promise<IGoogleCalendarInfo[]> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const response = await calendar.calendarList.list({
      showHidden: false,
      showDeleted: false,
    });

    const calendars = response.data.items || [];
    
    return calendars.map(cal => ({
      id: cal.id!,
      summary: cal.summary!,
      description: cal.description,
      timeZone: cal.timeZone,
      accessRole: cal.accessRole as any,
      primary: cal.primary || false,
      selected: cal.selected !== false, // Default to true if not specified
      backgroundColor: cal.backgroundColor,
      foregroundColor: cal.foregroundColor,
    }));
  }

  /**
   * Fetch calendar events from Google Calendar
   */
  async fetchCalendarEvents(
    calendarId: string = 'primary',
    maxResults: number = 50,
    timeMin?: Date,
    timeMax?: Date
  ): Promise<ICalendarEvent[]> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const params: any = {
      calendarId,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: false,
    };

    if (timeMin) {
      params.timeMin = timeMin.toISOString();
    } else {
      // Default to current time
      params.timeMin = new Date().toISOString();
    }

    if (timeMax) {
      params.timeMax = timeMax.toISOString();
    }

    const response = await calendar.events.list(params);
    const events = response.data.items || [];
    
    return events.map(event => ({
      id: `${calendarId}-${event.id}`, // Unique ID combining calendar and event ID
      summary: event.summary || 'No Title',
      description: event.description,
      start: {
        dateTime: event.start?.dateTime,
        date: event.start?.date,
        timeZone: event.start?.timeZone,
      },
      end: {
        dateTime: event.end?.dateTime,
        date: event.end?.date,
        timeZone: event.end?.timeZone,
      },
      location: event.location,
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email!,
        displayName: attendee.displayName,
        responseStatus: attendee.responseStatus as any,
      })),
      status: event.status as any,
      visibility: event.visibility as any,
      created: event.created,
      updated: event.updated,
      organizer: event.organizer ? {
        email: event.organizer.email!,
        displayName: event.organizer.displayName,
      } : undefined,
      htmlLink: event.htmlLink,
      googleEventId: event.id!,
      calendarId,
      lastSyncAt: new Date(),
    }));
  }

  /**
   * Sync user's calendar events and save to profile
   */
  async syncUserCalendarEvents(userId: string): Promise<{
    success: boolean;
    eventCount: number;
    calendarsCount: number;
    error?: string;
  }> {
    try {
      const profile = await Profile.findOne({ userId });
      
      if (!profile || !profile.googleCalendar.connected) {
        throw new Error('User profile not found or Google Calendar not connected');
      }

      // Check if tokens need refresh
      const now = new Date();
      if (profile.googleCalendar.tokenExpiresAt && profile.googleCalendar.tokenExpiresAt < now) {
        if (!profile.googleCalendar.refreshToken) {
          throw new Error('Access token expired and no refresh token available');
        }

        // Refresh the token
        const refreshed = await this.refreshAccessToken(profile.googleCalendar.refreshToken);
        profile.googleCalendar.accessToken = refreshed.access_token;
        profile.googleCalendar.tokenExpiresAt = refreshed.expiry_date ? new Date(refreshed.expiry_date) : undefined;
        await profile.save();
      }

      // Set credentials
      this.setCredentials(
        profile.googleCalendar.accessToken!,
        profile.googleCalendar.refreshToken,
        profile.googleCalendar.tokenExpiresAt?.getTime()
      );

      // Get user's calendars
      const calendars = await this.getUserCalendars();
      profile.googleCalendar.calendars = calendars;

      // Fetch events from all selected calendars
      const allEvents: ICalendarEvent[] = [];
      const selectedCalendars = calendars.filter(cal => cal.selected);

      for (const calendar of selectedCalendars) {
        try {
          // Fetch events from the past 30 days to 1 year in the future
          const timeMin = new Date();
          timeMin.setDate(timeMin.getDate() - 30);
          
          const timeMax = new Date();
          timeMax.setFullYear(timeMax.getFullYear() + 1);
          
          const events = await this.fetchCalendarEvents(calendar.id, 100, timeMin, timeMax);
          allEvents.push(...events);
        } catch (error) {
          console.error(`Error fetching events from calendar ${calendar.id}:`, error);
          // Continue with other calendars even if one fails
        }
      }

      // Update profile with new events
      await profile.updateCalendarEvents(allEvents);
      profile.googleCalendar.lastSyncAt = new Date();
      await profile.save();

      return {
        success: true,
        eventCount: allEvents.length,
        calendarsCount: selectedCalendars.length,
      };
    } catch (error) {
      console.error('Error syncing calendar events:', error);
      return {
        success: false,
        eventCount: 0,
        calendarsCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Connect Google Calendar for a user
   */
  async connectGoogleCalendar(
    userId: string,
    accessToken: string,
    refreshToken?: string,
    expiryDate?: number,
    scope?: string
  ): Promise<boolean> {
    try {
      let profile = await Profile.findOne({ userId });
      
      if (!profile) {
        // Get user info from better-auth and create profile
        // This would need to be implemented based on your auth setup
        throw new Error('User profile not found. Please create profile first.');
      }

      // Update profile with Google Calendar connection
      profile.googleCalendar.connected = true;
      profile.googleCalendar.accessToken = accessToken;
      profile.googleCalendar.refreshToken = refreshToken;
      profile.googleCalendar.tokenExpiresAt = expiryDate ? new Date(expiryDate) : undefined;
      profile.googleCalendar.scope = scope;
      profile.googleCalendar.syncEnabled = true;

      await profile.save();

      // Perform initial sync
      await this.syncUserCalendarEvents(userId);

      return true;
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      return false;
    }
  }

  /**
   * Disconnect Google Calendar for a user
   */
  async disconnectGoogleCalendar(userId: string): Promise<boolean> {
    try {
      const profile = await Profile.findOne({ userId });
      
      if (!profile) {
        return false;
      }

      // Clear Google Calendar data
      profile.googleCalendar.connected = false;
      profile.googleCalendar.accessToken = undefined;
      profile.googleCalendar.refreshToken = undefined;
      profile.googleCalendar.tokenExpiresAt = undefined;
      profile.googleCalendar.scope = undefined;
      profile.googleCalendar.calendars = [];
      profile.googleCalendar.lastSyncAt = undefined;
      profile.googleCalendar.syncEnabled = false;

      // Optionally keep calendar events or clear them
      // profile.calendarEvents = [];

      await profile.save();
      return true;
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      return false;
    }
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService(); 