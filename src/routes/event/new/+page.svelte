<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$src/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import { CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { toast } from 'svelte-sonner';
	import { Plus, X } from 'lucide-svelte';

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

	// Voting state
	let hasVoting = $state(false);
	let voteOptions = $state<Array<{id: string; title: string; description: string; image: string}>>([]);
	let optionTitle = $state('');
	let optionDescription = $state('');
	let optionImage = $state('');

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

	// Add voting option
	function addVoteOption() {
		if (!optionTitle.trim()) {
			toast.error('Option title is required');
			return;
		}

		const newOption = {
			id: Date.now().toString(),
			title: optionTitle.trim(),
			description: optionDescription.trim(),
			image: optionImage.trim() || '🎯'
		};

		voteOptions = [...voteOptions, newOption];
		optionTitle = '';
		optionDescription = '';
		optionImage = '';
		toast.success('Vote option added');
	}

	// Remove voting option
	function removeVoteOption(index: number) {
		voteOptions = voteOptions.filter((_, i) => i !== index);
		toast.success('Vote option removed');
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

		if (hasVoting && voteOptions.length === 0) {
			toast.error('Please add at least one voting option');
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
					emails,
					hasVoting,
					voteOptions: hasVoting ? voteOptions : []
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
							maxlength={200}
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
							maxlength={1000}
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
								maxlength={300}
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
							min={1}
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
								{#snippet children()}
									Add Email
								{/snippet}
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
													{#snippet children()}
														<X class="h-4 w-4" />
													{/snippet}
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

					<!-- Voting Section -->
					<div class="space-y-4">
						<div class="flex items-center space-x-2">
							<Checkbox 
								id="hasVoting" 
								bind:checked={hasVoting}
							/>
							<Label for="hasVoting" class="text-lg font-medium">
								Enable Voting
							</Label>
						</div>
						
						{#if hasVoting}
							<div class="space-y-4 pl-6">
								<p class="text-sm text-gray-600 dark:text-gray-400">
									Add options for guests to vote on using a swipe interface
								</p>

								<!-- Add Option Form -->
								<div class="space-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
									<div class="grid gap-3 md:grid-cols-3">
										<Input
											bind:value={optionTitle}
											placeholder="Option title *"
											maxlength={200}
										/>
										<Input
											bind:value={optionDescription}
											placeholder="Description (optional)"
											maxlength={500}
										/>
										<Input
											bind:value={optionImage}
											placeholder="Emoji (e.g. 🍕)"
											maxlength={10}
										/>
									</div>
									<Button 
										type="button"
										onclick={addVoteOption}
										disabled={!optionTitle.trim()}
										size="sm"
										variant="outline"
									>
										{#snippet children()}
											<Plus class="h-4 w-4 mr-2" />
											Add Option
										{/snippet}
									</Button>
								</div>

								<!-- Options List -->
								{#if voteOptions.length > 0}
									<div class="space-y-2">
										<Label>Vote Options ({voteOptions.length})</Label>
										<div class="space-y-2">
											{#each voteOptions as option, index}
												<div class="flex items-center justify-between p-3 border rounded-lg">
													<div class="flex items-center gap-3">
														<span class="text-2xl">{option.image}</span>
														<div>
															<p class="font-medium">{option.title}</p>
															{#if option.description}
																<p class="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
															{/if}
														</div>
													</div>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onclick={() => removeVoteOption(index)}
														class="text-red-500 hover:text-red-700"
													>
														{#snippet children()}
															<X class="h-4 w-4" />
														{/snippet}
													</Button>
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
										No voting options added yet
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<Separator />

					<!-- Submit Button -->
					<div class="flex gap-3">
						<Button
							type="button"
							variant="outline"
							onclick={() => goto('/dash')}
							class="flex-1"
						>
							{#snippet children()}
								Cancel
							{/snippet}
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || !title.trim() || !date || emails.length === 0 || (hasVoting && voteOptions.length === 0)}
							class="flex-1"
						>
							{#snippet children()}
								{isSubmitting ? 'Creating Event...' : 'Create Event'}
							{/snippet}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
</div> 