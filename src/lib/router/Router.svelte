<script lang="ts">
  import { matchRoute, navigate, useRoute } from './router.svelte';
  import { getAuthState } from '$lib/auth/auth.svelte';
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
  import UploadSermon from '$lib/pages/UploadSermon.svelte';
  import SermonDetail from '$lib/pages/SermonDetail.svelte';
  import SermonEdit from '$lib/pages/SermonEdit.svelte';
  import Users from '$lib/pages/Users.svelte';
  import UserCreate from '$lib/pages/UserCreate.svelte';
  import UserDetail from '$lib/pages/UserDetail.svelte';
  import UserEdit from '$lib/pages/UserEdit.svelte';
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
    { pattern: '/sermons/upload', component: UploadSermon },
    { pattern: '/sermons/:id/edit', component: SermonEdit },
    { pattern: '/sermons/:id', component: SermonDetail },
    { pattern: '/sermons', component: Sermons },
    { pattern: '/users/create', component: UserCreate },
    { pattern: '/users/:id/edit', component: UserEdit },
    { pattern: '/users/:id', component: UserDetail },
    { pattern: '/users', component: Users },
  ];

  const route = useRoute();
  const auth = getAuthState();

  let match = $derived.by(() => {
    const currentPath = route.path;
    for (const route of routes) {
      const params = matchRoute(route.pattern, currentPath);
      if (params) return { ...route, params };
    }
    return null;
  });

  let isLogin = $derived(route.path === '/login');

  $effect(() => {
    if (match === null) navigate('/');
  });

  // The users domain is admin-only; a moderator must not linger on pages the
  // backend answers with 403. `forbidden` gates the render branch below so the
  // page never mounts for a non-admin, and this effect still performs the
  // redirect. A logged-out visitor is not forbidden — ProtectedRoute sends them
  // to /login instead — so the two redirects never race. The check waits for a
  // restored session so the guard never fires while the profile is loading.
  let isUsersPath = $derived(route.path === '/users' || route.path.startsWith('/users/'));
  let forbidden = $derived(
    auth.isReady && isUsersPath && auth.user !== null && auth.user.role !== 'admin',
  );

  $effect(() => {
    if (forbidden) navigate('/');
  });
</script>

{#if isLogin}
  <Login />
{:else if match && !forbidden}
  <ProtectedRoute>
    <Layout>
      <match.component params={match.params} />
    </Layout>
  </ProtectedRoute>
{/if}
