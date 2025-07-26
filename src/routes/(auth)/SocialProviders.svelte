<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';

	import { SpinnerGap, GoogleLogo } from 'phosphor-svelte';

	let { 
		isGithubLoading = $bindable(), 
		isGoogleLoading = $bindable(),

		onGoogleResult = () => {}
	} = $props();
</script>

<div class="flex items-center justify-center gap-2">


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
