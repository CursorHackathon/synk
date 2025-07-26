<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { 
    Calendar, 
    CalendarCheck, 
    CalendarX, 
    Clock, 
    MapPin, 
    RefreshCw, 
    Settings, 
    Users,
    Plus,
    TrendingUp
  } from 'lucide-svelte';

  let { data } = $props();
  let syncing = $state(false);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getTimeUntilEvent(dateStr: string) {
    const eventDate = new Date(dateStr);
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Started';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
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
        // Reload the page to show updated data
        window.location.reload();
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

  function goToSettings() {
    goto('/settings');
  }

  function goToNewEvent() {
    goto('/event/new');
  }
</script>

<svelte:head>
  <title>Dashboard - Synk</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Header -->
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div class="container mx-auto px-4 py-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p class="text-gray-600 dark:text-gray-400">Welcome back, {data.user.name || data.user.email}</p>
        </div>
        <div class="flex gap-3">
          <Button variant="outline" on:click={goToSettings}>
            <Settings class="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button on:click={goToNewEvent}>
            <Plus class="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>
    </div>
  </div>

  <div class="container mx-auto px-4 py-8 space-y-8">
    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Google Calendar Status -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Google Calendar</CardTitle>
          <Calendar class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-2">
            {#if data.profile.googleCalendar.connected}
              <Badge class="bg-green-100 text-green-800">
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
          <p class="text-xs text-muted-foreground mt-2">
            {data.profile.googleCalendar.calendarsCount} calendars
          </p>
        </CardContent>
      </Card>

      <!-- Total Events -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Events</CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{data.profile.totalEvents}</div>
          <p class="text-xs text-muted-foreground">
            From your calendar
          </p>
        </CardContent>
      </Card>

      <!-- Last Sync -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Last Sync</CardTitle>
          <Clock class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-sm">
            {#if data.profile.googleCalendar.lastSyncAt}
              {formatDate(data.profile.googleCalendar.lastSyncAt)}
            {:else}
              Never
            {/if}
          </div>
          {#if data.profile.googleCalendar.connected}
            <Button 
              variant="ghost" 
              size="sm" 
              class="mt-2 p-0 h-auto"
              on:click={syncCalendar}
              disabled={syncing}
            >
              {#if syncing}
                <RefreshCw class="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              {:else}
                <RefreshCw class="h-3 w-3 mr-1" />
                Sync Now
              {/if}
            </Button>
          {:else}
            <Button 
              variant="ghost" 
              size="sm" 
              class="mt-2 p-0 h-auto"
              on:click={goToSettings}
            >
              Connect Calendar
            </Button>
          {/if}
        </CardContent>
      </Card>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Today's Events -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Calendar class="h-5 w-5" />
            Today's Events
          </CardTitle>
          <CardDescription>
            Events happening today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {#if data.profile.todayEvents.length === 0}
            <div class="text-center py-8">
              <Calendar class="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p class="text-gray-500">No events scheduled for today</p>
              {#if !data.profile.googleCalendar.connected}
                <Button variant="outline" class="mt-4" on:click={goToSettings}>
                  <CalendarCheck class="h-4 w-4 mr-2" />
                  Connect Google Calendar
                </Button>
              {/if}
            </div>
          {:else}
            <div class="space-y-4">
              {#each data.profile.todayEvents as event}
                <div class="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 dark:text-white truncate">
                      {event.summary}
                    </h4>
                    <div class="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <div class="flex items-center gap-1">
                        <Clock class="h-3 w-3" />
                        {formatTime(event.start.dateTime || event.start.date)}
                      </div>
                      {#if event.location}
                        <div class="flex items-center gap-1">
                          <MapPin class="h-3 w-3" />
                          <span class="truncate">{event.location}</span>
                        </div>
                      {/if}
                    </div>
                    {#if event.description}
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Upcoming Events -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Clock class="h-5 w-5" />
            Upcoming Events
          </CardTitle>
          <CardDescription>
            Your next {data.profile.upcomingEvents.length} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {#if data.profile.upcomingEvents.length === 0}
            <div class="text-center py-8">
              <Clock class="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p class="text-gray-500">No upcoming events</p>
              {#if !data.profile.googleCalendar.connected}
                <Button variant="outline" class="mt-4" on:click={goToSettings}>
                  <CalendarCheck class="h-4 w-4 mr-2" />
                  Connect Google Calendar
                </Button>
              {/if}
            </div>
          {:else}
            <div class="space-y-4">
              {#each data.profile.upcomingEvents as event}
                <div class="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div class="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <h4 class="font-medium text-gray-900 dark:text-white truncate">
                        {event.summary}
                      </h4>
                      <Badge variant="outline" class="text-xs">
                        {getTimeUntilEvent(event.start.dateTime || event.start.date)}
                      </Badge>
                    </div>
                    <div class="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <div class="flex items-center gap-1">
                        <Calendar class="h-3 w-3" />
                        {formatDate(event.start.dateTime || event.start.date)}
                      </div>
                      {#if event.location}
                        <div class="flex items-center gap-1">
                          <MapPin class="h-3 w-3" />
                          <span class="truncate">{event.location}</span>
                        </div>
                      {/if}
                    </div>
                    {#if event.attendees && event.attendees.length > 0}
                      <div class="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Users class="h-3 w-3" />
                        {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </CardContent>
      </Card>
    </div>

    <!-- Calendar Integration CTA -->
    {#if !data.profile.googleCalendar.connected}
      <Card class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <CalendarCheck class="h-5 w-5" />
            Connect Your Google Calendar
          </CardTitle>
          <CardDescription class="text-blue-700 dark:text-blue-300">
            Sync your calendar events to see them here and manage your schedule more effectively.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button on:click={goToSettings} class="bg-blue-600 hover:bg-blue-700">
            <CalendarCheck class="h-4 w-4 mr-2" />
            Connect Google Calendar
          </Button>
        </CardContent>
      </Card>
    {/if}
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style> 