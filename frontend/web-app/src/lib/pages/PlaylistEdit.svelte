<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { getPlaylistByIdOptions } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import PlaylistForm from '$lib/components/forms/PlaylistForm.svelte';

  let { params = {} }: { params?: Record<string, string> } = $props();
  let id = $derived(params.id ?? '');

  const playlistQuery = createQuery(() => getPlaylistByIdOptions({ path: { id } }));
</script>

<div class="page-enter">
  <Breadcrumbs
    items={[
      { label: 'Плейлисты', href: '/playlists' },
      { label: 'Редактирование' },
    ]}
  />
  <div class="page-header">
    <div>
      <h1>Редактирование плейлиста</h1>
      <p class="page-subtitle">Обновите состав и оформление подборки.</p>
    </div>
  </div>

  {#if playlistQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if playlistQuery.data}
    <PlaylistForm mode="edit" {id} initial={playlistQuery.data} />
  {:else}
    <div class="card">
      <div class="card-body">Плейлист не найден.</div>
    </div>
  {/if}
</div>
