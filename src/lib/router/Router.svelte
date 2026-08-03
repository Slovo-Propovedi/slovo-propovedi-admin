<script lang="ts">
  import { matchRoute, navigate, useRoute } from './router.svelte';
  import ProtectedRoute from '$lib/layout/ProtectedRoute.svelte';
  import Layout from '$lib/layout/Layout.svelte';
  import Login from '$lib/pages/Login.svelte';
  import Home from '$lib/pages/Home.svelte';
  import Sections from '$lib/pages/Sections.svelte';
  import SectionCreate from '$lib/pages/SectionCreate.svelte';
  import SectionDetail from '$lib/pages/SectionDetail.svelte';
  import SectionEdit from '$lib/pages/SectionEdit.svelte';
  import Playlists from '$lib/pages/Playlists.svelte';
  import PlaylistCreate from '$lib/pages/PlaylistCreate.svelte';
  import PlaylistDetail from '$lib/pages/PlaylistDetail.svelte';
  import PlaylistEdit from '$lib/pages/PlaylistEdit.svelte';
  import Sermons from '$lib/pages/Sermons.svelte';
  import SermonCreate from '$lib/pages/UploadSermon.svelte';
  import SermonDetail from '$lib/pages/SermonDetail.svelte';
  import SermonEdit from '$lib/pages/SermonEdit.svelte';
  import type { Component } from 'svelte';

  interface RouteEntry {
    pattern: string;
    component: Component;
  }

  // Order matters: static segments are matched before dynamic ones.
  const routes: RouteEntry[] = [
    { pattern: '/login', component: Login },
    { pattern: '/', component: Home },
    { pattern: '/sections/create', component: SectionCreate },
    { pattern: '/sections/:id/edit', component: SectionEdit },
    { pattern: '/sections/:id', component: SectionDetail },
    { pattern: '/sections', component: Sections },
    { pattern: '/playlists/create', component: PlaylistCreate },
    { pattern: '/playlists/:id/edit', component: PlaylistEdit },
    { pattern: '/playlists/:id', component: PlaylistDetail },
    { pattern: '/playlists', component: Playlists },
    { pattern: '/sermons/upload', component: SermonCreate },
    { pattern: '/sermons/:id/edit', component: SermonEdit },
    { pattern: '/sermons/:id', component: SermonDetail },
    { pattern: '/sermons', component: Sermons },
  ];

  const { path } = useRoute();

  let match = $derived.by(() => {
    const currentPath = path;
    for (const route of routes) {
      const params = matchRoute(route.pattern, currentPath);
      if (params) return { ...route, params };
    }
    return null;
  });

  let isLogin = $derived(path === '/login');

  $effect(() => {
    if (match === null) navigate('/');
  });
</script>

{#if isLogin}
  <Login />
{:else if match}
  <ProtectedRoute>
    <Layout>
      <match.component params={match.params} />
    </Layout>
  </ProtectedRoute>
{/if}
