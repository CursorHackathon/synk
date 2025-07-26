<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import { CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Heart, X, ArrowLeft } from 'lucide-svelte';

	const eventCode = $page.params.eventCode;
	let event = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedEmail = $state<string | null>(null);
	let emailConfirmed = $state(false);
	
	// Voting state
	let currentIndex = $state(0);
	let votes = $state<{ [key: string]: 'like' | 'dislike' }>({});
	let isDragging = $state(false);
	let dragOffset = $state({ x: 0, y: 0 });
	let rotation = $state(0);
	let cardElement: HTMLElement;
	let isSubmitting = $state(false);

	let startPosition = { x: 0, y: 0 };
	const swipeThreshold = 100;

	let currentOption = $derived(event?.voteOptions?.[currentIndex]);
	let isComplete = $derived(currentIndex >= (event?.voteOptions?.length || 0));

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
			
			// Check if event has voting enabled
			if (!event.hasVoting || !event.voteOptions || event.voteOptions.length === 0) {
				error = 'This event does not have voting enabled';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load event';
		} finally {
			loading = false;
		}
	}

	function confirmEmail() {
		if (!selectedEmail) {
			toast.error('Please select your email from the list');
			return;
		}
		emailConfirmed = true;
	}

	function handlePointerDown(event: PointerEvent) {
		isDragging = true;
		startPosition = { x: event.clientX, y: event.clientY };
		dragOffset = { x: 0, y: 0 };
		rotation = 0;
		cardElement?.setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging) return;

		const deltaX = event.clientX - startPosition.x;
		const deltaY = event.clientY - startPosition.y;
		
		dragOffset = { x: deltaX, y: deltaY };
		rotation = deltaX * 0.1;
	}

	function handlePointerUp() {
		if (!isDragging) return;
		isDragging = false;

		const absX = Math.abs(dragOffset.x);
		
		if (absX > swipeThreshold) {
			const direction = dragOffset.x > 0 ? 'like' : 'dislike';
			handleVote(direction);
		} else {
			dragOffset = { x: 0, y: 0 };
			rotation = 0;
		}
	}

	function handleVote(vote: 'like' | 'dislike') {
		if (currentOption) {
			votes[currentOption.id] = vote;
		}
		
		const direction = vote === 'like' ? 1 : -1;
		dragOffset = { x: direction * 300, y: -50 };
		rotation = direction * 30;
		
		setTimeout(() => {
			currentIndex++;
			dragOffset = { x: 0, y: 0 };
			rotation = 0;
		}, 300);
	}

	async function submitVotes() {
		if (!selectedEmail) return;

		isSubmitting = true;
		try {
			const votesArray = Object.entries(votes).map(([optionId, vote]) => ({
				optionId,
				vote
			}));

			const response = await fetch(`/api/events/${eventCode}/vote`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: selectedEmail,
					votes: votesArray
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit votes');
			}

			toast.success('Your votes have been submitted!');
			goto(`/event/${eventCode}/rsvp`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to submit votes');
		} finally {
			isSubmitting = false;
		}
	}

	function resetVoting() {
		currentIndex = 0;
		votes = {};
		dragOffset = { x: 0, y: 0 };
		rotation = 0;
	}

	function getVotesSummary() {
		const liked = Object.values(votes).filter(v => v === 'like').length;
		const disliked = Object.values(votes).filter(v => v === 'dislike').length;
		return { liked, disliked, total: liked + disliked };
	}
</script>

<svelte:head>
	<title>Vote - {event?.title || 'Event'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
	<div class="container mx-auto px-4 max-w-md">
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
						<h2 class="text-lg font-semibold text-gray-900 dark:text-white">Error</h2>
						<p class="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
						<Button onclick={() => goto(`/event/${eventCode}/rsvp`)} class="mt-4">
							{#snippet children()}
								Back to Event
							{/snippet}
						</Button>
					</div>
				</CardContent>
			</Card>
		{:else if event && !emailConfirmed}
			<!-- Email Selection -->
			<Card>
				<CardHeader class="text-center">
					<CardTitle>{event.title}</CardTitle>
					<CardDescription>Select your email to start voting</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
						{#each event.emails as email}
							<button
								class="w-full text-left p-3 rounded-lg border transition-colors {
									selectedEmail === email 
										? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
										: 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
								}"
								onclick={() => selectedEmail = email}
							>
								<span class="font-mono text-sm">{email}</span>
							</button>
						{/each}
					</div>

					<Button 
						onclick={confirmEmail} 
						disabled={!selectedEmail}
						class="w-full"
					>
						{#snippet children()}
							Start Voting
						{/snippet}
					</Button>
				</CardContent>
			</Card>
		{:else if event && emailConfirmed}
			<!-- Header -->
			<div class="mb-8 text-center">
				<Button 
					variant="ghost" 
					onclick={() => goto(`/event/${eventCode}/rsvp`)}
					class="mb-4"
				>
					{#snippet children()}
						<ArrowLeft class="h-4 w-4 mr-2" />
						Back to Event
					{/snippet}
				</Button>
				<h1 class="text-3xl font-bold mb-2">{event.title}</h1>
				<p class="text-gray-600 dark:text-gray-400">Swipe right to like, left to dislike</p>
			</div>

			{#if !isComplete}
				<!-- Voting Interface -->
				<div class="relative h-[500px] mb-8">
					<!-- Next card (background) -->
					{#if currentIndex + 1 < event.voteOptions.length}
						<div class="absolute inset-0 transform scale-95 opacity-50">
							<Card class="h-full">
								<CardContent class="h-full flex flex-col justify-center items-center p-6">
									<div class="text-6xl mb-4">{event.voteOptions[currentIndex + 1].image}</div>
									<h3 class="text-xl font-semibold text-center">{event.voteOptions[currentIndex + 1].title}</h3>
								</CardContent>
							</Card>
						</div>
					{/if}

					<!-- Current card -->
					<div 
						bind:this={cardElement}
						class="absolute inset-0 cursor-grab active:cursor-grabbing select-none touch-none"
						style="transform: translate({dragOffset.x}px, {dragOffset.y}px) rotate({rotation}deg); transition: {isDragging ? 'none' : 'transform 0.3s ease-out'}"
						onpointerdown={handlePointerDown}
						onpointermove={handlePointerMove}
						onpointerup={handlePointerUp}
						onpointercancel={handlePointerUp}
					>
						<Card class="h-full shadow-2xl">
							<CardContent class="h-full flex flex-col justify-center items-center p-6 relative">
								<!-- Like/Dislike indicators -->
								<div class="absolute top-4 left-4 opacity-{Math.max(0, dragOffset.x / 100)} text-green-500">
									<Heart class="h-12 w-12" />
								</div>
								<div class="absolute top-4 right-4 opacity-{Math.max(0, -dragOffset.x / 100)} text-red-500">
									<X class="h-12 w-12" />
								</div>

								<div class="text-8xl mb-6">{currentOption.image || '🎯'}</div>
								<h3 class="text-2xl font-bold text-center mb-2">{currentOption.title}</h3>
								{#if currentOption.description}
									<p class="text-gray-600 dark:text-gray-400 text-center mb-2">{currentOption.description}</p>
								{/if}
								
								<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
									<div class="text-xs text-gray-500 text-center">
										{currentIndex + 1} of {event.voteOptions.length}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex justify-center gap-8">
					<Button
						variant="outline"
						size="lg"
						onclick={() => handleVote('dislike')}
						class="w-16 h-16 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
					>
						{#snippet children()}
							<X class="h-8 w-8" />
						{/snippet}
					</Button>
					<Button
						variant="outline"
						size="lg"
						onclick={() => handleVote('like')}
						class="w-16 h-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
					>
						{#snippet children()}
							<Heart class="h-8 w-8" />
						{/snippet}
					</Button>
				</div>
			{:else}
				<!-- Results -->
				<div class="text-center">
					<h2 class="text-2xl font-bold mb-6">Voting Complete!</h2>
					
					<Card class="mb-6">
						<CardHeader>
							<CardTitle>Your Votes</CardTitle>
						</CardHeader>
						<CardContent>
							{@const summary = getVotesSummary()}
							<div class="grid grid-cols-2 gap-4 text-center mb-6">
								<div>
									<div class="text-2xl font-bold text-green-500">{summary.liked}</div>
									<div class="text-sm text-gray-600 dark:text-gray-400">Liked</div>
								</div>
								<div>
									<div class="text-2xl font-bold text-red-500">{summary.disliked}</div>
									<div class="text-sm text-gray-600 dark:text-gray-400">Disliked</div>
								</div>
							</div>

							<div class="space-y-3 mb-6">
								{#each event.voteOptions as option}
									<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
										<div class="flex items-center gap-3">
											<span class="text-2xl">{option.image || '🎯'}</span>
											<span class="font-medium">{option.title}</span>
										</div>
										<div>
											{#if votes[option.id] === 'like'}
												<Heart class="h-5 w-5 text-green-500" />
											{:else if votes[option.id] === 'dislike'}
												<X class="h-5 w-5 text-red-500" />
											{:else}
												<span class="text-gray-400 text-sm">Not voted</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>

							<div class="flex gap-3">
								<Button onclick={resetVoting} variant="outline" class="flex-1">
									{#snippet children()}
										Vote Again
									{/snippet}
								</Button>
								<Button onclick={submitVotes} disabled={isSubmitting} class="flex-1">
									{#snippet children()}
										{isSubmitting ? 'Submitting...' : 'Submit Votes'}
									{/snippet}
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.select-none {
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
</style> 