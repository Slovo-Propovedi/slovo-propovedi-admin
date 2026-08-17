<script lang="ts">
  import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
  import { playlistControllerFindAllOptions } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import { navigate } from '$lib/router/router.svelte';
  import { debounce } from '$lib/utils/debounce';
  import Button from '$lib/components/Button.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Input from '$lib/components/Input.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import Pagination from '$lib/components/Pagination.svelte';

  const PAGE_LIMIT = 20;

  let searchInput = $state('');
  let debouncedTerm = $state('');
  let page = $state(1);

  // The query refetches only after the user pauses typing; an empty term sends
  // no `search` param, which keeps the full unfiltered list on first load.
  // A new search always restarts from the first page.
  const applySearch = debounce((value: string) => {
    debouncedTerm = value;
    page = 1;
  }, 300);

  const playlistsQuery = createQuery(() => ({
    ...playlistControllerFindAllOptions({
      query: { search: debouncedTerm || undefined, page, limit: PAGE_LIMIT },
    }),
    // Keep the previous page visible while the next one loads — no flicker.
    placeholderData: keepPreviousData,
  }));

  let playlists = $derived(playlistsQuery.data?.playlists ?? []);
  let totalCount = $derived(playlistsQuery.data?.count ?? 0);
  let pageCount = $derived(Math.max(1, Math.ceil(totalCount / PAGE_LIMIT)));

  function openPlaylist(id: string): void {
    navigate(`/playlists/${id}`);
  }

  function changePage(next: number): void {
    page = next;
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

  <Input
    label="Поиск"
    placeholder="Название, описание…"
    bind:value={searchInput}
    oninput={() => applySearch(searchInput)}
  />

  {#if playlistsQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if playlists.length === 0}
    {#if debouncedTerm !== '' && !playlistsQuery.isError}
      <div class="card">
        <EmptyState
          icon="♫"
          title="Ничего не найдено"
          hint={`По запросу «${debouncedTerm}» ничего не найдено`}
        />
      </div>
    {:else}
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
    {/if}
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

  <Pagination {page} {pageCount} onPageChange={changePage} />
</div>
