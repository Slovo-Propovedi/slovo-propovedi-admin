<script lang="ts">
  interface Props {
    page: number;
    pageCount: number;
    onPageChange?: (page: number) => void;
  }

  let { page, pageCount, onPageChange }: Props = $props();

  type PageItem = { type: 'page'; page: number } | { type: 'ellipsis'; key: string };

  // Pure windowing: always show the first and last page, a small window around
  // the current page, and ellipses for the gaps in between (1 … 4 5 6 … 12).
  function buildPageItems(current: number, total: number): PageItem[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => ({ type: 'page', page: index + 1 }));
    }
    const windowStart = Math.max(2, current - 1);
    const windowEnd = Math.min(total - 1, current + 1);
    const items: PageItem[] = [{ type: 'page', page: 1 }];
    if (windowStart > 2) items.push({ type: 'ellipsis', key: 'leading' });
    for (let p = windowStart; p <= windowEnd; p++) items.push({ type: 'page', page: p });
    if (windowEnd < total - 1) items.push({ type: 'ellipsis', key: 'trailing' });
    items.push({ type: 'page', page: total });
    return items;
  }

  let pageItems = $derived(buildPageItems(page, pageCount));
  let hasPrevious = $derived(page > 1);
  let hasNext = $derived(page < pageCount);

  function goTo(target: number): void {
    if (target < 1 || target > pageCount || target === page) return;
    onPageChange?.(target);
  }
</script>

{#if pageCount > 1}
  <nav class="pagination" aria-label="Пагинация">
    <button class="btn btn-ghost btn-sm" disabled={!hasPrevious} onclick={() => goTo(page - 1)}>
      ‹ Назад
    </button>

    {#each pageItems as item (item.type === 'page' ? item.page : item.key)}
      {#if item.type === 'ellipsis'}
        <span class="pagination-ellipsis" aria-hidden="true">…</span>
      {:else}
        <button
          class="pagination-page"
          class:current={item.page === page}
          aria-current={item.page === page ? 'page' : undefined}
          aria-label={`Страница ${item.page}`}
          onclick={() => goTo(item.page)}
        >
          {item.page}
        </button>
      {/if}
    {/each}

    <button class="btn btn-ghost btn-sm" disabled={!hasNext} onclick={() => goTo(page + 1)}>
      Вперёд ›
    </button>
  </nav>
{/if}
