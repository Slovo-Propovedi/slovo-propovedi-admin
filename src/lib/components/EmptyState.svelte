<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    icon?: string;
    title: string;
    hint?: string;
    action?: Snippet;
  }

  let { icon = '✦', title, hint, action }: Props = $props();
</script>

<div class="empty-state">
  <div class="empty-state-icon">{icon}</div>
  <div class="empty-state-title">{title}</div>
  {#if hint}
    <div class="empty-state-hint">{hint}</div>
  {/if}
  {#if action}
    <div>{@render action()}</div>
  {/if}
</div>
