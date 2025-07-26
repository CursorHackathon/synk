<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import { CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Bug, Slideshow } from 'phosphor-svelte';
	import { goto } from '$app/navigation';
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-8 text-center">
		<div class="flex items-center justify-center gap-3 mb-4">
			<Bug size={32} class="text-orange-500" />
			<h1 class="text-4xl font-bold">Debug Routes</h1>
		</div>
		<p class="text-gray-600 dark:text-gray-400">Testing UI components and interactions</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<Card class="cursor-pointer hover:shadow-lg transition-shadow">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Slideshow size={24} />
					Event Vote
				</CardTitle>
				<CardDescription>
					Test Tinder-like swipe gestures for voting on event options
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button 
					onclick={() => goto('/debug/event-vote')}
					class="w-full"
				>
					Open Test
				</Button>
			</CardContent>
		</Card>

		<!-- Placeholder for future debug routes -->
		<Card class="opacity-50">
			<CardHeader>
				<CardTitle>Coming Soon</CardTitle>
				<CardDescription>More debug routes will be added here</CardDescription>
			</CardHeader>
		</Card>

		<Card class="opacity-50">
			<CardHeader>
				<CardTitle>Coming Soon</CardTitle>
				<CardDescription>More debug routes will be added here</CardDescription>
			</CardHeader>
		</Card>
	</div>
</div> 