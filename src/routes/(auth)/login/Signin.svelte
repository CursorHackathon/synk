<script lang="ts">
	import { SpinnerGap } from 'phosphor-svelte';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { authClient } from '$src/auth-client';

	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import SocialProviders from '../SocialProviders.svelte';

	let { form } = $props();

	let isLoading = $state(false);
	let isGithubLoading = $state(false);
	let isGoogleLoading = $state(false);
	let email = $state(form?.email || '');
	let password = $state('');

	// Form validation
	let isFormValid = $derived(
		email.length > 0 && password.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	);

	// Progressive enhancement: fallback client-side handler
	async function handleClientSignin() {
		if (!isFormValid) return;
		
		isLoading = true;
		try {
			const { data, error } = await authClient.signIn.email({
				email,
				password,
				callbackURL: `${window.location.origin}/dash`
			});

			if (error) {
				toast.error(error.message ?? 'Failed to sign in');
			} else {
				toast.success('Successfully signed in');
				goto('/dash');
			}
		} catch (error) {
			console.error('Client signin error:', error);
			toast.error('An error occurred during sign in');
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex w-full flex-col items-center justify-center gap-4" in:fly={{ y: 10 }}>
	{#if form?.error}
		<div class="w-full max-w-sm rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/30">
			{form.error}
		</div>
	{/if}

	<form 
		method="POST" 
		action="?/signin"
		class="flex w-full flex-col items-center justify-center gap-2"
		use:enhance={({ formElement, formData, action, cancel, submitter }) => {
			isLoading = true;
			
			return async ({ result, update }) => {
				isLoading = false;
				
				if (result.type === 'failure') {
					toast.error('Sign in failed');
				} else if (result.type === 'redirect') {
					toast.success('Successfully signed in');
					// Let SvelteKit handle the redirect naturally
				}
				
				await update({ reset: false });
			};
		}}
	>
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label class="sr-only" for="email">Email</Label>
			<Label for="email" class="text-sm text-muted-foreground">Email</Label>
			<Input
				id="email"
				name="email"
				placeholder="name@gmail.com"
				type="email"
				bind:value={email}
				autocapitalize="none"
				autocomplete="email"
				autocorrect="off"
				disabled={isLoading}
				required
			/>
		</div>
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label class="sr-only" for="password">Password</Label>
			<Label for="password" class="text-sm text-muted-foreground">Password</Label>
			<Input
				id="password"
				name="password"
				placeholder="********"
				type="password"
				bind:value={password}
				disabled={isLoading}
				required
			/>
		</div>
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Button
				type="submit"
				class="w-full"
				disabled={isLoading || !isFormValid}
			>
				{#if isLoading}
					<SpinnerGap class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Sign In with Email
			</Button>
		</div>
	</form>

	<div class="relative w-full max-w-sm">
		<div class="absolute inset-0 flex items-center">
			<span class="w-full border-t"></span>
		</div>
		<div class="relative flex justify-center text-xs uppercase">
			<span class="bg-background px-2 text-muted-foreground"> Or continue with </span>
		</div>
	</div>

	<SocialProviders 
		bind:isGithubLoading 
		bind:isGoogleLoading 
		onGithubResult={(result: any) => {
			if (result.type === 'redirect') {
				window.location.href = result.location;
			} else if (result.type === 'failure') {
				toast.error('GitHub authentication failed');
			}
		}}
		onGoogleResult={(result: any) => {
			if (result.type === 'redirect') {
				window.location.href = result.location;
			} else if (result.type === 'failure') {
				toast.error('Google authentication failed');
			}
		}}
	/>

	<!-- Fallback for enhanced UX when JavaScript is available -->
	<noscript>
		<style>
			.js-only { display: none; }
		</style>
	</noscript>
</div>
