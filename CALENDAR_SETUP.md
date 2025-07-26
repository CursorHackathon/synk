# Google Calendar Integration Setup

This guide walks you through setting up Google Calendar integration in your Synk application.

## Prerequisites

1. **Google Cloud Console Project**: You need a Google Cloud Console project with the Calendar API enabled.
2. **MongoDB**: Running MongoDB instance for storing user profiles and calendar data.
3. **Environment Variables**: Properly configured environment variables.

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 1.2 Enable Google Calendar API
1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" for user type
   - Fill in the required app information
   - Add your domain to authorized domains
   - Add the following scopes:
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/userinfo.profile`
     - `https://www.googleapis.com/auth/userinfo.email`

4. For the OAuth client ID:
   - Application type: "Web application"
   - Name: "Synk Calendar Integration"
   - Authorized redirect URIs:
     - `http://localhost:5173/api/calendar/callback` (for development)
     - `https://yourdomain.com/api/calendar/callback` (for production)

5. Download the credentials JSON file or copy the Client ID and Client Secret

## Step 2: Environment Configuration

Add the following variables to your `.env` file:

```env
# Database
MONGO_URL=mongodb://localhost:27017/synk

# Authentication (already configured for better-auth)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Application
APP_URL=http://localhost:5173

# Email Service (for better-auth)
RESEND_API_KEY=your_resend_api_key_here
```

## Step 3: Install Dependencies

The Google APIs client library has already been installed:

```bash
pnpm add googleapis
```

## Step 4: How It Works

### Authentication Flow
1. User logs in with email/password or Google OAuth (existing better-auth flow)
2. User goes to `/settings` page
3. User clicks "Connect Google Calendar"
4. System redirects to Google's OAuth consent screen
5. User grants calendar permissions
6. Google redirects back to `/api/calendar/callback`
7. System exchanges code for access/refresh tokens
8. System stores tokens in user profile and syncs calendar events

### API Endpoints

- `GET /api/calendar/connect` - Initiates Google Calendar OAuth flow
- `GET /api/calendar/callback` - Handles OAuth callback and token exchange
- `POST /api/calendar/sync` - Manually triggers calendar sync
- `POST /api/calendar/disconnect` - Disconnects Google Calendar
- `GET /api/calendar/events` - Retrieves user's calendar events
- `GET /api/profile` - Gets user profile with calendar status

### Data Storage

Calendar events are stored in the `Profile` model with the following structure:

```typescript
interface IProfile {
  userId: string;
  email: string;
  name?: string;
  image?: string;
  
  googleCalendar: {
    connected: boolean;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
    calendars: IGoogleCalendarInfo[];
    lastSyncAt?: Date;
    syncEnabled: boolean;
  };
  
  calendarEvents: ICalendarEvent[];
  preferences: {
    timezone?: string;
    syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'manual';
    defaultCalendarVisibility?: 'private' | 'public';
    autoCreateEvents?: boolean;
  };
}
```

## Step 5: Usage

### For Users
1. Sign up or log in to your Synk account
2. Navigate to Settings (`/settings`)
3. Click "Connect Google Calendar"
4. Grant permissions in the Google consent screen
5. Your calendar events will be automatically synced
6. Use the "Sync Now" button for manual syncing

### For Developers

#### Accessing Calendar Events
```typescript
// Get user's calendar events
const response = await fetch('/api/calendar/events?upcoming=true&limit=10');
const data = await response.json();
console.log(data.events);
```

#### Manual Sync
```typescript
// Trigger manual calendar sync
const response = await fetch('/api/calendar/sync', { method: 'POST' });
const result = await response.json();
console.log(`Synced ${result.eventCount} events`);
```

#### Using the Service Directly
```typescript
import { googleCalendarService } from '$lib/utils/google-calendar-service';

// Sync events for a user
const result = await googleCalendarService.syncUserCalendarEvents(userId);

// Fetch events from a specific calendar
const events = await googleCalendarService.fetchCalendarEvents('primary', 50);
```

## Step 6: Security Considerations

1. **Token Storage**: Access and refresh tokens are stored encrypted in MongoDB
2. **Scopes**: Only calendar read permissions are requested
3. **Token Refresh**: Expired tokens are automatically refreshed
4. **User Control**: Users can disconnect calendar access at any time

## Step 7: Troubleshooting

### Common Issues

1. **"Invalid client" error**
   - Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
   - Verify redirect URI matches exactly (including protocol and port)

2. **"Access denied" error**
   - User declined calendar permissions
   - Check OAuth consent screen configuration

3. **"Token expired" error**
   - Refresh token is automatically used to get new access token
   - If refresh token is invalid, user needs to reconnect

4. **"Calendar API not enabled"**
   - Enable Google Calendar API in Google Cloud Console

### Debug Mode
Add this to your `.env` for more detailed logging:
```env
DEBUG=google-calendar:*
```

### Checking Token Status
```typescript
import { Profile } from '$src/models/profile.model';

const profile = await Profile.findOne({ userId });
console.log('Calendar connected:', profile.googleCalendar.connected);
console.log('Token expires:', profile.googleCalendar.tokenExpiresAt);
console.log('Last sync:', profile.googleCalendar.lastSyncAt);
```

## Step 8: Production Deployment

1. Update OAuth redirect URI to your production domain
2. Set `APP_URL` environment variable to your production URL
3. Consider implementing rate limiting for calendar API calls
4. Set up monitoring for failed sync operations
5. Implement proper error handling and user notifications

## Features Included

✅ **OAuth 2.0 Flow**: Secure Google Calendar authentication  
✅ **Automatic Token Refresh**: Handles expired access tokens  
✅ **Multi-Calendar Support**: Syncs from all user's calendars  
✅ **Event Storage**: Stores events in MongoDB with full metadata  
✅ **Manual Sync**: Users can trigger immediate synchronization  
✅ **Settings UI**: Complete user interface for managing calendar connection  
✅ **Error Handling**: Comprehensive error handling and user feedback  
✅ **Profile Management**: User profiles with calendar preferences  

## API Usage Examples

The calendar events are now automatically fetched and stored when a user connects their Google Calendar. You can access them through the API:

```typescript
// Example: Get upcoming events for the current user
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

const res = await calendar.events.list({
  calendarId: 'primary',
  timeMin: new Date().toISOString(),
  maxResults: 10,
  singleEvents: true,
  orderBy: 'startTime',
});

console.log(res.data.items);
```

The integration handles all the OAuth flow, token management, and data storage automatically! 