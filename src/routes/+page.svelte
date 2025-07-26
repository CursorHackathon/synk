<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';

	import { DoorOpen, Ticket } from 'phosphor-svelte';

	import { goto } from '$app/navigation';

	let rsvpCode = $state('');

	function handleRsvp() {
		if (rsvpCode.trim()) {
			goto(`/event/${rsvpCode.trim()}`);
		}
	}

</script>

<div
	class="landing-page container mx-auto flex min-h-screen w-screen flex-col items-center justify-start gap-20 border-black px-4 py-16"
>
	<!-- Hero Section -->
	<div class="flex max-w-5xl flex-col items-center justify-center gap-8 text-center">
		<!-- Main Title -->
		<div class="space-y-4">
			<h1
				class="text-8xl font-black tracking-tight text-gray-900 dark:text-white md:text-9xl lg:text-[12rem]"
			>
				synk
			</h1>
			<h2
				class="text-2xl font-light tracking-wide text-gray-700 dark:text-gray-300 md:text-3xl lg:text-4xl"
			>
				Event Management, Simplified
			</h2>
		</div>

		<!-- Subtitle -->
		<p
			class="mx-auto max-w-3xl text-lg font-light leading-relaxed text-gray-600 dark:text-gray-300 md:text-xl"
		>
			Create memorable events and manage RSVPs with ease. Whether you're hosting or attending, we've
			got you covered with our streamlined platform.
		</p>

		<!-- Key Features -->
		<div class="mt-8 flex flex-wrap justify-center gap-6">
			<div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
				<div class="h-2 w-2 rounded-full bg-black dark:bg-white"></div>
				Instant Event Creation
			</div>
			<div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
				<div class="h-2 w-2 rounded-full bg-black dark:bg-white"></div>
				Smart RSVP Tracking
			</div>
			<div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
				<div class="h-2 w-2 rounded-full bg-black dark:bg-white"></div>
				Real-time Analytics
			</div>
		</div>
	</div>

	<!-- Get Started Section -->
	<div class="flex max-w-2xl flex-col items-center justify-center gap-8">
		<Button
			onclick={() => goto('/login')}
			variant="default"
			size="lg"
			class="h-14 bg-black px-16 py-4 text-lg font-medium text-white shadow-lg transition-all duration-300 hover:bg-gray-800 hover:shadow-xl dark:bg-white dark:text-black dark:hover:bg-gray-200"
		>
			<DoorOpen size={28} />
			Get Started
		</Button>

		<!-- RSVP Option -->
		<div class="w-full text-center">
			<div
				class="inline-block rounded-2xl border border-gray-200 bg-white/60 px-8 py-6 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/60"
			>
				<p class="mb-6 text-lg font-medium text-gray-600 dark:text-gray-400">
					Already have an event code?
				</p>
				<div class="mx-auto flex max-w-md gap-3">
					<Input
						bind:value={rsvpCode}
						placeholder="Enter event code"
						class="h-12 border-2 bg-white/80 text-center font-mono text-lg tracking-wider focus:border-gray-400 dark:bg-gray-800/80 dark:focus:border-gray-500"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								handleRsvp();
							}
						}}
					/>
					<Button
						onclick={handleRsvp}
						disabled={!rsvpCode.trim()}
						variant="outline"
						class="h-12 border-2 border-gray-300 bg-white/80 px-6 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800/80 dark:hover:border-gray-500"
					>
						RSVP
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	:global(body:has(.landing-page)) {
		@apply min-h-screen;
		position: relative;
	}

	:global(body:has(.landing-page)::before) {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: url('/wh.jpg');
		opacity: 0;
		animation: fadeInBackground 0.5s ease-in-out 0.3s forwards;
		z-index: -1;
	}

	@keyframes fadeInBackground {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
