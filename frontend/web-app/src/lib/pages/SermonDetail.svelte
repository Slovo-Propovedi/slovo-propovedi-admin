<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    deleteSermonMutation,
    getSermonByIdOptions,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import { invalidateSermon } from '$lib/api/invalidate';
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

  const sermonQuery = createQuery(() => getSermonByIdOptions({ path: { id } }));
  const queryClient = useQueryClient();

  let sermon = $derived(sermonQuery.data);

  let isDeleteOpen = $state(false);
  let deleteError = $state('');

  const deleteMutation = createMutation(() => ({
    ...deleteSermonMutation(),
    onSuccess: () => {
      invalidateSermon(queryClient, id);
      navigate('/sermons');
    },
    onError: (error) => {
      deleteError = getErrorMessage(error);
    },
  }));

  function openPlaylist(playlistId: string): void {
    navigate(`/playlists/${playlistId}`);
  }
</script>

<div class="page-enter">
  <Breadcrumbs
    items={[
      { label: 'Проповеди', href: '/sermons' },
      { label: sermon?.title ?? 'Проповедь' },
    ]}
  />

  {#if sermonQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if sermon}
    <div class="detail-hero">
      {#if sermon.artwork}
        <img class="detail-hero-cover" src={sermon.artwork} alt="" />
      {:else}
        <div class="detail-hero-cover list-item-cover-placeholder">
          {sermon.title.slice(0, 1).toUpperCase()}
        </div>
      {/if}
      <div>
        <h1 class="detail-hero-title">{sermon.title}</h1>
        <p class="detail-hero-meta">
          {#if sermon.artist}{sermon.artist}{/if}
          {#if formatReference(sermon.book, sermon.chapter, sermon.verse) !== '—'}
            · {formatReference(sermon.book, sermon.chapter, sermon.verse)}
          {/if}
        </p>
      </div>
    </div>

    <div class="page-actions" style:margin-bottom="22px">
      <Button variant="ghost" onclick={() => navigate(`/sermons/${id}/edit`)}>
        <Icon name="edit" size={16} />
        Редактировать
      </Button>
      <Button variant="danger" onclick={() => (isDeleteOpen = true)}>
        <Icon name="trash" size={16} />
        Удалить
      </Button>
    </div>

    {#if sermon.description}
      <div class="card">
        <div class="card-header">
          <h2>Описание</h2>
        </div>
        <div class="card-body">
          <p style:margin="0">{sermon.description}</p>
        </div>
      </div>
    {/if}

    {#if sermon.audioUrl || sermon.youtubeUrl || sermon.textFileUrl}
      <div class="detail-section">
        <h3>Медиа</h3>
        <div class="card">
          <div class="card-body">
            {#if sermon.audioUrl}
              <audio class="audio-player" controls src={sermon.audioUrl} style:margin-bottom="14px"></audio>
            {/if}
            {#if sermon.youtubeUrl}
              <a class="btn btn-ghost" href={sermon.youtubeUrl} target="_blank" rel="noopener noreferrer" style:margin-bottom="10px">
                <Icon name="external" size={16} />
                Смотреть на YouTube
              </a>
            {/if}
            {#if sermon.textFileUrl}
              <a class="btn btn-ghost" href={sermon.textFileUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="external" size={16} />
                Открыть текст проповеди
              </a>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <div class="detail-section">
      <h3>Плейлисты ({sermon.playlists?.length ?? 0})</h3>
      {#if sermon.playlists && sermon.playlists.length > 0}
        <div class="list-grid">
          {#each sermon.playlists as playlist}
            <div
              class="card card-hover list-item"
              role="button"
              tabindex="0"
              onclick={() => openPlaylist(playlist.id)}
              onkeydown={(event) => {
                if (event.key === 'Enter') openPlaylist(playlist.id);
              }}
            >
              {#if playlist.artwork}
                <img class="list-item-cover" src={playlist.artwork} alt="" />
              {:else}
                <div class="list-item-cover list-item-cover-placeholder">
                  {playlist.title.slice(0, 1).toUpperCase()}
                </div>
              {/if}
              <div class="list-item-body">
                <div class="list-item-title">{playlist.title}</div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="card">
          <EmptyState icon="♫" title="Проповедь не в плейлистах" hint="Добавьте её в плейлист через редактирование." />
        </div>
      {/if}
    </div>
  {:else}
    <div class="card">
      <EmptyState icon="⚠" title="Проповедь не найдена" hint="Возможно, она была удалена." />
    </div>
  {/if}
</div>

<Modal
  title="Удалить проповедь?"
  open={isDeleteOpen}
  onClose={() => (isDeleteOpen = false)}
>
  <p>Проповедь «{sermon?.title ?? ''}» будет удалена без возможности восстановления.</p>
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
