<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { sermonControllerFindOneOptions } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import SermonForm from '$lib/components/forms/SermonForm.svelte';

  let { params = {} }: { params?: Record<string, string> } = $props();
  let id = $derived(params.id ?? '');

  const sermonQuery = createQuery(() => sermonControllerFindOneOptions({ path: { id } }));
</script>

<div class="page-enter">
  <Breadcrumbs
    items={[
      { label: 'Проповеди', href: '/sermons' },
      { label: 'Редактирование' },
    ]}
  />
  <div class="page-header">
    <div>
      <h1>Редактирование проповеди</h1>
      <p class="page-subtitle">Обновите аудио, текст и оформление проповеди.</p>
    </div>
  </div>

  {#if sermonQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if sermonQuery.data}
    <SermonForm mode="edit" {id} initial={sermonQuery.data} />
  {:else}
    <div class="card">
      <div class="card-body">Проповедь не найдена.</div>
    </div>
  {/if}
</div>
