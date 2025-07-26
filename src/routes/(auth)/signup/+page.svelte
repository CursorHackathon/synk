<script lang="ts">
	import Signup from './Signup.svelte';
	
	let { data, form } = $props();
</script>

<Signup {form} />
