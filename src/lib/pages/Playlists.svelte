<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { getAllPlaylistsOptions } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import { navigate } from '$lib/router/router.svelte';
  import Button from '$lib/components/Button.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  const playlistsQuery = createQuery(() => getAllPlaylistsOptions());

  let playlists = $derived(playlistsQuery.data?.playlists ?? []);

  function openPlaylist(id: string): void {
    navigate(`/playlists/${id}`);
  }
</script>

<div class="page-enter">
  <div class="page-header">
    <div>
      <h1>Плейлисты</h1>
      <p class="page-subtitle">Подборки проповедей для разделов сайта.</p>
    </div>
    <div class="page-actions">
      <Button onclick={() => navigate('/playlists/create')}>
        <Icon name="plus" size={16} />
        Создать плейлист
      </Button>
    </div>
  </div>

  {#if playlistsQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if playlists.length === 0}
    <div class="card">
      <EmptyState
        icon="♫"
        title="Плейлистов пока нет"
        hint="Соберите проповеди в подборку, чтобы показывать их в разделах."
      >
        {#snippet action()}
          <Button onclick={() => navigate('/playlists/create')}>Создать плейлист</Button>
        {/snippet}
      </EmptyState>
    </div>
  {:else}
    <div class="list-grid stagger">
      {#each playlists as playlist}
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
              {#if playlist.sections?.length}
                · {playlist.sections.length} разделов
              {/if}
            </div>
          </div>
          <div class="list-item-actions">
            <span class="badge badge-gold">{playlist.sermons?.length ?? 0}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
