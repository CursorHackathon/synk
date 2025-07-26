<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { authClient } from '$src/auth-client';

	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
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
		TrendingUp,
		Loader2
	} from 'lucide-svelte';

	let { data } = $props();
	let syncing = $state(false);
	let loading = $state(true);
	let profile = $state<any>(null);

	  // Use Better Auth reactive session
  const session = authClient.useSession();

  // Debug logging
  console.log('Dashboard component initialized');

  // Get today's events
	function getTodayEvents(events: any[]) {
		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];

		return events.filter((event) => {
			const eventDate = new Date(event.start.dateTime || event.start.date);
			const eventDateStr = eventDate.toISOString().split('T')[0];
			return eventDateStr === todayStr;
		});
	}

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

	  async function loadProfile() {
    console.log('🔄 loadProfile() called');
    try {
      console.log('📡 Fetching /api/profile...');
      const response = await fetch('/api/profile');
      console.log('📡 Profile API response:', response.status, response.ok);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('❌ Unauthorized - redirecting to login');
          goto('/login');
          return;
        }
        throw new Error('Failed to load profile');
      }
      
      const profileData = await response.json();
      console.log('✅ Profile data loaded:', profileData);
      
      profile = {
        googleCalendar: {
          connected: profileData.googleCalendar.connected,
          lastSyncAt: profileData.googleCalendar.lastSyncAt,
          calendarsCount: profileData.googleCalendar.calendars.length
        },
        totalEvents: profileData.totalEvents,
        upcomingEvents: profileData.upcomingEvents || [],
        todayEvents: getTodayEvents(profileData.upcomingEvents || [])
      };
      console.log('✅ Profile state set:', profile);
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      toast.error('Failed to load profile data');
      
      // Set default profile data
      profile = {
        googleCalendar: {
          connected: false,
          lastSyncAt: null,
          calendarsCount: 0
        },
        totalEvents: 0,
        upcomingEvents: [],
        todayEvents: []
      };
      console.log('⚠️ Set default profile data:', profile);
    } finally {
      console.log('🏁 Setting loading = false');
      loading = false;
    }
  }

  // React to session changes
  $effect(() => {
    console.log('🔄 Session effect triggered');
    console.log('📊 Session state:', {
      data: $session.data,
      user: $session.data?.user,
      error: $session.error,
      isPending: $session.isPending
    });
    
    if ($session.data?.user) {
      console.log('✅ User found in session, calling loadProfile');
      loadProfile();
    } else if ($session.error) {
      console.error('❌ Session error:', $session.error);
      goto('/login');
    } else if (!$session.isPending && !$session.data) {
      console.log('⚠️ No session data and not pending - redirecting to login');
      goto('/login');
    } else {
      console.log('⏳ Session still pending or no user yet');
    }
  });

	async function syncCalendar() {
		syncing = true;
		try {
			const response = await fetch('/api/calendar/sync', {
				method: 'POST'
			});

			const result = await response.json();

			if (response.ok) {
				toast.success(`Synced ${result.eventCount} events from ${result.calendarsCount} calendars`);
				// Reload profile data
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

	function goToSettings() {
		goto('/settings');
	}

	function goToNewEvent() {
		goto('/event/new');
	}

  onMount(() => {
    console.log('Dashboard component mounted');
    loadProfile();
  });
</script>

<svelte:head>
	<title>Dashboard - Synk</title>
</svelte:head>

{#if loading || !$session.data}
	<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
		<div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
			<Loader2 class="h-6 w-6 animate-spin" />
			Loading dashboard...
		</div>
	</div>
	{console.log('🔄 Still in loading state:', { loading, sessionData: $session.data, sessionError: $session.error, isPending: $session.isPending })}
{:else if $session.data?.user && profile}
	<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
		<!-- Header -->
		<div class="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
			<div class="container mx-auto px-4 py-6">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
						<p class="text-gray-600 dark:text-gray-400">
							Welcome back, {$session.data?.user?.name || $session.data?.user?.email}
						</p>
					</div>
					<div class="flex gap-3">
						<Button variant="outline" on:click={goToSettings}>
							<Settings class="mr-2 h-4 w-4" />
							Settings
						</Button>
						<Button on:click={goToNewEvent}>
							<Plus class="mr-2 h-4 w-4" />
							New Event
						</Button>
					</div>
				</div>
			</div>
		</div>

		<div class="container mx-auto space-y-8 px-4 py-8">
			<!-- Stats Overview -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<!-- Google Calendar Status -->
				<Card>
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Google Calendar</CardTitle>
						<Calendar class="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div class="flex items-center gap-2">
							{#if profile.googleCalendar.connected}
								<Badge class="bg-green-100 text-green-800">
									<CalendarCheck class="mr-1 h-3 w-3" />
									Connected
								</Badge>
							{:else}
								<Badge variant="secondary">
									<CalendarX class="mr-1 h-3 w-3" />
									Not Connected
								</Badge>
							{/if}
						</div>
						<p class="mt-2 text-xs text-muted-foreground">
							{profile.googleCalendar.calendarsCount} calendars
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
						<div class="text-2xl font-bold">{profile.totalEvents}</div>
						<p class="text-xs text-muted-foreground">From your calendar</p>
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
							{#if profile.googleCalendar.lastSyncAt}
								{formatDate(profile.googleCalendar.lastSyncAt)}
							{:else}
								Never
							{/if}
						</div>
						{#if profile.googleCalendar.connected}
							<Button
								variant="ghost"
								size="sm"
								class="mt-2 h-auto p-0"
								on:click={syncCalendar}
								disabled={syncing}
							>
								{#if syncing}
									<RefreshCw class="mr-1 h-3 w-3 animate-spin" />
									Syncing...
								{:else}
									<RefreshCw class="mr-1 h-3 w-3" />
									Sync Now
								{/if}
							</Button>
						{:else}
							<Button variant="ghost" size="sm" class="mt-2 h-auto p-0" on:click={goToSettings}>
								Connect Calendar
							</Button>
						{/if}
					</CardContent>
				</Card>
			</div>

			<!-- Main Content -->
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<!-- Today's Events -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Calendar class="h-5 w-5" />
							Today's Events
						</CardTitle>
						<CardDescription>Events happening today</CardDescription>
					</CardHeader>
					<CardContent>
						{#if profile.todayEvents.length === 0}
							<div class="py-8 text-center">
								<Calendar class="mx-auto mb-4 h-12 w-12 text-gray-400" />
								<p class="text-gray-500">No events scheduled for today</p>
								{#if !profile.googleCalendar.connected}
									<Button variant="outline" class="mt-4" on:click={goToSettings}>
										<CalendarCheck class="mr-2 h-4 w-4" />
										Connect Google Calendar
									</Button>
								{/if}
							</div>
						{:else}
							<div class="space-y-4">
								{#each profile.todayEvents as event}
									<div
										class="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
									>
										<div class="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
										<div class="min-w-0 flex-1">
											<h4 class="truncate font-medium text-gray-900 dark:text-white">
												{event.summary}
											</h4>
											<div
												class="mt-1 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400"
											>
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
												<p class="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
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
							Your next {profile.upcomingEvents.length} events
						</CardDescription>
					</CardHeader>
					<CardContent>
						{#if profile.upcomingEvents.length === 0}
							<div class="py-8 text-center">
								<Clock class="mx-auto mb-4 h-12 w-12 text-gray-400" />
								<p class="text-gray-500">No upcoming events</p>
								{#if !profile.googleCalendar.connected}
									<Button variant="outline" class="mt-4" on:click={goToSettings}>
										<CalendarCheck class="mr-2 h-4 w-4" />
										Connect Google Calendar
									</Button>
								{/if}
							</div>
						{:else}
							<div class="space-y-4">
								{#each profile.upcomingEvents as event}
									<div
										class="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
									>
										<div class="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
										<div class="min-w-0 flex-1">
											<div class="flex items-center justify-between">
												<h4 class="truncate font-medium text-gray-900 dark:text-white">
													{event.summary}
												</h4>
												<Badge variant="outline" class="text-xs">
													{getTimeUntilEvent(event.start.dateTime || event.start.date)}
												</Badge>
											</div>
											<div
												class="mt-1 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400"
											>
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
												<div
													class="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
												>
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
			{#if !profile.googleCalendar.connected}
				<Card
					class="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20"
				>
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
							<CalendarCheck class="mr-2 h-4 w-4" />
							Connect Google Calendar
						</Button>
					</CardContent>
				</Card>
			{/if}
		</div>
	</div>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
