<script lang="ts">
  import Icon from './Icon.svelte';

  let { message, onDismiss }: { message: string; onDismiss: () => void } = $props();

  // Re-arm the auto-dismiss timer whenever a new message arrives.
  $effect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, 3000);
    return () => window.clearTimeout(timer);
  });
</script>

{#if message}
  <div class="toast" role="alert">
    <Icon name="alert" size={16} />
    <span class="toast-message">{message}</span>
    <button class="toast-close" type="button" aria-label="Закрыть" onclick={onDismiss}>
      <Icon name="close" size={14} />
    </button>
  </div>
{/if}
