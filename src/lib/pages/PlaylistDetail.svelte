<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    playlistControllerFindOneOptions,
    playlistControllerRemoveMutation,
    reorderSermonsInPlaylistMutation,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import type { PlaylistSermon } from '$lib/api/generated/types.gen';
  import { invalidatePlaylist } from '$lib/api/invalidate';
  import { hasOrderChanged } from '$lib/utils/arrayOrder';
  import { getErrorMessage } from '$lib/utils/errors';
  import { formatReference } from '$lib/utils/labels';
  import { navigate } from '$lib/router/router.svelte';
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import Button from '$lib/components/Button.svelte';
  import DndList from '$lib/components/DndList.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Toast from '$lib/components/Toast.svelte';

  let { params = {} }: { params?: Record<string, string> } = $props();
  let id = $derived(params.id ?? '');

  const playlistQuery = createQuery(() => playlistControllerFindOneOptions({ path: { id } }));
  const queryClient = useQueryClient();

  let playlist = $derived(playlistQuery.data);

  let isDeleteOpen = $state(false);
  let deleteError = $state('');

  // Local state shadows the playlist's sermons so reordering can be optimistic.
  let localSermons = $state<PlaylistSermon[]>([]);
  // The order captured before the current drag — the fallback on failure.
  let sermonsSnapshot = $state<PlaylistSermon[]>([]);
  // While dragging, the query result must not overwrite the in-flight order.
  let isDragging = $state(false);
  let reorderError = $state('');
  // The last query result adopted into local state. Adopting only on a new
  // reference prevents a stale refetch from flashing the list back to the
  // pre-drag order right after a successful reorder.
  let syncedSermons: PlaylistSermon[] | undefined;

  $effect(() => {
    const fresh = playlistQuery.data?.sermons;
    if (isDragging || fresh === syncedSermons) return;
    syncedSermons = fresh;
    localSermons = fresh ?? [];
  });

  const deleteMutation = createMutation(() => ({
    ...playlistControllerRemoveMutation(),
    onSuccess: () => {
      invalidatePlaylist(queryClient, id);
      navigate('/playlists');
    },
    onError: (error) => {
      deleteError = getErrorMessage(error);
    },
  }));

  const reorderSermons = createMutation(() => ({
    ...reorderSermonsInPlaylistMutation(),
    onSuccess: () => {
      isDragging = false;
      invalidatePlaylist(queryClient, id);
    },
    onError: (error) => {
      isDragging = false;
      localSermons = sermonsSnapshot;
      reorderError = getErrorMessage(error);
    },
  }));

  // Fires on every consider (live feedback) and once on finalize (persist).
  function handleReorder(newOrder: PlaylistSermon[], isFinalize: boolean): void {
    if (!isDragging) {
      isDragging = true;
      sermonsSnapshot = [...localSermons];
    }
    if (isFinalize && newOrder.length !== sermonsSnapshot.length) {
      // The drag never confirmed a drop position (e.g. an instant flick), so
      // the finalize array is missing the dragged item. Restore the pre-drag
      // order instead of sending a truncated list to the server.
      localSermons = sermonsSnapshot;
      isDragging = false;
      return;
    }
    localSermons = newOrder;
    if (!isFinalize) return;
    if (hasOrderChanged(sermonsSnapshot, newOrder)) {
      reorderSermons.mutate({
        body: { sermonIds: newOrder.map((sermon) => sermon.id) },
        path: { id },
      });
    } else {
      isDragging = false;
    }
  }

  function openSermon(sermonId: string): void {
    navigate(`/sermons/${sermonId}`);
  }
</script>

<div class="page-enter">
  <Breadcrumbs
    items={[
      { label: 'Плейлисты', href: '/playlists' },
      { label: playlist?.title ?? 'Плейлист' },
    ]}
  />

  {#if playlistQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if playlist}
    <div class="detail-hero">
      {#if playlist.artwork}
        <img class="detail-hero-cover" src={playlist.artwork} alt="" />
      {:else}
        <div class="detail-hero-cover list-item-cover-placeholder">
          {playlist.title.slice(0, 1).toUpperCase()}
        </div>
      {/if}
      <div>
        <h1 class="detail-hero-title">{playlist.title}</h1>
        {#if playlist.description}
          <p class="detail-hero-meta">{playlist.description}</p>
        {/if}
        <p class="detail-hero-meta">{localSermons.length} проповедей</p>
      </div>
    </div>

    <div class="page-actions" style:margin-bottom="22px">
      <Button variant="ghost" onclick={() => navigate(`/playlists/${id}/edit`)}>
        <Icon name="edit" size={16} />
        Редактировать
      </Button>
      <Button variant="danger" onclick={() => (isDeleteOpen = true)}>
        <Icon name="trash" size={16} />
        Удалить
      </Button>
    </div>

    <div class="detail-section">
      <h3>Проповеди плейлиста</h3>
      {#if localSermons.length > 0}
        <DndList class="list-grid stagger" items={localSermons} onReorder={handleReorder}>
          {#snippet children(sermon)}
            <div
              class="card card-hover list-item"
              role="button"
              tabindex="0"
              onclick={() => openSermon(sermon.id)}
              onkeydown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  openSermon(sermon.id);
                }
              }}
            >
              {#if sermon.artwork}
                <img class="list-item-cover" src={sermon.artwork} alt="" />
              {:else}
                <div class="list-item-cover list-item-cover-placeholder">
                  {sermon.title.slice(0, 1).toUpperCase()}
                </div>
              {/if}
              <div class="list-item-body">
                <div class="list-item-title">{sermon.title}</div>
                <div class="list-item-subtitle">
                  {sermon.artist || formatReference(sermon.book, sermon.chapter, sermon.verse)}
                </div>
              </div>
            </div>
          {/snippet}
        </DndList>
      {:else}
        <div class="card">
          <EmptyState icon="♪" title="Проповедей пока нет" hint="Добавьте проповеди в плейлист через редактирование." />
        </div>
      {/if}
    </div>
  {:else}
    <div class="card">
      <EmptyState icon="⚠" title="Плейлист не найден" hint="Возможно, он был удалён." />
    </div>
  {/if}

  {#if reorderError}
    <Toast message={reorderError} onDismiss={() => (reorderError = '')} />
  {/if}
</div>

<Modal
  title="Удалить плейлист?"
  open={isDeleteOpen}
  onClose={() => (isDeleteOpen = false)}
>
  <p>Плейлист «{playlist?.title ?? ''}» будет удалён без возможности восстановления.</p>
  {#if deleteError}
    <p class="field-error">{deleteError}</p>
  {/if}
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (isDeleteOpen = false)}>Отмена</Button>
    <Button
      variant="danger"
      loading={deleteMutation.isPending}
      onclick={() => deleteMutation.mutate({ path: { id } })}
    >
      Удалить
    </Button>
  {/snippet}
</Modal>
