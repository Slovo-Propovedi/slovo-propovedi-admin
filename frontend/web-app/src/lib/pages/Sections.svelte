<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    reorderSectionsMutation,
    sectionControllerFindAllOptions,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import type { SectionEntity } from '$lib/api/generated/types.gen';
  import { invalidateSection } from '$lib/api/invalidate';
  import { hasOrderChanged } from '$lib/utils/arrayOrder';
  import { getErrorMessage } from '$lib/utils/errors';
  import { navigate } from '$lib/router/router.svelte';
  import { ITEMS_SIZE_LABELS, TRANSFORM_LABELS } from '$lib/utils/labels';
  import Button from '$lib/components/Button.svelte';
  import DndList from '$lib/components/DndList.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import Toast from '$lib/components/Toast.svelte';

  const sectionsQuery = createQuery(() => sectionControllerFindAllOptions());
  const queryClient = useQueryClient();

  // Local state shadows the sections so reordering can be optimistic.
  let localSections = $state<SectionEntity[]>([]);
  // The order captured before the current drag — the fallback on failure.
  let sectionsSnapshot = $state<SectionEntity[]>([]);
  // While dragging, the query result must not overwrite the in-flight order.
  let isDragging = $state(false);
  let reorderError = $state('');
  // The last query result adopted into local state. Adopting only on a new
  // reference prevents a stale refetch from flashing the list back to the
  // pre-drag order right after a successful reorder.
  let syncedSections: SectionEntity[] | undefined;

  $effect(() => {
    const fresh = sectionsQuery.data?.sections;
    if (isDragging || fresh === syncedSections) return;
    syncedSections = fresh;
    localSections = fresh ?? [];
  });

  const reorderSections = createMutation(() => ({
    ...reorderSectionsMutation(),
    onSuccess: () => {
      isDragging = false;
      invalidateSection(queryClient);
    },
    onError: (error) => {
      isDragging = false;
      localSections = sectionsSnapshot;
      reorderError = getErrorMessage(error);
    },
  }));

  // Fires on every consider (live feedback) and once on finalize (persist).
  function handleReorder(newOrder: SectionEntity[], isFinalize: boolean): void {
    if (!isDragging) {
      isDragging = true;
      sectionsSnapshot = [...localSections];
    }
    if (isFinalize && newOrder.length !== sectionsSnapshot.length) {
      // The drag never confirmed a drop position (e.g. an instant flick), so
      // the finalize array is missing the dragged item. Restore the pre-drag
      // order instead of sending a truncated list to the server.
      localSections = sectionsSnapshot;
      isDragging = false;
      return;
    }
    localSections = newOrder;
    if (!isFinalize) return;
    if (hasOrderChanged(sectionsSnapshot, newOrder)) {
      reorderSections.mutate({
        body: { ids: newOrder.map((section) => section.id) },
      });
    } else {
      isDragging = false;
    }
  }

  function openSection(id: string): void {
    navigate(`/sections/${id}`);
  }
</script>

<div class="page-enter">
  <div class="page-header">
    <div>
      <h1>Разделы</h1>
      <p class="page-subtitle">Слайдеры главной страницы сайта.</p>
    </div>
    <div class="page-actions">
      <Button onclick={() => navigate('/sections/create')}>
        <Icon name="plus" size={16} />
        Создать раздел
      </Button>
    </div>
  </div>

  {#if sectionsQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if localSections.length === 0}
    <div class="card">
      <EmptyState
        icon="✦"
        title="Разделов пока нет"
        hint="Создайте первый раздел — он появится на главной странице сайта."
      >
        {#snippet action()}
          <Button onclick={() => navigate('/sections/create')}>Создать раздел</Button>
        {/snippet}
      </EmptyState>
    </div>
  {:else}
    <DndList class="list-grid stagger" items={localSections} onReorder={handleReorder}>
      {#snippet children(section)}
        <div
          class="card card-hover list-item"
          role="button"
          tabindex="0"
          onclick={() => openSection(section.id)}
          onkeydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              openSection(section.id);
            }
          }}
        >
          <div class="list-item-cover list-item-cover-placeholder">
            {section.title.slice(0, 1).toUpperCase()}
          </div>
          <div class="list-item-body">
            <div class="list-item-title">{section.title}</div>
            <div class="list-item-subtitle">
              {section.description || `${section.playlists?.length ?? 0} плейлистов`}
            </div>
          </div>
          <div class="list-item-actions">
            <span class="badge badge-gold">{ITEMS_SIZE_LABELS[section.itemsSize]}</span>
            <span class="badge badge-neutral">{TRANSFORM_LABELS[section.transform]}</span>
          </div>
        </div>
      {/snippet}
    </DndList>
  {/if}

  {#if reorderError}
    <Toast message={reorderError} onDismiss={() => (reorderError = '')} />
  {/if}
</div>
