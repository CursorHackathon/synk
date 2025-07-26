<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$components/ui/button';
	import { toast } from 'svelte-sonner';
	import { SpinnerGap, GithubLogo, GoogleLogo } from 'phosphor-svelte';

	let { 
		isGithubLoading = $bindable(), 
		isGoogleLoading = $bindable(),
		onGithubResult = () => {},
		onGoogleResult = () => {}
	} = $props();
</script>

<div class="flex items-center justify-center gap-2">
	<!-- GitHub Auth Form -->
	<form
		method="POST"
		action="?/github"
		class="contents"
		use:enhance={({ cancel }) => {
			isGithubLoading = true;
			return async ({ result, update }) => {
				isGithubLoading = false;
				
				// Call the callback function with the result
				onGithubResult(result);
				
				// Only update if it's not a redirect (since we're handling redirects manually)
				if (result.type !== 'redirect') {
					await update();
				}
			};
		}}
	>
		<Button variant="outline" type="submit" disabled={isGithubLoading || isGoogleLoading}>
			{#if isGithubLoading}
				<SpinnerGap class="mr-2 h-4 w-4 animate-spin" />
			{:else}
				<GithubLogo class="mr-2 h-4 w-4" />
			{/if}
			GitHub
		</Button>
	</form>

	<!-- Google Auth Form -->
	<form
		method="POST"
		action="?/google"
		class="contents"
		use:enhance={({ cancel }) => {
			isGoogleLoading = true;
			return async ({ result, update }) => {
				isGoogleLoading = false;
				
				// Call the callback function with the result
				onGoogleResult(result);
				
				// Only update if it's not a redirect (since we're handling redirects manually)
				if (result.type !== 'redirect') {
					await update();
				}
			};
		}}
	>
		<Button variant="outline" type="submit" disabled={isGithubLoading || isGoogleLoading}>
			{#if isGoogleLoading}
				<SpinnerGap class="mr-2 h-4 w-4 animate-spin" />
			{:else}
				<GoogleLogo class="mr-2 h-4 w-4" />
			{/if}
			Google
		</Button>
	</form>
</div>
