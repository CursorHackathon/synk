<script lang="ts">
	import { SpinnerGap, Eye, EyeSlash } from 'phosphor-svelte';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { authClient } from '$src/auth-client';

	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import SocialProviders from '../SocialProviders.svelte';

	let { form } = $props();

	let isLoading = $state(false);
	let isGithubLoading = $state(false);
	let isGoogleLoading = $state(false);
	let email = $state(form?.email || '');
	let password = $state(form?.password || '');
	let repeatPassword = $state(form?.repeatPassword || '');
	let passwordStrength = $state(0);
	let passwordStrengthText = $state('');
	let showPassword = $state(false);
	let showRepeatPassword = $state(false);

	let passwordMatchStatus = $derived(
		password.length > 0 && repeatPassword.length > 0
			? password === repeatPassword
				? 'matching'
				: 'not-matching'
			: 'none'
	);

	let isFormValid = $derived(
		email.length > 0 && passwordStrength >= 75 && passwordMatchStatus === 'matching'
	);

	// Calculate password strength
	function calculatePasswordStrength(pwd: string): { strength: number; text: string } {
		if (!pwd) return { strength: 0, text: '' };

		let score = 0;
		let feedback = [];

		// Length check
		if (pwd.length >= 8) {
			score += 25;
		} else {
			feedback.push('at least 8 characters');
		}

		// Uppercase check
		if (/[A-Z]/.test(pwd)) {
			score += 25;
		} else {
			feedback.push('uppercase letter');
		}

		// Lowercase check
		if (/[a-z]/.test(pwd)) {
			score += 25;
		} else {
			feedback.push('lowercase letter');
		}

		// Number or special character check
		if (/[\d\W]/.test(pwd)) {
			score += 25;
		} else {
			feedback.push('number or special character');
		}

		// Determine strength text
		let strengthText = '';
		if (score === 0) {
			strengthText = '';
		} else if (score <= 25) {
			strengthText = 'Weak';
		} else if (score <= 50) {
			strengthText = 'Fair';
		} else if (score <= 75) {
			strengthText = 'Good';
		} else {
			strengthText = 'Strong';
		}

		if (feedback.length > 0 && pwd.length > 0) {
			strengthText += ` - Add: ${feedback.join(', ')}`;
		}

		return { strength: score, text: strengthText };
	}

	// Watch for password changes to update strength
	$effect(() => {
		const result = calculatePasswordStrength(password);
		passwordStrength = result.strength;
		passwordStrengthText = result.text;
	});

	// Progressive enhancement: fallback client-side handler
	async function handleClientSignup() {
		if (!isFormValid) return;
		
		isLoading = true;
		try {
			const data = await authClient.signUp.email({
				email,
				password,
				name: email.split('@')[0]
			});
			
			if (!data.error) {
				toast.success('Successfully signed up');
				goto('/builder');
			} else {
				toast.error(data.error.message ?? 'Failed to sign up');
			}
		} catch (error) {
			console.error('Client signup error:', error);
			toast.error('An error occurred during signup');
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex w-full flex-col items-center justify-center gap-4" in:fly={{ y: -10 }}>
	{#if form?.error}
		<div class="w-full max-w-sm rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/30">
			{form.error}
		</div>
	{/if}

	<form 
		method="POST" 
		action="?/signup"
		class="flex w-full flex-col items-center justify-center gap-2"
		use:enhance={({ formElement, formData, action, cancel, submitter }) => {
			isLoading = true;
			
			// Client-side validation before submission
			if (passwordStrength < 75) {
				isLoading = false;
				toast.error('Password is not strong enough');
				cancel();
				return;
			}
			
			if (password !== repeatPassword) {
				isLoading = false;
				toast.error('Passwords do not match');
				cancel();
				return;
			}
			
			return async ({ result, update }) => {
				isLoading = false;
				
				if (result.type === 'failure') {
					toast.error('Sign up failed');
				} else if (result.type === 'redirect') {
					toast.success('Successfully signed up');
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
			<div class="relative">
				<Input
					id="password"
					name="password"
					placeholder="********"
					type={showPassword ? 'text' : 'password'}
					bind:value={password}
					class="pr-10"
					disabled={isLoading}
					required
				/>
				<button
					type="button"
					class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
					onclick={() => (showPassword = !showPassword)}
					disabled={isLoading}
				>
					{#if showPassword}
						<EyeSlash class="h-4 w-4" />
					{:else}
						<Eye class="h-4 w-4" />
					{/if}
				</button>
			</div>

			{#if password}
				<div class="space-y-2">
					<Progress value={passwordStrength} max={100} class="h-2 w-full" />
					{#if passwordStrengthText}
						<p
							class="text-xs"
							class:text-red-600={passwordStrength <= 50}
							class:text-yellow-600={passwordStrength > 50 && passwordStrength < 75}
							class:text-green-600={passwordStrength >= 75}
						>
							{passwordStrengthText}
						</p>
					{/if}
				</div>
			{/if}
		</div>
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label class="sr-only" for="repeat-password">Repeat Password</Label>
			<Label for="repeat-password" class="text-sm text-muted-foreground">Repeat Password</Label>
			<div class="relative">
				<Input
					id="repeat-password"
					name="repeatPassword"
					placeholder="********"
					type={showRepeatPassword ? 'text' : 'password'}
					bind:value={repeatPassword}
					class="pr-10"
					disabled={isLoading}
					required
				/>
				<button
					type="button"
					class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
					onclick={() => (showRepeatPassword = !showRepeatPassword)}
					disabled={isLoading}
				>
					{#if showRepeatPassword}
						<EyeSlash class="h-4 w-4" />
					{:else}
						<Eye class="h-4 w-4" />
					{/if}
				</button>
			</div>

			{#if passwordMatchStatus !== 'none'}
				<div class="flex items-center gap-1.5 text-xs">
					{#if passwordMatchStatus === 'matching'}
						<span class="text-green-600">✓ Passwords match</span>
					{:else if passwordMatchStatus === 'not-matching'}
						<span class="text-red-600">✗ Passwords do not match</span>
					{/if}
				</div>
			{/if}
		</div>

		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Button class="w-full" disabled={isLoading || !isFormValid} type="submit">
				{#if isLoading}
					<SpinnerGap class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Sign Up with Email
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
