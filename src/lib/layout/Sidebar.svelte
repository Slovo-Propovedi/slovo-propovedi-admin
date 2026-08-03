<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { getAuthState, logout } from '$lib/auth/auth.svelte';
  import { navigate, useRoute } from '$lib/router/router.svelte';

  const { path } = useRoute();
  const auth = getAuthState();

  const navItems = [
    { label: 'Главная', path: '/', icon: 'home' },
    { label: 'Разделы', path: '/sections', icon: 'sections' },
    { label: 'Плейлисты', path: '/playlists', icon: 'playlists' },
    { label: 'Проповеди', path: '/sermons', icon: 'sermons' },
    { label: 'Загрузить проповедь', path: '/sermons/upload', icon: 'upload' },
  ] as const;

  let activePath = $derived(path);

  function isActive(itemPath: string): boolean {
    if (itemPath === '/') return activePath === '/';
    return activePath.startsWith(itemPath);
  }

  let displayName = $derived(auth.user?.name || auth.user?.email || 'Администратор');
  let initials = $derived(displayName.slice(0, 2).toUpperCase());
</script>

<aside class="sidebar">
  <a
    class="sidebar-logo"
    href="/"
    onclick={(event) => {
      event.preventDefault();
      navigate('/');
    }}
  >
    <img src="/assets/icon.png" alt="Слово проповеди" />
    <div>
      <div class="sidebar-logo-title">Слово проповеди</div>
      <div class="sidebar-logo-sub">Админ-панель</div>
    </div>
  </a>

  <nav class="sidebar-nav">
    {#each navItems as item}
      <a
        class="sidebar-link"
        class:active={isActive(item.path)}
        href={item.path}
        onclick={(event) => {
          event.preventDefault();
          navigate(item.path);
        }}
      >
        <Icon class="sidebar-link-icon" name={item.icon} />
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>

  <div class="sidebar-footer">
    <div class="sidebar-user">
      <div class="sidebar-user-avatar">{initials}</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name">{displayName}</div>
        <div class="sidebar-user-email">{auth.user?.email ?? ''}</div>
      </div>
    </div>
    <button class="btn btn-ghost btn-sm" onclick={logout}>Выйти</button>
  </div>
</aside>
