<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    label?: string;
    hint?: string;
    error?: string;
    value?: string;
  }

  // The `id` default is evaluated once per component instance, so the label
  // always points at the real input while an explicit `id` prop still wins.
  let { label, hint, error, value = $bindable(''), id = `input-${Math.random().toString(36).slice(2, 8)}`, ...rest }: Props = $props();
</script>

<div class="field">
  {#if label}
    <label class="field-label" for={id}>{label}</label>
  {/if}
  <input class="input" class:input-error={!!error} {id} bind:value {...rest} />
  {#if hint}
    <p class="field-hint">{hint}</p>
  {/if}
  {#if error}
    <p class="field-error">{error}</p>
  {/if}
</div>
