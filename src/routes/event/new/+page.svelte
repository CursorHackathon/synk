<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$src/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import { CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { toast } from 'svelte-sonner';

	const session = authClient.useSession();

	// Form state
	let title = $state('');
	let description = $state('');
	let date = $state('');
	let location = $state('');
	let maxAttendees = $state<number | undefined>(undefined);
	let emailInput = $state('');
	let emails = $state<string[]>([]);
	let isSubmitting = $state(false);

	// Add email to the list
	function addEmail() {
		const email = emailInput.trim().toLowerCase();
		
		if (!email) return;
		
		// Validate email format
		const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
		if (!emailRegex.test(email)) {
			toast.error('Please enter a valid email address');
			return;
		}
		
		// Check for duplicates
		if (emails.includes(email)) {
			toast.error('This email is already in the list');
			return;
		}
		
		emails = [...emails, email];
		emailInput = '';
		toast.success('Email added successfully');
	}

	// Remove email from the list
	function removeEmail(index: number) {
		emails = emails.filter((_, i) => i !== index);
		toast.success('Email removed');
	}

	// Add email on Enter key
	function handleEmailKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addEmail();
		}
	}

	// Submit the form
	async function handleSubmit() {
		if (!$session.data?.user?.id) {
			toast.error('You must be logged in to create an event');
			return;
		}

		if (!title.trim()) {
			toast.error('Event title is required');
			return;
		}

		if (!date) {
			toast.error('Event date is required');
			return;
		}

		if (emails.length === 0) {
			toast.error('Please add at least one email address');
			return;
		}

		isSubmitting = true;

		try {
			const response = await fetch('/api/events', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim() || undefined,
					date,
					location: location.trim() || undefined,
					maxAttendees: maxAttendees || undefined,
					emails
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create event');
			}

			toast.success(`Event created successfully! Code: ${result.event.eventCode}`);
			goto(`/event/${result.event.eventCode}`);
			
		} catch (error) {
			console.error('Error creating event:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to create event');
		} finally {
			isSubmitting = false;
		}
	}

	// Get today's date for min attribute
	const today = new Date().toISOString().split('T')[0];
</script>

<svelte:head>
	<title>Create New Event</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
	<div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Create New Event</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
				Set up your event and invite guests with email addresses
			</p>
		</div>

		<Card class="shadow-lg">
			<CardHeader>
				<CardTitle class="text-xl">Event Details</CardTitle>
				<CardDescription>Fill in the information about your event</CardDescription>
			</CardHeader>
			
			<CardContent class="space-y-6">
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
					<!-- Event Title -->
					<div class="space-y-2">
						<Label for="title">Event Title *</Label>
						<Input
							id="title"
							bind:value={title}
							placeholder="Enter event title"
							maxlength="200"
							required
						/>
					</div>

					<!-- Event Description -->
					<div class="space-y-2">
						<Label for="description">Description</Label>
						<textarea
							id="description"
							bind:value={description}
							placeholder="Describe your event (optional)"
							maxlength="1000"
							rows="3"
							class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						></textarea>
					</div>

					<!-- Date and Location Row -->
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="date">Event Date *</Label>
							<Input
								id="date"
								type="datetime-local"
								bind:value={date}
								min={today}
								required
							/>
						</div>

						<div class="space-y-2">
							<Label for="location">Location</Label>
							<Input
								id="location"
								bind:value={location}
								placeholder="Event location (optional)"
								maxlength="300"
							/>
						</div>
					</div>

					<!-- Max Attendees -->
					<div class="space-y-2">
						<Label for="maxAttendees">Maximum Attendees (optional)</Label>
						<Input
							id="maxAttendees"
							type="number"
							bind:value={maxAttendees}
							placeholder="Leave empty for unlimited"
							min="1"
						/>
					</div>

					<Separator />

					<!-- Email Management Section -->
					<div class="space-y-4">
						<div>
							<h3 class="text-lg font-medium text-gray-900 dark:text-white">Guest Email Addresses</h3>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								Add email addresses for people you want to invite
							</p>
						</div>

						<!-- Add Email Input -->
						<div class="flex gap-2">
							<Input
								bind:value={emailInput}
								placeholder="Enter email address"
								type="email"
								onkeydown={handleEmailKeydown}
								class="flex-1"
							/>
							<Button 
								type="button"
								onclick={addEmail}
								disabled={!emailInput.trim()}
								variant="outline"
							>
								Add Email
							</Button>
						</div>

						<!-- Email List -->
						{#if emails.length > 0}
							<div class="space-y-2">
								<Label>Added Emails ({emails.length})</Label>
								<div class="max-h-48 overflow-y-auto rounded-md border p-3">
									<div class="space-y-2">
										{#each emails as email, index}
											<div class="flex items-center justify-between rounded bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm">
												<span class="font-mono">{email}</span>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onclick={() => removeEmail(index)}
													class="h-6 w-6 p-0 text-red-500 hover:text-red-700"
												>
													<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
													</svg>
												</Button>
											</div>
										{/each}
									</div>
								</div>
							</div>
						{:else}
							<div class="rounded-md border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
								<svg class="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
								</svg>
								<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
									No email addresses added yet
								</p>
							</div>
						{/if}
					</div>

					<Separator />

					<!-- Submit Button -->
					<div class="flex gap-3">
						<Button
							type="button"
							variant="outline"
							onclick={() => goto('/')}
							class="flex-1"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || !title.trim() || !date || emails.length === 0}
							class="flex-1"
						>
							{isSubmitting ? 'Creating Event...' : 'Create Event'}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
</div> 