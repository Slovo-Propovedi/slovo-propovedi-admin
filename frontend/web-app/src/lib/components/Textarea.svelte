<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  interface Props extends HTMLTextareaAttributes {
    label?: string;
    hint?: string;
    error?: string;
    value?: string;
  }

  // The `id` default is evaluated once per component instance, so the label
  // always points at the real textarea while an explicit `id` prop still wins.
  let { label, hint, error, value = $bindable(''), id = `textarea-${Math.random().toString(36).slice(2, 8)}`, ...rest }: Props = $props();
</script>

<div class="field">
  {#if label}
    <label class="field-label" for={id}>{label}</label>
  {/if}
  <textarea class="textarea" class:input-error={!!error} {id} bind:value {...rest}></textarea>
  {#if hint}
    <p class="field-hint">{hint}</p>
  {/if}
  {#if error}
    <p class="field-error">{error}</p>
  {/if}
</div>
