<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import SermonForm from '$lib/components/forms/SermonForm.svelte';
</script>

<div class="page-enter">
  <Breadcrumbs
    items={[
      { label: 'Проповеди', href: '/sermons' },
      { label: 'Загрузка проповеди' },
    ]}
  />
  <div class="page-header">
    <div>
      <h1>Новая проповедь</h1>
      <p class="page-subtitle">Загрузите аудио, текст и оформление проповеди.</p>
    </div>
  </div>
  <SermonForm mode="create" />
</div>
