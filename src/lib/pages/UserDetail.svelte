<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    usersControllerChangePasswordMutation,
    usersControllerFindOneOptions,
    usersControllerRemoveMutation,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import { invalidateUsers } from '$lib/api/invalidate';
  import { getAuthState } from '$lib/auth/auth.svelte';
  import { getErrorMessage } from '$lib/utils/errors';
  import { trimmed } from '$lib/utils/strings';
  import { navigate } from '$lib/router/router.svelte';
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import Button from '$lib/components/Button.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Input from '$lib/components/Input.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let { params = {} }: { params?: Record<string, string> } = $props();
  let id = $derived(params.id ?? '');

  const auth = getAuthState();
  let currentUserId = $derived(auth.user?.id);

  const userQuery = createQuery(() => usersControllerFindOneOptions({ path: { id } }));
  const queryClient = useQueryClient();

  let user = $derived(userQuery.data);

  let isDeleteOpen = $state(false);
  let deleteError = $state('');

  let isPasswordOpen = $state(false);
  let passwordError = $state('');
  let newPassword = $state('');

  // Reset transient modal state whenever a modal closes so the next open
  // starts from a clean field.
  $effect(() => {
    if (!isPasswordOpen) {
      newPassword = '';
      passwordError = '';
    }
  });

  $effect(() => {
    if (!isDeleteOpen) deleteError = '';
  });

  const deleteMutation = createMutation(() => ({
    ...usersControllerRemoveMutation(),
    onSuccess: () => {
      invalidateUsers(queryClient);
      navigate('/users');
    },
    onError: (error) => {
      deleteError = getErrorMessage(error);
    },
  }));

  const passwordMutation = createMutation(() => ({
    ...usersControllerChangePasswordMutation(),
    onSuccess: () => {
      invalidateUsers(queryClient, id);
      isPasswordOpen = false;
      newPassword = '';
    },
    onError: (error) => {
      passwordError = getErrorMessage(error);
    },
  }));

  function handleChangePassword(): void {
    passwordError = '';
    const passwordValue = trimmed(newPassword);
    if (!passwordValue) {
      passwordError = 'Введите новый пароль.';
      return;
    }
    passwordMutation.mutate({ body: { password: passwordValue }, path: { id } });
  }
</script>

<div class="page-enter">
  <Breadcrumbs
    items={[
      { label: 'Пользователи', href: '/users' },
      { label: user?.name ?? 'Пользователь' },
    ]}
  />

  {#if userQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if user}
    <div class="page-header">
      <div>
        <h1>{user.name}</h1>
        <p class="page-subtitle">{user.email}</p>
      </div>
      <div class="page-actions">
        <Button variant="ghost" onclick={() => navigate(`/users/${id}/edit`)}>
          <Icon name="edit" size={16} />
          Редактировать
        </Button>
        <Button variant="ghost" onclick={() => (isPasswordOpen = true)}>
          Сменить пароль
        </Button>
        {#if id !== currentUserId}
          <Button variant="danger" onclick={() => (isDeleteOpen = true)}>
            <Icon name="trash" size={16} />
            Удалить
          </Button>
        {/if}
      </div>
    </div>

    <div class="detail-grid stagger">
      <div class="detail-stat">
        <div class="detail-stat-label">Имя</div>
        <div class="detail-stat-value">{user.name}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Username</div>
        <div class="detail-stat-value">{user.username}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Email</div>
        <div class="detail-stat-value">{user.email}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">ID</div>
        <div class="detail-stat-value">{user.id}</div>
      </div>
    </div>
  {:else}
    <div class="card">
      <EmptyState icon="⚠" title="Пользователь не найден" hint="Возможно, он был удалён." />
    </div>
  {/if}
</div>

<Modal
  title="Удалить пользователя?"
  open={isDeleteOpen}
  onClose={() => (isDeleteOpen = false)}
>
  <p>Пользователь «{user?.name ?? ''}» будет удалён без возможности восстановления.</p>
  {#if deleteError}
    <p class="field-error">{deleteError}</p>
  {/if}
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (isDeleteOpen = false)}>Отмена</Button>
    <Button
      variant="danger"
      loading={deleteMutation.isPending}
      onclick={() => deleteMutation.mutate({ path: { id } })}
    >
      Удалить
    </Button>
  {/snippet}
</Modal>

<Modal
  title="Смена пароля"
  open={isPasswordOpen}
  onClose={() => (isPasswordOpen = false)}
>
  <Input
    type="password"
    label="Новый пароль"
    bind:value={newPassword}
  />
  {#if passwordError}
    <p class="field-error">{passwordError}</p>
  {/if}
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (isPasswordOpen = false)}>Отмена</Button>
    <Button
      variant="primary"
      loading={passwordMutation.isPending}
      onclick={handleChangePassword}
    >
      Сохранить
    </Button>
  {/snippet}
</Modal>
