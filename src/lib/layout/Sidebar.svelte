<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { getAuthState, logout } from '$lib/auth/auth.svelte';
  import { navigate, useRoute } from '$lib/router/router.svelte';

  const route = useRoute();
  const auth = getAuthState();

  const navItems = [
    { label: 'Главная', path: '/', icon: 'home' },
    { label: 'Разделы', path: '/sections', icon: 'sections' },
    { label: 'Плейлисты', path: '/playlists', icon: 'playlists' },
    { label: 'Проповеди', path: '/sermons', icon: 'sermons' },
    { label: 'Загрузить проповедь', path: '/sermons/upload', icon: 'upload' },
    { label: 'Пользователи', path: '/users', icon: 'users' },
  ] as const;

  let activePath = $derived(route.path);

  // Only the most specific matching item may be active, so /sermons/upload
  // highlights "Загрузить проповедь" without also highlighting "Проповеди".
  let activeItem = $derived(
    navItems
      .filter((item) => {
        if (item.path === '/') return activePath === '/';
        return activePath === item.path || activePath.startsWith(item.path + '/');
      })
      .sort((a, b) => b.path.length - a.path.length)[0]?.path,
  );

  function isActive(itemPath: string): boolean {
    return activeItem === itemPath;
  }

  let displayName = $derived(auth.user?.name || auth.user?.username || auth.user?.email || 'Администратор');
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
        <div class="sidebar-user-login">{auth.user?.username ?? ''}</div>
      </div>
    </div>
    <button class="btn btn-ghost btn-sm" onclick={logout}>Выйти</button>
  </div>
</aside>
