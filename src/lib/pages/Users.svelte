<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { usersControllerFindAllOptions } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import { getErrorMessage } from '$lib/utils/errors';
  import { navigate } from '$lib/router/router.svelte';
  import { debounce } from '$lib/utils/debounce';
  import Button from '$lib/components/Button.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Input from '$lib/components/Input.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  let searchInput = $state('');
  let debouncedTerm = $state('');

  // The list is small, so filtering happens client-side after a short pause;
  // an empty term shows the full unfiltered list on first load.
  const applySearch = debounce((value: string) => {
    debouncedTerm = value;
  }, 300);

  const usersQuery = createQuery(() => usersControllerFindAllOptions());

  let users = $derived(usersQuery.data ?? []);
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
  />

  {#if usersQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if usersQuery.isError && !usersQuery.data}
    <div class="form-error-banner">{getErrorMessage(usersQuery.error)}</div>
  {:else if filteredUsers.length === 0}
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
            <span class="badge badge-neutral">{user.username}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
