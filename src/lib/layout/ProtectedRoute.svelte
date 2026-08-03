<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getAuthState } from '$lib/auth/auth.svelte';
  import { navigate } from '$lib/router/router.svelte';
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';

  let { children }: { children: Snippet } = $props();

  const auth = getAuthState();

  $effect(() => {
    if (auth.isReady && !auth.user) navigate('/login');
  });
</script>

{#if !auth.isReady || !auth.user}
  <LoadingScreen />
{:else}
  {@render children()}
{/if}
