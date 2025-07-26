<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { toast } from 'svelte-sonner';
  
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { CalendarCheck, CalendarX, RefreshCw, Settings, Calendar } from 'lucide-svelte';

  let profile = $state(null);
  let loading = $state(true);
  let syncing = $state(false);
  let connecting = $state(false);

  onMount(async () => {
    await loadProfile();
    
    // Check for calendar connection status from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('calendar_connected') === 'true') {
      toast.success('Google Calendar connected successfully!');
      await loadProfile(); // Reload to get updated data
    } else if (urlParams.get('calendar_error')) {
      const error = urlParams.get('calendar_error');
      const errorMessages = {
        'access_denied': 'Google Calendar access was denied',
        'invalid_callback': 'Invalid calendar callback',
        'user_not_found': 'User not found',
        'connection_failed': 'Failed to connect Google Calendar',
        'unknown': 'An unknown error occurred'
      };
      toast.error(errorMessages[error] || 'Failed to connect Google Calendar');
    }
    
    // Clean up URL params
    if (urlParams.has('calendar_connected') || urlParams.has('calendar_error')) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  });

  async function loadProfile() {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        profile = await response.json();
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      loading = false;
    }
  }

  async function connectGoogleCalendar() {
    connecting = true;
    try {
      window.location.href = '/api/calendar/connect';
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      toast.error('Failed to initiate Google Calendar connection');
      connecting = false;
    }
  }

  async function disconnectGoogleCalendar() {
    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST'
      });
      
      if (response.ok) {
        toast.success('Google Calendar disconnected');
        await loadProfile();
      } else {
        toast.error('Failed to disconnect Google Calendar');
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    }
  }

  async function syncCalendar() {
    syncing = true;
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(`Synced ${result.eventCount} events from ${result.calendarsCount} calendars`);
        await loadProfile();
      } else {
        toast.error(result.error || 'Failed to sync calendar');
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error('Failed to sync calendar');
    } finally {
      syncing = false;
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>Settings - Synk</title>
</svelte:head>

<div class="container mx-auto py-6 space-y-6">
  <div class="flex items-center gap-2">
    <Settings class="h-6 w-6" />
    <h1 class="text-3xl font-bold">Settings</h1>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <RefreshCw class="h-6 w-6 animate-spin" />
      <span class="ml-2">Loading...</span>
    </div>
  {:else if profile}
    <!-- Google Calendar Integration -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Calendar class="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to sync events automatically
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium">Status:</span>
              {#if profile.googleCalendar.connected}
                <Badge variant="default" class="bg-green-100 text-green-800">
                  <CalendarCheck class="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              {:else}
                <Badge variant="secondary">
                  <CalendarX class="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              {/if}
            </div>
            
            {#if profile.googleCalendar.connected}
              <div class="text-sm text-muted-foreground mt-1">
                {profile.googleCalendar.calendars.length} calendars • 
                {profile.totalEvents} events • 
                Last sync: {profile.googleCalendar.lastSyncAt ? formatDate(profile.googleCalendar.lastSyncAt) : 'Never'}
              </div>
            {/if}
          </div>
          
          <div class="flex gap-2">
            {#if profile.googleCalendar.connected}
              <Button 
                variant="outline" 
                size="sm" 
                on:click={syncCalendar} 
                disabled={syncing}
              >
                {#if syncing}
                  <RefreshCw class="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                {:else}
                  <RefreshCw class="h-4 w-4 mr-2" />
                  Sync Now
                {/if}
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                on:click={disconnectGoogleCalendar}
              >
                Disconnect
              </Button>
            {:else}
              <Button 
                on:click={connectGoogleCalendar} 
                disabled={connecting}
              >
                {#if connecting}
                  <RefreshCw class="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                {:else}
                  <CalendarCheck class="h-4 w-4 mr-2" />
                  Connect Google Calendar
                {/if}
              </Button>
            {/if}
          </div>
        </div>

        {#if profile.googleCalendar.connected && profile.googleCalendar.calendars.length > 0}
          <div class="space-y-2">
            <h4 class="font-medium">Connected Calendars</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              {#each profile.googleCalendar.calendars as calendar}
                <div class="flex items-center gap-2 p-2 border rounded-lg">
                  <div 
                    class="w-3 h-3 rounded-full" 
                    style="background-color: {calendar.backgroundColor || '#3b82f6'}"
                  ></div>
                  <span class="text-sm">{calendar.summary}</span>
                  {#if calendar.primary}
                    <Badge variant="outline" class="text-xs">Primary</Badge>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Upcoming Events -->
    {#if profile.googleCalendar.connected && profile.upcomingEvents.length > 0}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>
            Your next {profile.upcomingEvents.length} events from Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            {#each profile.upcomingEvents as event}
              <div class="flex items-start gap-3 p-3 border rounded-lg">
                <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium truncate">{event.summary}</h4>
                  <p class="text-sm text-muted-foreground">
                    {formatDate(event.start.dateTime || event.start.date)}
                  </p>
                  {#if event.location}
                    <p class="text-sm text-muted-foreground truncate">{event.location}</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Profile Information -->
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Your account details</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium">Name</label>
            <p class="text-sm text-muted-foreground">{profile.name || 'Not provided'}</p>
          </div>
          <div>
            <label class="text-sm font-medium">Email</label>
            <p class="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <div>
            <label class="text-sm font-medium">Member Since</label>
            <p class="text-sm text-muted-foreground">{formatDate(profile.createdAt)}</p>
          </div>
          <div>
            <label class="text-sm font-medium">Total Events</label>
            <p class="text-sm text-muted-foreground">{profile.totalEvents}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  {:else}
    <div class="text-center py-12">
      <p class="text-muted-foreground">Failed to load profile</p>
      <Button variant="outline" on:click={loadProfile} class="mt-4">
        Try Again
      </Button>
    </div>
  {/if}
</div> 