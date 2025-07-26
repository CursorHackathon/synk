<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { toast } from 'svelte-sonner';
  
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Settings } from 'lucide-svelte';

  interface ProfileData {
    name?: string;
    email: string;
    createdAt: string;
  }

  let profile = $state<ProfileData | null>(null);
  let loading = $state(true);

  onMount(async () => {
    await loadProfile();
  });

  async function loadProfile() {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        profile = {
          name: data.name,
          email: data.email,
          createdAt: data.createdAt
        };
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      loading = false;
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>Settings - Synk</title>
</svelte:head>

<div class="container mx-auto py-6 space-y-6">
  <div class="flex items-center gap-2">
    <Settings class="h-6 w-6" />
    <h1 class="text-3xl font-bold">Settings</h1>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <span class="ml-2">Loading...</span>
    </div>
  {:else if profile}
    <!-- Profile Information -->
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Your account details</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium">Name</label>
            <p class="text-sm text-muted-foreground">{profile.name || 'Not provided'}</p>
          </div>
          <div>
            <label class="text-sm font-medium">Email</label>
            <p class="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <div>
            <label class="text-sm font-medium">Member Since</label>
            <p class="text-sm text-muted-foreground">{formatDate(profile.createdAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  {:else}
    <div class="text-center py-12">
      <p class="text-muted-foreground">Failed to load profile</p>
      <Button variant="outline" onclick={loadProfile} class="mt-4">
        {#snippet children()}
          Try Again
        {/snippet}
      </Button>
    </div>
  {/if}
</div> 