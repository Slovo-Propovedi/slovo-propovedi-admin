<script lang="ts">
  import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
  import { usersControllerFindAllOptions } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import { getErrorMessage } from '$lib/utils/errors';
  import { ROLE_LABELS } from '$lib/utils/labels';
  import { navigate } from '$lib/router/router.svelte';
  import { debounce } from '$lib/utils/debounce';
  import Button from '$lib/components/Button.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Input from '$lib/components/Input.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import Pagination from '$lib/components/Pagination.svelte';

  const PAGE_LIMIT = 20;

  let searchInput = $state('');
  let debouncedTerm = $state('');
  let page = $state(1);

  // The endpoint exposes no search param, so filtering stays client-side after
  // a short pause. It operates on the currently loaded page only — the hint
  // under the input says so, and pagination moves between full pages.
  const applySearch = debounce((value: string) => {
    debouncedTerm = value;
  }, 300);

  const usersQuery = createQuery(() => ({
    ...usersControllerFindAllOptions({ query: { page, limit: PAGE_LIMIT } }),
    // Keep the previous page visible while the next one loads — no flicker.
    placeholderData: keepPreviousData,
  }));

  let users = $derived(usersQuery.data?.users ?? []);
  let totalCount = $derived(usersQuery.data?.count ?? 0);
  let pageCount = $derived(Math.max(1, Math.ceil(totalCount / PAGE_LIMIT)));

  let filteredUsers = $derived(
    debouncedTerm
      ? users.filter((user) => {
          const term = debouncedTerm.toLowerCase();
          return (
            user.name.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            user.username.toLowerCase().includes(term)
          );
        })
      : users,
  );

  function openUser(id: string): void {
    navigate(`/users/${id}`);
  }

  function changePage(next: number): void {
    page = next;
  }
</script>

<div class="page-enter">
  <div class="page-header">
    <div>
      <h1>Пользователи</h1>
      <p class="page-subtitle">Управление администраторами системы.</p>
    </div>
    <div class="page-actions">
      <Button onclick={() => navigate('/users/create')}>
        <Icon name="plus" size={16} />
        Создать
      </Button>
    </div>
  </div>

  <Input
    label="Поиск"
    placeholder="Имя, email или логин…"
    bind:value={searchInput}
    oninput={() => applySearch(searchInput)}
    hint="Фильтрует только загруженную страницу."
  />

  {#if usersQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if usersQuery.isError && !usersQuery.data}
    <div class="form-error-banner">{getErrorMessage(usersQuery.error)}</div>
  {:else if filteredUsers.length === 0}
    {#if debouncedTerm !== ''}
      <div class="card">
        <EmptyState
          icon="✦"
          title="Ничего не найдено"
          hint={`По запросу «${debouncedTerm}» на этой странице ничего не найдено`}
        />
      </div>
    {:else}
      <div class="card">
        <EmptyState
          icon="✦"
          title="Пользователей пока нет"
          hint="Создайте первого администратора — он получит доступ к админ-панели."
        >
          {#snippet action()}
            <Button onclick={() => navigate('/users/create')}>Создать</Button>
          {/snippet}
        </EmptyState>
      </div>
    {/if}
  {:else}
    <div class="list-grid stagger">
      {#each filteredUsers as user}
        <div
          class="card card-hover list-item"
          role="button"
          tabindex="0"
          onclick={() => openUser(user.id)}
          onkeydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openUser(user.id);
            }
          }}
        >
          <div class="list-item-cover list-item-cover-placeholder">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div class="list-item-body">
            <div class="list-item-title">{user.name}</div>
            <div class="list-item-subtitle">{user.email}</div>
          </div>
          <div class="list-item-actions">
            <span class="badge badge-gold">{ROLE_LABELS[user.role]}</span>
            <span class="badge badge-neutral">{user.username}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <Pagination {page} {pageCount} onPageChange={changePage} />
</div>
