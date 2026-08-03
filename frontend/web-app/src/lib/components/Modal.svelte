<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    open?: boolean;
    onClose?: () => void;
    children?: Snippet;
    footer?: Snippet;
  }

  let { title, open = false, onClose, children, footer }: Props = $props();
</script>

{#if open}
  <div
    class="modal-backdrop"
    role="presentation"
    tabindex="-1"
    onclick={(event) => {
      if (event.target === event.currentTarget) onClose?.();
    }}
    onkeydown={(event) => {
      if (event.key === 'Escape') onClose?.();
    }}
  >
    <div class="modal" role="dialog" aria-modal="true" tabindex="-1">
      {#if title}
        <div class="modal-header">
          <h3>{title}</h3>
        </div>
      {/if}
      {#if children}
        <div class="modal-body">{@render children()}</div>
      {/if}
      {#if footer}
        <div class="modal-footer">{@render footer()}</div>
      {/if}
    </div>
  </div>
{/if}
