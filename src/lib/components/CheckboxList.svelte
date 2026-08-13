<script lang="ts" generics="T = unknown">
  import type { Snippet } from 'svelte';

  export interface CheckboxOption<T = unknown> {
    value: string;
    label: string;
    meta?: string;
    // Optional domain object a caller attaches so its `item` snippet can
    // render the raw record instead of only the label/meta strings.
    data?: T;
  }

  interface Props<T> {
    options: CheckboxOption<T>[];
    selected: string[];
    onToggle?: (value: string) => void;
    // When provided, renders each row's content instead of the default
    // label/meta spans. The checkbox + label wrapper stay unchanged, so
    // toggling keeps working with a rich row.
    item?: Snippet<[CheckboxOption<T>]>;
  }

  let { options = [], selected = [], onToggle, item }: Props<T> = $props();
</script>

<div class="checkbox-list">
  {#each options as option (option.value)}
    <label class="checkbox-option" class:checked={selected.includes(option.value)}>
      <input
        type="checkbox"
        checked={selected.includes(option.value)}
        onchange={() => onToggle?.(option.value)}
      />
      {#if item}
        {@render item(option)}
      {:else}
        <span>
          <span class="checkbox-option-label">{option.label}</span>
          {#if option.meta}
            <span class="checkbox-option-meta"> · {option.meta}</span>
          {/if}
        </span>
      {/if}
    </label>
  {/each}
</div>
