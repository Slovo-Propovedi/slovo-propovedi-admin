<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { usersControllerFindOneOptions } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import UserForm from '$lib/components/forms/UserForm.svelte';

  let { params = {} }: { params?: Record<string, string> } = $props();
  let id = $derived(params.id ?? '');

  const userQuery = createQuery(() => usersControllerFindOneOptions({ path: { id } }));
</script>

<div class="page-enter">
  <Breadcrumbs
    items={[
      { label: 'Пользователи', href: '/users' },
      { label: 'Редактирование' },
    ]}
  />
  <div class="page-header">
    <div>
      <h1>Редактирование пользователя</h1>
      <p class="page-subtitle">Пароль меняется отдельно на странице пользователя.</p>
    </div>
  </div>

  {#if userQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if userQuery.data}
    <UserForm mode="edit" {id} initial={userQuery.data} />
  {:else}
    <div class="card">
      <div class="card-body">Пользователь не найден.</div>
    </div>
  {/if}
</div>
