<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import LoadingSpinner from './LoadingSpinner.svelte';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    block?: boolean;
    children?: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    loading = false,
    block = false,
    children,
    disabled = false,
    ...rest
  }: Props = $props();
</script>

<button
  class="btn"
  class:btn-primary={variant === 'primary'}
  class:btn-ghost={variant === 'ghost'}
  class:btn-danger={variant === 'danger'}
  class:btn-sm={size === 'sm'}
  class:btn-lg={size === 'lg'}
  class:btn-block={block}
  disabled={disabled || loading}
  {...rest}
>
  {#if loading}
    <LoadingSpinner class="btn-spinner" />
  {/if}
  {@render children?.()}
</button>
