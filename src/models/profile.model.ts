import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  created?: string;
  updated?: string;
  organizer?: {
    email: string;
    displayName?: string;
  };
  htmlLink?: string;
  googleEventId: string; // Original Google Calendar event ID
  calendarId: string; // Which calendar this event belongs to
  lastSyncAt: Date;
}

export interface IGoogleCalendarInfo {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  accessRole?: 'owner' | 'reader' | 'writer' | 'freeBusyReader';
  primary?: boolean;
  selected?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

export interface IProfile extends Document {
  userId: string; // Reference to better-auth user ID
  email: string;
  name?: string;
  image?: string;
  
  // Google Calendar integration
  googleCalendar: {
    connected: boolean;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
    scope?: string;
    calendars: IGoogleCalendarInfo[];
    lastSyncAt?: Date;
    syncEnabled: boolean;
  };
  
  // Calendar events from Google Calendar
  calendarEvents: ICalendarEvent[];
  
  // User preferences
  preferences: {
    timezone?: string;
    syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'manual';
    defaultCalendarVisibility?: 'private' | 'public';
    autoCreateEvents?: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema = new Schema({
  id: { type: String, required: true },
  summary: { type: String, required: true },
  description: { type: String },
  start: {
    dateTime: { type: String },
    date: { type: String },
    timeZone: { type: String }
  },
  end: {
    dateTime: { type: String },
    date: { type: String },
    timeZone: { type: String }
  },
  location: { type: String },
  attendees: [{
    email: { type: String, required: true },
    displayName: { type: String },
    responseStatus: { 
      type: String, 
      enum: ['needsAction', 'declined', 'tentative', 'accepted'] 
    }
  }],
  status: { 
    type: String, 
    enum: ['confirmed', 'tentative', 'cancelled'],
    default: 'confirmed' 
  },
  visibility: { 
    type: String, 
    enum: ['default', 'public', 'private', 'confidential'],
    default: 'default' 
  },
  created: { type: String },
  updated: { type: String },
  organizer: {
    email: { type: String },
    displayName: { type: String }
  },
  htmlLink: { type: String },
  googleEventId: { type: String, required: true },
  calendarId: { type: String, required: true },
  lastSyncAt: { type: Date, default: Date.now }
}, { _id: false });

const GoogleCalendarInfoSchema = new Schema({
  id: { type: String, required: true },
  summary: { type: String, required: true },
  description: { type: String },
  timeZone: { type: String },
  accessRole: { 
    type: String, 
    enum: ['owner', 'reader', 'writer', 'freeBusyReader'] 
  },
  primary: { type: Boolean, default: false },
  selected: { type: Boolean, default: true },
  backgroundColor: { type: String },
  foregroundColor: { type: String }
}, { _id: false });

const ProfileSchema: Schema = new Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  image: {
    type: String,
    trim: true
  },
  
  googleCalendar: {
    connected: { type: Boolean, default: false },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date },
    scope: { type: String },
    calendars: [GoogleCalendarInfoSchema],
    lastSyncAt: { type: Date },
    syncEnabled: { type: Boolean, default: true }
  },
  
  calendarEvents: [CalendarEventSchema],
  
  preferences: {
    timezone: { type: String, default: 'UTC' },
    syncFrequency: { 
      type: String, 
      enum: ['realtime', 'hourly', 'daily', 'manual'],
      default: 'daily' 
    },
    defaultCalendarVisibility: { 
      type: String, 
      enum: ['private', 'public'],
      default: 'private' 
    },
    autoCreateEvents: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes for better performance
ProfileSchema.index({ userId: 1 });
ProfileSchema.index({ email: 1 });
ProfileSchema.index({ 'googleCalendar.connected': 1 });
ProfileSchema.index({ 'calendarEvents.googleEventId': 1 });
ProfileSchema.index({ 'calendarEvents.start.dateTime': 1 });
ProfileSchema.index({ 'calendarEvents.calendarId': 1 });

// Static method to find by user ID
ProfileSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

// Static method to find profiles with Google Calendar connected
ProfileSchema.statics.findWithGoogleCalendar = function() {
  return this.find({ 'googleCalendar.connected': true });
};

// Instance method to add or update calendar events
ProfileSchema.methods.updateCalendarEvents = function(events: ICalendarEvent[]) {
  // Remove old events for the same calendar
  const calendarIds = [...new Set(events.map(e => e.calendarId))];
  this.calendarEvents = this.calendarEvents.filter(
    (event: ICalendarEvent) => !calendarIds.includes(event.calendarId)
  );
  
  // Add new events
  this.calendarEvents.push(...events);
  
  return this.save();
};

// Instance method to get upcoming events
ProfileSchema.methods.getUpcomingEvents = function(limit: number = 10) {
  const now = new Date();
  return this.calendarEvents
    .filter((event: ICalendarEvent) => {
      const eventDate = new Date(event.start.dateTime || event.start.date || '');
      return eventDate > now && event.status !== 'cancelled';
    })
    .sort((a: ICalendarEvent, b: ICalendarEvent) => {
      const dateA = new Date(a.start.dateTime || a.start.date || '');
      const dateB = new Date(b.start.dateTime || b.start.date || '');
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, limit);
};

// Instance method to get events by date range
ProfileSchema.methods.getEventsByDateRange = function(startDate: Date, endDate: Date) {
  return this.calendarEvents.filter((event: ICalendarEvent) => {
    const eventStartDate = new Date(event.start.dateTime || event.start.date || '');
    const eventEndDate = new Date(event.end.dateTime || event.end.date || '');
    
    return (eventStartDate >= startDate && eventStartDate <= endDate) ||
           (eventEndDate >= startDate && eventEndDate <= endDate) ||
           (eventStartDate <= startDate && eventEndDate >= endDate);
  });
};

export const Profile = mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
export default Profile; 