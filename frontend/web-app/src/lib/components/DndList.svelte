<script lang="ts" generics="T extends { id: string }">
  import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Snippet } from 'svelte';

  interface Props<T> {
    items: T[];
    flipDurationMs?: number;
    // Called on every consider (live visual feedback) and on finalize
    // (isFinalize = true, when the parent should persist the order).
    onReorder: (newOrder: T[], isFinalize: boolean) => void;
    children: Snippet<[T]>;
    class?: string;
  }

  let {
    items,
    flipDurationMs = 200,
    onReorder,
    children,
    class: className = '',
  }: Props<T> = $props();

  // svelte-dnd-action inserts a shadow placeholder into the items array while
  // dragging (issue #661 with Svelte 5 runes). Strip it everywhere so it never
  // leaks into the parent's state or into the rendered list, and so the parent
  // never holds a reference to an array the library keeps mutating.
  function stripShadow(list: T[]): T[] {
    return list.filter((item) => item.id !== SHADOW_PLACEHOLDER_ITEM_ID);
  }

  function handleConsider(event: CustomEvent<DndEvent<T>>): void {
    onReorder(stripShadow(event.detail.items), false);
  }

  function handleFinalize(event: CustomEvent<DndEvent<T>>): void {
    onReorder(stripShadow(event.detail.items), true);
  }
</script>

<section
  class={className}
  use:dndzone={{
    items,
    flipDurationMs,
    // The cards inside are clickable (they navigate), so the zone and its
    // wrappers must not add tab stops that shadow the card's own focus.
    zoneTabIndex: -1,
    zoneItemTabIndex: -1,
    dropTargetClasses: ['dnd-drop-target'],
  }}
  onconsider={handleConsider}
  onfinalize={handleFinalize}
>
  {#each stripShadow(items) as item (item.id)}
    <div class="dnd-item" animate:flip={{ duration: flipDurationMs }}>
      {@render children(item)}
    </div>
  {/each}
</section>
