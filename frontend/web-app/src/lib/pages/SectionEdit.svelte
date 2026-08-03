<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { getSectionByIdOptions } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import SectionForm from '$lib/components/forms/SectionForm.svelte';

  let { params = {} }: { params?: Record<string, string> } = $props();
  let id = $derived(params.id ?? '');

  const sectionQuery = createQuery(() => getSectionByIdOptions({ path: { id } }));
</script>

<div class="page-enter">
  <Breadcrumbs
    items={[
      { label: 'Разделы', href: '/sections' },
      { label: 'Редактирование' },
    ]}
  />
  <div class="page-header">
    <div>
      <h1>Редактирование раздела</h1>
      <p class="page-subtitle">Изменения сразу отразятся на главной странице сайта.</p>
    </div>
  </div>

  {#if sectionQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if sectionQuery.data}
    <SectionForm mode="edit" {id} initial={sectionQuery.data} />
  {:else}
    <div class="card">
      <div class="card-body">Раздел не найден.</div>
    </div>
  {/if}
</div>
