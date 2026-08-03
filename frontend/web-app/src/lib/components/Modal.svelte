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

  let dialog: HTMLDivElement | undefined = $state();
  let lastFocused: HTMLElement | null = null;

  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  function getFocusableElements(): HTMLElement[] {
    if (!dialog) return [];
    return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (element) => !element.hasAttribute('hidden') && element.getClientRects().length > 0,
    );
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose?.();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  $effect(() => {
    if (!open) return;

    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.addEventListener('keydown', handleKeydown);

    // Move focus into the dialog (or its first focusable element) so the
    // keyboard user starts inside the modal.
    (getFocusableElements()[0] ?? dialog)?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      lastFocused?.focus();
      lastFocused = null;
    };
  });
</script>

{#if open}
  <div
    class="modal-backdrop"
    role="presentation"
    tabindex="-1"
    onclick={(event) => {
      if (event.target === event.currentTarget) onClose?.();
    }}
  >
    <div class="modal" role="dialog" aria-modal="true" aria-label={title} tabindex="-1" bind:this={dialog}>
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
