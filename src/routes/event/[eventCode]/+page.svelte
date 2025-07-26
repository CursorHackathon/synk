<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import { CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	const eventCode = $page.params.eventCode;
	let event = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		await loadEvent();
	});

	async function loadEvent() {
		try {
			loading = true;
			const response = await fetch(`/api/events?eventCode=${eventCode}`);
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to load event');
			}

			event = result.event;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load event';
			toast.error(error);
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	function copyEventCode() {
		navigator.clipboard.writeText(eventCode);
		toast.success('Event code copied to clipboard!');
	}
</script>

<svelte:head>
	<title>Event {eventCode}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
		
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white"></div>
					<p class="mt-2 text-gray-600 dark:text-gray-400">Loading event...</p>
				</div>
			</div>
		{:else if error}
			<Card class="shadow-lg">
				<CardContent class="pt-6">
					<div class="text-center">
						<svg class="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
						<h2 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Event Not Found</h2>
						<p class="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
						<Button onclick={() => goto('/')} class="mt-4">
							Go Home
						</Button>
					</div>
				</CardContent>
			</Card>
		{:else if event}
			<!-- Success Message -->
			<div class="mb-8 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-green-800 dark:text-green-200">
							Event Created Successfully!
						</h3>
						<p class="mt-1 text-sm text-green-700 dark:text-green-300">
							Your event has been created and invitations will be sent to {event.emailCount} recipients.
						</p>
					</div>
				</div>
			</div>

			<!-- Event Details -->
			<Card class="shadow-lg">
				<CardHeader>
					<div class="flex items-center justify-between">
						<div>
							<CardTitle class="text-2xl">{event.title}</CardTitle>
							<CardDescription class="mt-1">Event Code: {eventCode}</CardDescription>
						</div>
						<Button variant="outline" onclick={copyEventCode}>
							Copy Code
						</Button>
					</div>
				</CardHeader>
				
				<CardContent class="space-y-6">
					<!-- Event Information Grid -->
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<h4 class="font-medium text-gray-900 dark:text-white">Date & Time</h4>
							<p class="text-gray-600 dark:text-gray-400">{formatDate(event.date)}</p>
						</div>
						
						{#if event.location}
							<div>
								<h4 class="font-medium text-gray-900 dark:text-white">Location</h4>
								<p class="text-gray-600 dark:text-gray-400">{event.location}</p>
							</div>
						{/if}
						
						<div>
							<h4 class="font-medium text-gray-900 dark:text-white">Invited Guests</h4>
							<p class="text-gray-600 dark:text-gray-400">{event.emailCount} people</p>
						</div>
						
						{#if event.maxAttendees}
							<div>
								<h4 class="font-medium text-gray-900 dark:text-white">Max Attendees</h4>
								<p class="text-gray-600 dark:text-gray-400">{event.maxAttendees} people</p>
							</div>
						{/if}
					</div>

					{#if event.description}
						<div>
							<h4 class="font-medium text-gray-900 dark:text-white">Description</h4>
							<p class="mt-1 text-gray-600 dark:text-gray-400">{event.description}</p>
						</div>
					{/if}

					<!-- RSVP Statistics -->
					{#if event.rsvpStats}
						<div>
							<h4 class="font-medium text-gray-900 dark:text-white">RSVP Status</h4>
							<div class="mt-2 grid grid-cols-4 gap-4 text-center">
								<div class="rounded-md bg-gray-100 dark:bg-gray-800 p-3">
									<div class="text-lg font-semibold text-gray-900 dark:text-white">{event.rsvpStats.total}</div>
									<div class="text-xs text-gray-600 dark:text-gray-400">Total</div>
								</div>
								<div class="rounded-md bg-green-100 dark:bg-green-900/30 p-3">
									<div class="text-lg font-semibold text-green-700 dark:text-green-300">{event.rsvpStats.accepted}</div>
									<div class="text-xs text-green-600 dark:text-green-400">Accepted</div>
								</div>
								<div class="rounded-md bg-red-100 dark:bg-red-900/30 p-3">
									<div class="text-lg font-semibold text-red-700 dark:text-red-300">{event.rsvpStats.declined}</div>
									<div class="text-xs text-red-600 dark:text-red-400">Declined</div>
								</div>
								<div class="rounded-md bg-yellow-100 dark:bg-yellow-900/30 p-3">
									<div class="text-lg font-semibold text-yellow-700 dark:text-yellow-300">{event.rsvpStats.pending}</div>
									<div class="text-xs text-yellow-600 dark:text-yellow-400">Pending</div>
								</div>
							</div>
							<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
								Response Rate: {event.rsvpStats.responseRate}%
							</p>
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="flex gap-3 pt-4">
						<Button onclick={() => goto('/')} variant="outline" class="flex-1">
							Back to Home
						</Button>
						<Button onclick={() => goto('/event/new')} class="flex-1">
							Create Another Event
						</Button>
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
</div> 