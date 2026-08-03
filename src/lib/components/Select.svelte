<script lang="ts">
  import type { HTMLSelectAttributes } from 'svelte/elements';

  export interface SelectOption {
    value: string;
    label: string;
  }

  interface Props extends HTMLSelectAttributes {
    label?: string;
    hint?: string;
    error?: string;
    options: SelectOption[];
    value?: string;
  }

  // The `id` default is evaluated once per component instance, so the label
  // always points at the real select while an explicit `id` prop still wins.
  let { label, hint, error, options, value = $bindable(''), id = `select-${Math.random().toString(36).slice(2, 8)}`, ...rest }: Props = $props();
</script>

<div class="field">
  {#if label}
    <label class="field-label" for={id}>{label}</label>
  {/if}
  <select class="select" class:input-error={!!error} {id} bind:value {...rest}>
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  {#if hint}
    <p class="field-hint">{hint}</p>
  {/if}
  {#if error}
    <p class="field-error">{error}</p>
  {/if}
</div>
