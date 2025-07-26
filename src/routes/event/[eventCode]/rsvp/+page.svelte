<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Calendar, MapPin, Users, CheckCircle, XCircle, Clock, ThumbsUp } from 'lucide-svelte';

	const eventCode = $page.params.eventCode;
	let event = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedEmail = $state<string | null>(null);
	let submitting = $state(false);

	onMount(async () => {
		await loadEvent();
	});

	async function loadEvent() {
		try {
			loading = true;
			const response = await fetch(`/api/events/public/${eventCode}`);
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to load event');
			}

			event = result.event;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load event';
		} finally {
			loading = false;
		}
	}

	async function handleRSVP(status: 'accepted' | 'declined') {
		if (!selectedEmail) {
			toast.error('Please select your email from the list');
			return;
		}

		submitting = true;
		try {
			const response = await fetch(`/api/events/${eventCode}/rsvp`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: selectedEmail,
					status
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit RSVP');
			}

			toast.success(status === 'accepted' ? 'You have accepted the invitation!' : 'You have declined the invitation.');
			
			// Reload event to update RSVP status
			await loadEvent();
			
			// If voting is enabled and user accepted, prompt to vote
			if (status === 'accepted' && event.hasVoting) {
				setTimeout(() => {
					toast.info('You can now vote on options for this event!');
				}, 1500);
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to submit RSVP');
		} finally {
			submitting = false;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getRSVPStatus(email: string) {
		const rsvp = event?.rsvps?.find((r: any) => r.email === email);
		return rsvp?.status || 'pending';
	}

	function isEmailRSVPed(email: string) {
		return event?.rsvps?.some((r: any) => r.email === email && r.status !== 'pending');
	}
</script>

<svelte:head>
	<title>{event?.title || 'Event'} - RSVP</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
	<div class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white"></div>
					<p class="mt-2 text-gray-600 dark:text-gray-400">Loading event...</p>
				</div>
			</div>
		{:else if error}
			<Card>
				<CardContent class="pt-6">
					<div class="text-center">
						<h2 class="text-lg font-semibold text-gray-900 dark:text-white">Event Not Found</h2>
						<p class="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
					</div>
				</CardContent>
			</Card>
		{:else if event}
			<div class="space-y-6">
				<!-- Event Header -->
				<Card>
					<CardHeader class="text-center">
						<CardTitle class="text-3xl">{event.title}</CardTitle>
						<CardDescription>You're invited! Please RSVP below.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<!-- Event Details -->
						<div class="space-y-3">
							<div class="flex items-center gap-3 text-gray-600 dark:text-gray-400">
								<Calendar class="h-5 w-5 flex-shrink-0" />
								<span>{formatDate(event.date)}</span>
							</div>
							
							{#if event.location}
								<div class="flex items-center gap-3 text-gray-600 dark:text-gray-400">
									<MapPin class="h-5 w-5 flex-shrink-0" />
									<span>{event.location}</span>
								</div>
							{/if}
							
							<div class="flex items-center gap-3 text-gray-600 dark:text-gray-400">
								<Users class="h-5 w-5 flex-shrink-0" />
								<span>{event.rsvpStats.accepted} attending, {event.rsvpStats.total} invited</span>
							</div>
						</div>

						{#if event.description}
							<div class="pt-4 border-t">
								<h3 class="font-medium mb-2">About this event</h3>
								<p class="text-gray-600 dark:text-gray-400">{event.description}</p>
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- RSVP Section -->
				<Card>
					<CardHeader>
						<CardTitle>Select Your Email</CardTitle>
						<CardDescription>Find your email in the list below to RSVP</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
							{#each event.emails as email}
								{@const status = getRSVPStatus(email)}
								{@const hasResponded = isEmailRSVPed(email)}
								<button
									class="w-full text-left p-3 rounded-lg border transition-colors {
										selectedEmail === email 
											? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
											: 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
									}"
									onclick={() => selectedEmail = email}
									disabled={hasResponded}
								>
									<div class="flex items-center justify-between">
										<span class="font-mono text-sm">{email}</span>
										{#if status === 'accepted'}
											<Badge class="bg-green-100 text-green-800">
												{#snippet children()}
													<CheckCircle class="h-3 w-3 mr-1" />
													Attending
												{/snippet}
											</Badge>
										{:else if status === 'declined'}
											<Badge class="bg-red-100 text-red-800">
												{#snippet children()}
													<XCircle class="h-3 w-3 mr-1" />
													Not Attending
												{/snippet}
											</Badge>
										{:else if selectedEmail === email}
											<Badge class="bg-blue-100 text-blue-800">
												{#snippet children()}
													Selected
												{/snippet}
											</Badge>
										{:else}
											<Badge variant="outline">
												{#snippet children()}
													<Clock class="h-3 w-3 mr-1" />
													Pending
												{/snippet}
											</Badge>
										{/if}
									</div>
								</button>
							{/each}
						</div>

						{#if selectedEmail && !isEmailRSVPed(selectedEmail)}
							<div class="pt-4 border-t">
								<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
									Responding as: <span class="font-mono font-medium">{selectedEmail}</span>
								</p>
								<div class="flex gap-3">
									<Button 
										onclick={() => handleRSVP('accepted')} 
										disabled={submitting}
										class="flex-1 bg-green-600 hover:bg-green-700"
									>
										{#snippet children()}
											<CheckCircle class="h-4 w-4 mr-2" />
											Accept Invitation
										{/snippet}
									</Button>
									<Button 
										onclick={() => handleRSVP('declined')} 
										disabled={submitting}
										variant="outline"
										class="flex-1 border-red-200 text-red-600 hover:bg-red-50"
									>
										{#snippet children()}
											<XCircle class="h-4 w-4 mr-2" />
											Decline Invitation
										{/snippet}
									</Button>
								</div>
							</div>
						{:else if !selectedEmail}
							<p class="text-center text-sm text-gray-500 dark:text-gray-400">
								Select your email from the list above to RSVP
							</p>
						{/if}
					</CardContent>
				</Card>

				<!-- Voting Section -->
				{#if event.hasVoting && selectedEmail && getRSVPStatus(selectedEmail) === 'accepted'}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<ThumbsUp class="h-5 w-5" />
								Event Voting
							</CardTitle>
							<CardDescription>Vote on options for this event</CardDescription>
						</CardHeader>
						<CardContent>
							<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
								Help decide by voting on the options below using our swipe interface.
							</p>
							<Button 
								onclick={() => goto(`/event/${eventCode}/vote`)} 
								class="w-full"
							>
								{#snippet children()}
									<ThumbsUp class="h-4 w-4 mr-2" />
									Start Voting
								{/snippet}
							</Button>
							{#if event.votingStats}
								<div class="mt-4 pt-4 border-t">
									<p class="text-sm text-gray-600 dark:text-gray-400">
										{event.votingStats.totalVoters} of {event.votingStats.totalInvited} people have voted
									</p>
								</div>
							{/if}
						</CardContent>
					</Card>
				{/if}
			</div>
		{/if}
	</div>
</div> 