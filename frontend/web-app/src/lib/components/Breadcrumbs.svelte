<script lang="ts">
  import { navigate } from '$lib/router/router.svelte';

  interface Crumb {
    label: string;
    href?: string;
  }

  let { items }: { items: Crumb[] } = $props();
</script>

<nav class="breadcrumbs" aria-label="Хлебные крошки">
  {#each items as item, index (index)}
    {#if index > 0}
      <span class="breadcrumbs-sep">/</span>
    {/if}
    {#if item.href}
      <a
        href={item.href}
        onclick={(event) => {
          event.preventDefault();
          navigate(item.href!);
        }}
      >
        {item.label}
      </a>
    {:else}
      <span class="breadcrumbs-current">{item.label}</span>
    {/if}
  {/each}
</nav>
