<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    playlistControllerRemoveMutation,
    playlistControllerFindOneOptions,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import { invalidatePlaylist } from '$lib/api/invalidate';
  import { getErrorMessage } from '$lib/utils/errors';
  import { formatReference } from '$lib/utils/labels';
  import { navigate } from '$lib/router/router.svelte';
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import Button from '$lib/components/Button.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let { params = {} }: { params?: Record<string, string> } = $props();
  let id = $derived(params.id ?? '');

  const playlistQuery = createQuery(() => playlistControllerFindOneOptions({ path: { id } }));
  const queryClient = useQueryClient();

  let playlist = $derived(playlistQuery.data);

  let isDeleteOpen = $state(false);
  let deleteError = $state('');

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
        <p class="detail-hero-meta">{playlist.sermons?.length ?? 0} проповедей</p>
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
      {#if playlist.sermons && playlist.sermons.length > 0}
        <div class="list-grid stagger">
          {#each playlist.sermons as sermon}
            <div
              class="card card-hover list-item"
              role="button"
              tabindex="0"
              onclick={() => openSermon(sermon.id)}
              onkeydown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
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
          {/each}
        </div>
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
