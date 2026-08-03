<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import {
    playlistControllerFindAllOptions,
    sectionControllerFindAllOptions,
    sermonControllerFindAllOptions,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import { getAuthState } from '$lib/auth/auth.svelte';
  import { navigate } from '$lib/router/router.svelte';
  import Icon from '$lib/components/Icon.svelte';

  const auth = getAuthState();

  const sectionsQuery = createQuery(() => sectionControllerFindAllOptions());
  const playlistsQuery = createQuery(() => playlistControllerFindAllOptions());
  const sermonsQuery = createQuery(() => sermonControllerFindAllOptions());

  let sectionCount = $derived(sectionsQuery.data?.sections?.length ?? null);
  let playlistCount = $derived(playlistsQuery.data?.playlists?.length ?? null);
  let sermonCount = $derived(sermonsQuery.data?.sermons?.length ?? null);

  let stats = $derived([
    { label: 'Разделы', path: '/sections', count: sectionCount },
    { label: 'Плейлисты', path: '/playlists', count: playlistCount },
    { label: 'Проповеди', path: '/sermons', count: sermonCount },
  ]);
</script>

<div class="page-enter">
  <div class="page-header">
    <div>
      <h1>Добро пожаловать{auth.user?.name ? `, ${auth.user.name}` : ''}</h1>
      <p class="page-subtitle">Управляйте разделами, плейлистами и проповедями сайта «Слово проповеди».</p>
    </div>
  </div>

  <div class="stats-grid stagger">
    {#each stats as stat}
      <a
        class="card card-hover stat-card"
        href={stat.path}
        onclick={(event) => {
          event.preventDefault();
          navigate(stat.path);
        }}
      >
        <div class="stat-card-number">{stat.count ?? '…'}</div>
        <div class="stat-card-label">{stat.label}</div>
      </a>
    {/each}
  </div>

  <div class="card">
    <div class="card-header">
      <h2>Быстрые действия</h2>
    </div>
    <div class="card-body stagger">
      <button class="btn btn-primary" onclick={() => navigate('/sections/create')}>
        <Icon name="plus" size={16} />
        Создать раздел
      </button>
      <button class="btn btn-ghost" style:margin-left="10px" onclick={() => navigate('/playlists/create')}>
        <Icon name="plus" size={16} />
        Создать плейлист
      </button>
      <button class="btn btn-ghost" style:margin-left="10px" onclick={() => navigate('/sermons/upload')}>
        <Icon name="upload" size={16} />
        Загрузить проповедь
      </button>
    </div>
  </div>
</div>
