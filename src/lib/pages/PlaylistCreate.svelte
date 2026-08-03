<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import PlaylistForm from '$lib/components/forms/PlaylistForm.svelte';
</script>

<div class="page-enter">
  <Breadcrumbs
    items={[
      { label: 'Плейлисты', href: '/playlists' },
      { label: 'Создание плейлиста' },
    ]}
  />
  <div class="page-header">
    <div>
      <h1>Новый плейлист</h1>
      <p class="page-subtitle">Соберите проповеди в тематическую подборку.</p>
    </div>
  </div>
  <PlaylistForm mode="create" />
</div>
