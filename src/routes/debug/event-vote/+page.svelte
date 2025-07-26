<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import { CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { ThumbsUp, ThumbsDown, ArrowLeft, Heart, X } from 'phosphor-svelte';
	import { goto } from '$app/navigation';

	interface Movie {
		id: string;
		title: string;
		description: string;
		image: string;
		year: number;
	}

	const movies: Movie[] = [
		{
			id: '1',
			title: 'Avengers: Endgame',
			description: 'The culmination of the Marvel Cinematic Universe',
			image: '🦸‍♂️',
			year: 2019
		},
		{
			id: '2',
			title: 'Wolverine',
			description: 'The story of Logan and his adamantium claws',
			image: '🐺',
			year: 2017
		},
		{
			id: '3',
			title: 'Spider-Man: No Way Home',
			description: 'Multiple Spider-Men unite across universes',
			image: '🕷️',
			year: 2021
		},
		{
			id: '4',
			title: 'Black Panther',
			description: 'The king of Wakanda protects his nation',
			image: '🐾',
			year: 2018
		},
		{
			id: '5',
			title: 'Iron Man',
			description: 'Tony Stark becomes the armored Avenger',
			image: '🤖',
			year: 2008
		}
	];

	let currentIndex = $state(0);
	let votes = $state<{ [key: string]: 'like' | 'dislike' }>({});
	let isDragging = $state(false);
	let dragOffset = $state({ x: 0, y: 0 });
	let rotation = $state(0);
	let cardElement: HTMLElement;

	let startPosition = { x: 0, y: 0 };
	const swipeThreshold = 100;

	let currentMovie = $derived(movies[currentIndex]);
	let isComplete = $derived(currentIndex >= movies.length);

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
		rotation = deltaX * 0.1; // Subtle rotation based on horizontal movement
	}

	function handlePointerUp() {
		if (!isDragging) return;
		isDragging = false;

		const absX = Math.abs(dragOffset.x);
		
		if (absX > swipeThreshold) {
			const direction = dragOffset.x > 0 ? 'like' : 'dislike';
			handleVote(direction);
		} else {
			// Snap back
			dragOffset = { x: 0, y: 0 };
			rotation = 0;
		}
	}

	function handleVote(vote: 'like' | 'dislike') {
		if (currentMovie) {
			votes[currentMovie.id] = vote;
		}
		
		// Animate out
		const direction = vote === 'like' ? 1 : -1;
		dragOffset = { x: direction * 300, y: -50 };
		rotation = direction * 30;
		
		setTimeout(() => {
			currentIndex++;
			dragOffset = { x: 0, y: 0 };
			rotation = 0;
		}, 300);
	}

	function handleLike() {
		handleVote('like');
	}

	function handleDislike() {
		handleVote('dislike');
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

<div class="container mx-auto px-4 py-8 max-w-md">
	<!-- Header -->
	<div class="mb-8 text-center">
		<Button 
			variant="ghost" 
			onclick={() => goto('/debug')}
			class="mb-4"
		>
			<ArrowLeft size={20} />
			Back to Debug
		</Button>
		<h1 class="text-3xl font-bold mb-2">Movie Night Vote</h1>
		<p class="text-gray-600 dark:text-gray-400">Swipe right to like, left to dislike</p>
	</div>

	{#if !isComplete}
		<!-- Voting Interface -->
		<div class="relative h-[500px] mb-8">
			<!-- Next card (background) -->
			{#if currentIndex + 1 < movies.length}
				<div class="absolute inset-0 transform scale-95 opacity-50">
					<Card class="h-full">
						<CardContent class="h-full flex flex-col justify-center items-center p-6">
							<div class="text-6xl mb-4">{movies[currentIndex + 1].image}</div>
							<h3 class="text-xl font-semibold text-center">{movies[currentIndex + 1].title}</h3>
						</CardContent>
					</Card>
				</div>
			{/if}

			<!-- Current card -->
			<div 
				bind:this={cardElement}
				class="absolute inset-0 cursor-grab active:cursor-grabbing select-none touch-none"
				style="transform: translate({dragOffset.x}px, {dragOffset.y}px) rotate({rotation}deg); transition: {isDragging ? 'none' : 'transform 0.3s ease-out'}"
				on:pointerdown={handlePointerDown}
				on:pointermove={handlePointerMove}
				on:pointerup={handlePointerUp}
				on:pointercancel={handlePointerUp}
			>
				<Card class="h-full shadow-2xl">
					<CardContent class="h-full flex flex-col justify-center items-center p-6 relative">
						<!-- Like/Dislike indicators -->
						<div class="absolute top-4 left-4 opacity-{Math.max(0, dragOffset.x / 100)} text-green-500">
							<Heart size={48} weight="fill" />
						</div>
						<div class="absolute top-4 right-4 opacity-{Math.max(0, -dragOffset.x / 100)} text-red-500">
							<X size={48} weight="bold" />
						</div>

						<div class="text-8xl mb-6">{currentMovie.image}</div>
						<h3 class="text-2xl font-bold text-center mb-2">{currentMovie.title}</h3>
						<p class="text-gray-600 dark:text-gray-400 text-center mb-2">{currentMovie.description}</p>
						<span class="text-sm text-gray-500">{currentMovie.year}</span>
						
						<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
							<div class="text-xs text-gray-500 text-center">
								{currentIndex + 1} of {movies.length}
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
				onclick={handleDislike}
				class="w-16 h-16 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
			>
				<X size={28} weight="bold" />
			</Button>
			<Button
				variant="outline"
				size="lg"
				onclick={handleLike}
				class="w-16 h-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
			>
				<Heart size={28} weight="fill" />
			</Button>
		</div>
	{:else}
		<!-- Results -->
		<div class="text-center">
			<h2 class="text-2xl font-bold mb-6">Voting Complete!</h2>
			
			<Card class="mb-6">
				<CardHeader>
					<CardTitle>Results Summary</CardTitle>
				</CardHeader>
				<CardContent>
					{@const summary = getVotesSummary()}
					<div class="grid grid-cols-2 gap-4 text-center">
						<div>
							<div class="text-2xl font-bold text-green-500">{summary.liked}</div>
							<div class="text-sm text-gray-600 dark:text-gray-400">Liked</div>
						</div>
						<div>
							<div class="text-2xl font-bold text-red-500">{summary.disliked}</div>
							<div class="text-sm text-gray-600 dark:text-gray-400">Disliked</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<div class="space-y-3 mb-6">
				{#each movies as movie}
					<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<div class="flex items-center gap-3">
							<span class="text-2xl">{movie.image}</span>
							<span class="font-medium">{movie.title}</span>
						</div>
						<div>
							{#if votes[movie.id] === 'like'}
								<Heart size={20} weight="fill" class="text-green-500" />
							{:else if votes[movie.id] === 'dislike'}
								<X size={20} weight="bold" class="text-red-500" />
							{:else}
								<span class="text-gray-400 text-sm">Not voted</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<Button onclick={resetVoting} class="w-full">
				Vote Again
			</Button>
		</div>
	{/if}
</div>

<style>
	/* Disable text selection on the draggable card */
	.select-none {
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
</style> 