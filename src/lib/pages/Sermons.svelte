<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { sermonControllerFindAllOptions } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import { navigate } from '$lib/router/router.svelte';
  import { debounce } from '$lib/utils/debounce';
  import { sermonSubtitle } from '$lib/utils/labels';
  import Button from '$lib/components/Button.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Input from '$lib/components/Input.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  let searchInput = $state('');
  let debouncedTerm = $state('');

  // The query refetches only after the user pauses typing; an empty term sends
  // no `search` param, which keeps the full unfiltered list on first load.
  const applySearch = debounce((value: string) => {
    debouncedTerm = value;
  }, 300);

  const sermonsQuery = createQuery(() =>
    sermonControllerFindAllOptions({ query: { search: debouncedTerm || undefined } }),
  );

  let sermons = $derived(sermonsQuery.data?.sermons ?? []);

  function openSermon(id: string): void {
    navigate(`/sermons/${id}`);
  }
</script>

<div class="page-enter">
  <div class="page-header">
    <div>
      <h1>Проповеди</h1>
      <p class="page-subtitle">Все аудиозаписи и тексты, доступные на сайте.</p>
    </div>
    <div class="page-actions">
      <Button onclick={() => navigate('/sermons/upload')}>
        <Icon name="upload" size={16} />
        Загрузить проповедь
      </Button>
    </div>
  </div>

  <Input
    label="Поиск"
    placeholder="Название, проповедник, книга…"
    bind:value={searchInput}
    oninput={() => applySearch(searchInput)}
  />

  {#if sermonsQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if sermons.length === 0}
    <div class="card">
      <EmptyState
        icon="♪"
        title="Проповедей пока нет"
        hint="Загрузите первую проповедь — она появится в библиотеке сайта."
      >
        {#snippet action()}
          <Button onclick={() => navigate('/sermons/upload')}>Загрузить проповедь</Button>
        {/snippet}
      </EmptyState>
    </div>
  {:else}
    <div class="list-grid stagger">
      {#each sermons as sermon}
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
            <div class="list-item-subtitle">{sermonSubtitle(sermon)}</div>
          </div>
          <div class="list-item-actions">
            {#if sermon.audioUrl}
              <span class="badge badge-gold">аудио</span>
            {/if}
            {#if sermon.youtubeUrl}
              <span class="badge badge-neutral">youtube</span>
            {/if}
            {#if sermon.textFileUrl}
              <span class="badge badge-neutral">текст</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
