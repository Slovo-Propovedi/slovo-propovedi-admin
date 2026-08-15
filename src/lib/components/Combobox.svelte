<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    label?: string;
    hint?: string;
    error?: string;
    options: string[];
    value?: string;
  }

  // The `id` default is evaluated once per component instance, so the label
  // always points at the real input while an explicit `id` prop still wins.
  let {
    label,
    hint,
    error,
    options = [],
    value = $bindable(''),
    id = `combobox-${Math.random().toString(36).slice(2, 8)}`,
    ...rest
  }: Props = $props();

  let listId = $derived(`${id}-list`);
  const optionId = (index: number): string => `${id}-option-${index}`;

  let isOpen = $state(false);
  let activeIndex = $state(-1);
  let rootEl: HTMLDivElement | undefined = $state();

  // Case-insensitive substring match with case-insensitive dedupe: Postgres
  // DISTINCT is case-sensitive, so «Иоанна» and «иоанна» would otherwise
  // show up as two separate matches for the same term.
  let filteredOptions = $derived.by(() => {
    const term = value.trim().toLowerCase();
    const seen = new Set<string>();
    const matches: string[] = [];
    for (const option of options) {
      const key = option.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (term === '' || key.includes(term)) matches.push(option);
    }
    return matches;
  });

  // The listbox only exists when there is something to show; an empty options
  // list or a no-match term keeps the control a plain input.
  let isListVisible = $derived(isOpen && filteredOptions.length > 0);

  function closeDropdown(): void {
    isOpen = false;
    activeIndex = -1;
  }

  function selectOption(option: string): void {
    value = option;
    closeDropdown();
  }

  function handleFocus(): void {
    isOpen = true;
    activeIndex = -1;
  }

  function handleInput(event: Event): void {
    value = (event.currentTarget as HTMLInputElement).value;
    activeIndex = -1;
    isOpen = true;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        isOpen = true;
        activeIndex = -1;
      }
      if (filteredOptions.length > 0) {
        activeIndex = (activeIndex + 1) % filteredOptions.length;
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        isOpen = true;
        activeIndex = 0;
      }
      if (filteredOptions.length > 0) {
        activeIndex = activeIndex <= 0 ? filteredOptions.length - 1 : activeIndex - 1;
      }
      return;
    }

    if (event.key === 'Enter') {
      // Enter with an open dropdown and a highlighted option selects it and
      // prevents the form from submitting mid-navigation. With the dropdown
      // closed (or nothing highlighted) the form submits natively.
      if (isOpen && activeIndex >= 0) {
        const option = filteredOptions[activeIndex];
        if (option !== undefined) {
          event.preventDefault();
          selectOption(option);
        }
      }
      return;
    }

    if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault();
        closeDropdown();
      }
      return;
    }

    if (event.key === 'Home' && isOpen) {
      event.preventDefault();
      if (filteredOptions.length > 0) activeIndex = 0;
      return;
    }

    if (event.key === 'End' && isOpen) {
      event.preventDefault();
      if (filteredOptions.length > 0) activeIndex = filteredOptions.length - 1;
    }
  }

  // Close when clicking anywhere outside the control. The click itself keeps
  // its natural target (another field, a button), so focus is not stolen.
  $effect(() => {
    if (!isOpen) return;
    function onPointerDown(event: PointerEvent): void {
      const target = event.target;
      if (rootEl && target instanceof Node && !rootEl.contains(target)) {
        closeDropdown();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  });
</script>

<div class="field" bind:this={rootEl}>
  {#if label}
    <label class="field-label" for={id}>{label}</label>
  {/if}
  <div class="combobox">
    <input
      {...rest}
      class="input"
      class:input-error={!!error}
      {id}
      role="combobox"
      aria-expanded={isListVisible}
      aria-controls={isListVisible ? listId : undefined}
      aria-activedescendant={isListVisible && activeIndex >= 0 ? optionId(activeIndex) : undefined}
      autocomplete="off"
      value={value}
      onfocus={handleFocus}
      oninput={handleInput}
      onkeydown={handleKeydown}
    />
    {#if isListVisible}
      <ul class="combobox-list" id={listId} role="listbox" aria-label={label ?? 'Список вариантов'}>
        {#each filteredOptions as option, index (option)}
          <li
            id={optionId(index)}
            role="option"
            aria-selected={activeIndex === index}
            class="combobox-option"
            class:combobox-option-active={activeIndex === index}
            onmouseenter={() => {
              activeIndex = index;
            }}
            onmousedown={(event) => {
              event.preventDefault();
              selectOption(option);
            }}
          >{option}</li>
        {/each}
      </ul>
    {/if}
  </div>
  {#if hint}
    <p class="field-hint">{hint}</p>
  {/if}
  {#if error}
    <p class="field-error">{error}</p>
  {/if}
</div>
