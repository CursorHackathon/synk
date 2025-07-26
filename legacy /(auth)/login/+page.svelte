<script lang="ts">
	import Signin from './Signin.svelte';
	
	let { data, form } = $props();
</script>

<Signin {form} />