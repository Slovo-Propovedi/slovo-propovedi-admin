<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import SectionForm from '$lib/components/forms/SectionForm.svelte';
</script>

<div class="page-enter">
  <Breadcrumbs
    items={[
      { label: 'Разделы', href: '/sections' },
      { label: 'Создание раздела' },
    ]}
  />
  <div class="page-header">
    <div>
      <h1>Новый раздел</h1>
      <p class="page-subtitle">Раздел — это слайдер с плейлистами на главной странице.</p>
    </div>
  </div>
  <SectionForm mode="create" />
</div>
