<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    large?: boolean;
  }

  let { large = false, ...rest }: Props = $props();
</script>

<span class="spinner" class:spinner-lg={large} role="status" aria-label="Загрузка" {...rest}></span>
