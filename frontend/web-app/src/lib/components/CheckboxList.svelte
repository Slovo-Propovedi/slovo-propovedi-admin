<script lang="ts">
  interface CheckboxOption {
    value: string;
    label: string;
    meta?: string;
  }

  interface Props {
    options: CheckboxOption[];
    selected: string[];
    onToggle?: (value: string) => void;
  }

  let { options = [], selected = [], onToggle }: Props = $props();
</script>

<div class="checkbox-list">
  {#each options as option (option.value)}
    <label class="checkbox-option" class:checked={selected.includes(option.value)}>
      <input
        type="checkbox"
        checked={selected.includes(option.value)}
        onchange={() => onToggle?.(option.value)}
      />
      <span>
        <span class="checkbox-option-label">{option.label}</span>
        {#if option.meta}
          <span class="checkbox-option-meta"> · {option.meta}</span>
        {/if}
      </span>
    </label>
  {/each}
</div>
