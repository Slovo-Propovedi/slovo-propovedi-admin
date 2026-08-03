<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { getAllSectionsOptions } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import { navigate } from '$lib/router/router.svelte';
  import { ITEMS_SIZE_LABELS, TRANSFORM_LABELS } from '$lib/utils/labels';
  import Button from '$lib/components/Button.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  const sectionsQuery = createQuery(() => getAllSectionsOptions());

  let sections = $derived(sectionsQuery.data?.sections ?? []);

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
  {:else if sections.length === 0}
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
    <div class="list-grid stagger">
      {#each sections as section}
        <div
          class="card card-hover list-item"
          role="button"
          tabindex="0"
          onclick={() => openSection(section.id)}
          onkeydown={(event) => {
            if (event.key === 'Enter') openSection(section.id);
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
      {/each}
    </div>
  {/if}
</div>
