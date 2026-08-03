<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    sectionControllerRemoveMutation,
    sectionControllerFindOneOptions,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import { invalidateSection } from '$lib/api/invalidate';
  import { getErrorMessage } from '$lib/utils/errors';
  import {
    ITEMS_SIZE_LABELS,
    SLIDE_TITLE_LOCATION_LABELS,
    TRANSFORM_LABELS,
  } from '$lib/utils/labels';
  import { navigate } from '$lib/router/router.svelte';
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import Button from '$lib/components/Button.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let { params = {} }: { params?: Record<string, string> } = $props();
  let id = $derived(params.id ?? '');

  const sectionQuery = createQuery(() => sectionControllerFindOneOptions({ path: { id } }));
  const queryClient = useQueryClient();

  let section = $derived(sectionQuery.data);

  let isDeleteOpen = $state(false);
  let deleteError = $state('');

  const deleteMutation = createMutation(() => ({
    ...sectionControllerRemoveMutation(),
    onSuccess: () => {
      invalidateSection(queryClient, id);
      navigate('/sections');
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
      { label: 'Разделы', href: '/sections' },
      { label: section?.title ?? 'Раздел' },
    ]}
  />

  {#if sectionQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if section}
    <div class="page-header">
      <div>
        <h1>{section.title}</h1>
        {#if section.description}
          <p class="page-subtitle">{section.description}</p>
        {/if}
      </div>
      <div class="page-actions">
        <Button variant="ghost" onclick={() => navigate(`/sections/${id}/edit`)}>
          <Icon name="edit" size={16} />
          Редактировать
        </Button>
        <Button variant="danger" onclick={() => (isDeleteOpen = true)}>
          <Icon name="trash" size={16} />
          Удалить
        </Button>
      </div>
    </div>

    <div class="detail-grid stagger">
      <div class="detail-stat">
        <div class="detail-stat-label">Размер карточек</div>
        <div class="detail-stat-value">{ITEMS_SIZE_LABELS[section.itemsSize]}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Высота</div>
        <div class="detail-stat-value">{TRANSFORM_LABELS[section.transform]}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Заголовок</div>
        <div class="detail-stat-value">{SLIDE_TITLE_LOCATION_LABELS[section.whereIsSlideTitleLocated ?? 'on']}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Строк</div>
        <div class="detail-stat-value">{section.itemsRows ?? '—'}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Крупный заголовок</div>
        <div class="detail-stat-value">{section.isDescriptionTitleOnSlideLarge ? 'Да' : 'Нет'}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Скруглённые углы</div>
        <div class="detail-stat-value">{section.borderRadius ? 'Да' : 'Нет'}</div>
      </div>
    </div>

    <div class="detail-section">
      <h3>Плейлисты раздела ({section.playlists?.length ?? 0})</h3>
      {#if section.playlists && section.playlists.length > 0}
        <div class="list-grid">
          {#each section.playlists as playlist}
            <div
              class="card card-hover list-item"
              role="button"
              tabindex="0"
              onclick={() => openPlaylist(playlist.id)}
              onkeydown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openPlaylist(playlist.id);
                }
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
                <div class="list-item-subtitle">
                  {playlist.sermons?.length ?? 0} проповедей
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="card">
          <EmptyState icon="♫" title="Плейлистов пока нет" hint="Добавьте плейлисты в этот раздел через редактирование." />
        </div>
      {/if}
    </div>
  {:else}
    <div class="card">
      <EmptyState icon="⚠" title="Раздел не найден" hint="Возможно, он был удалён." />
    </div>
  {/if}
</div>

<Modal
  title="Удалить раздел?"
  open={isDeleteOpen}
  onClose={() => (isDeleteOpen = false)}
>
  <p>Раздел «{section?.title ?? ''}» будет удалён без возможности восстановления.</p>
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
