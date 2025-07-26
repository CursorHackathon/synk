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
		Settings,
		Plus,
		TrendingUp,
		Loader2,
		Calendar,
		ExternalLink
	} from 'lucide-svelte';

	let { data } = $props();
	let loading = $state(true);
	let events = $state<any[]>([]);

	// Use Better Auth reactive session
	const session = authClient.useSession();

	// Debug logging
	console.log('Dashboard component initialized');

	function goToSettings() {
		goto('/settings');
	}

	function goToNewEvent() {
		goto('/event/new');
	}

	function viewEvent(eventCode: string) {
		goto(`/event/${eventCode}`);
	}

	async function loadEvents() {
		try {
			const response = await fetch('/api/events');
			const result = await response.json();

			if (response.ok) {
				events = result.events || [];
			} else {
				console.error('Failed to load events:', result.error);
			}
		} catch (error) {
			console.error('Error loading events:', error);
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	onMount(async () => {
		console.log('Dashboard component mounted');
		// Load user's events
		await loadEvents();
		// Simple loading timeout
		setTimeout(() => {
			loading = false;
		}, 500);
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
{:else if $session.data?.user}
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
						<Button variant="outline" onclick={goToSettings}>
							{#snippet children()}
								<Settings class="mr-2 h-4 w-4" />
								Settings
							{/snippet}
						</Button>
						<Button onclick={goToNewEvent}>
							{#snippet children()}
								<Plus class="mr-2 h-4 w-4" />
								New Event
							{/snippet}
						</Button>
					</div>
				</div>
			</div>
		</div>

		<div class="container mx-auto space-y-8 px-4 py-8">
			<!-- Welcome Card -->
			<Card>
				<CardHeader>
					<CardTitle>Welcome to Synk</CardTitle>
					<CardDescription>
						Create and manage events with ease
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p class="text-gray-600 dark:text-gray-400">
						Get started by creating your first event or explore your settings.
					</p>
					<div class="mt-4 flex gap-4">
						<Button onclick={goToNewEvent}>
							{#snippet children()}
								<Plus class="mr-2 h-4 w-4" />
								Create Event
							{/snippet}
						</Button>
						<Button variant="outline" onclick={goToSettings}>
							{#snippet children()}
								<Settings class="mr-2 h-4 w-4" />
								Manage Settings
							{/snippet}
						</Button>
					</div>
				</CardContent>
			</Card>

			<!-- Quick Stats -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card>
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Total Events</CardTitle>
						<Calendar class="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-bold">{events.length}</div>
						<p class="text-xs text-muted-foreground">Events created</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Profile</CardTitle>
						<Settings class="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div class="text-sm font-medium">{$session.data?.user?.name || 'No name set'}</div>
						<p class="text-xs text-muted-foreground">{$session.data?.user?.email}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Quick Actions</CardTitle>
						<Plus class="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<Button variant="ghost" size="sm" onclick={goToNewEvent} class="h-auto p-0">
							{#snippet children()}
								Create New Event
							{/snippet}
						</Button>
					</CardContent>
				</Card>
			</div>

			<!-- Your Events -->
			{#if events.length > 0}
				<Card>
					<CardHeader>
						<CardTitle>Your Events</CardTitle>
						<CardDescription>Manage and track your created events</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							{#each events as event}
								<div class="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
									<div class="space-y-1">
										<h3 class="font-medium text-gray-900 dark:text-white">{event.title}</h3>
										<div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
											<span>{formatDate(event.date)}</span>
											{#if event.location}
												<span>• {event.location}</span>
											{/if}
											<span>• {event.emailCount} guests</span>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<Badge variant="outline">
											{#snippet children()}
												{event.eventCode}
											{/snippet}
										</Badge>
										<Button size="sm" variant="ghost" onclick={() => viewEvent(event.eventCode)}>
											{#snippet children()}
												<ExternalLink class="h-4 w-4" />
											{/snippet}
										</Button>
									</div>
								</div>
							{/each}
						</div>
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
