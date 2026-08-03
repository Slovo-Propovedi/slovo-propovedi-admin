<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    hover?: boolean;
    actions?: Snippet;
    children?: Snippet;
  }

  let { title, hover = false, actions, children }: Props = $props();
</script>

<div class="card" class:card-hover={hover}>
  {#if title || actions}
    <div class="card-header">
      {#if title}
        <h2>{title}</h2>
      {/if}
      {#if actions}
        <div class="page-actions">{@render actions()}</div>
      {/if}
    </div>
  {/if}
  {#if children}
    <div class="card-body">{@render children()}</div>
  {/if}
</div>
