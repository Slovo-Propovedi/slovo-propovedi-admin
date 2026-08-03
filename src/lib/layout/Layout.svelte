<script lang="ts">
  import type { Snippet } from 'svelte';
  import Sidebar from './Sidebar.svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="app-layout">
  <Sidebar />
  <main class="app-main">
    {@render children()}
  </main>
</div>
