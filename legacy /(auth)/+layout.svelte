<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	import { Command } from 'phosphor-svelte';

	// Preload critical resources for better performance
	onMount(() => {
		// Prefetch the builder page that users will likely navigate to
		if (typeof window !== 'undefined') {
			const link = document.createElement('link');
			link.rel = 'prefetch';
			link.href = '/builder';
			document.head.appendChild(link);
		}
	});

	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<!-- Critical CSS for above-the-fold content -->
<svelte:head>
	<style>
		/* Inline critical CSS for faster rendering */
		.auth-container {
			position: relative;
			margin: 0 auto;
			height: 100vh;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			display: grid;
			padding-left: 0;
			padding-right: 0;
		}

		@media (min-width: 1280px) {
			.auth-container {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}
		}

		.auth-bg {
			position: relative;
			display: none;
			height: 100%;
			width: 100%;
			flex-grow: 1;
			flex-direction: column;
			background-color: hsl(var(--muted));
			padding: 2.5rem;
			color: white;
		}

		@media (min-width: 1280px) {
			.auth-bg {
				display: flex;
			}
		}
	</style>
</svelte:head>

<div class="auth-container">
	<div class="auth-bg dark:border-r">
		<div
			class="absolute inset-0 bg-cover object-contain"
			style="background-image: url('/AuthBg.jpg');"
		></div>
		<!-- Top overlay -->
		<div
			class="absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black/60 to-transparent"
		></div>
		<!-- Bottom overlay -->
		<div
			class="absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-black/60 to-transparent"
		></div>
		<div class="relative z-20 flex items-center text-lg font-medium">
			<Command class="mr-2 h-6 w-6" />
			Synk
		</div>
		<div class="relative z-20 mt-auto">
			<blockquote class="space-y-2">
				<p class="text-lg">&ldquo;Vibe more , sync less &rdquo;</p>
				<footer class="text-sm">Synk</footer>
			</blockquote>
		</div>
	</div>
	<div class="container flex h-full w-full items-center justify-center lg:p-8">
		<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
			<div class="flex flex-col space-y-2 text-center">
				{#if page.url.pathname === '/login'}
					<h1 class="text-2xl font-light leading-relaxed">Welcome Back</h1>
				{:else}
					<h1 class="text-2xl font-light leading-relaxed">Create an account</h1>
				{/if}
			</div>

			{#key page}
				{@render children?.()}
			{/key}

			<span>
				<p class="px-8 text-center text-sm text-muted-foreground">
					{#if page.url.pathname === '/login'}
						Don't have an account? <a href="/signup" class="underline">Sign up</a>
					{:else}
						Already have an account? <a href="/login" class="underline">Login</a>
					{/if}
				</p>
			</span>

			<span class="flex flex-col gap-2">
				<span class="flex flex-col gap-2">
					<p class="px-8 text-center text-sm text-muted-foreground">
						By proceeding, you confirm that you agree with our <a href="/TOS" class="underline"
							>Terms of Service</a
						>
						and <a href="/PP" class="underline">Privacy Policy</a>
					</p>
				</span>
			</span>
		</div>
	</div>
</div>
