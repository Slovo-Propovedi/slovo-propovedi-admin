<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  interface Props extends HTMLTextareaAttributes {
    label?: string;
    hint?: string;
    error?: string;
    value?: string;
  }

  let { label, hint, error, value = $bindable(''), id, ...rest }: Props = $props();

  let fieldId = $derived(id ?? `textarea-${Math.random().toString(36).slice(2, 8)}`);
</script>

<div class="field">
  {#if label}
    <label class="field-label" for={fieldId}>{label}</label>
  {/if}
  <textarea class="textarea" class:input-error={!!error} {id} bind:value {...rest}></textarea>
  {#if hint}
    <p class="field-hint">{hint}</p>
  {/if}
  {#if error}
    <p class="field-error">{error}</p>
  {/if}
</div>
