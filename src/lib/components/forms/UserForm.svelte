<script lang="ts">
  import { createMutation as makeMutation, useQueryClient } from '@tanstack/svelte-query';
  import {
    usersControllerCreateMutation,
    usersControllerUpdateMutation,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import type {
    UpdateUserRequest,
    UserResponse,
    UserRole,
  } from '$lib/api/generated/types.gen';
  import { invalidateUsers } from '$lib/api/invalidate';
  import { getErrorMessage } from '$lib/utils/errors';
  import { ROLE_LABELS } from '$lib/utils/labels';
  import { trimmed } from '$lib/utils/strings';
  import { navigate } from '$lib/router/router.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import Select from '$lib/components/Select.svelte';

  interface Props {
    mode: 'create' | 'edit';
    id?: string;
    initial?: UserResponse;
  }

  let { mode, id = '', initial }: Props = $props();

  // The edit page mounts this form only after the record has loaded, so the
  // props stay stable for the form's lifetime. Reading them through closures
  // snapshots the values seen at mount time. The snapshot is typed at the
  // boundary so `role` is already `UserRole` downstream — no casts.
  function createFormSnapshot(): {
    name: string;
    email: string;
    username: string;
    role: UserRole;
    password: string;
  } {
    return {
      name: initial?.name ?? '',
      email: initial?.email ?? '',
      username: initial?.username ?? '',
      role: initial?.role ?? 'user',
      password: '',
    };
  }

  function isEditMode(): boolean {
    return mode === 'edit';
  }

  const formSnapshot = createFormSnapshot();
  const isEdit = isEditMode();

  let name = $state(formSnapshot.name);
  let email = $state(formSnapshot.email);
  let username = $state(formSnapshot.username);
  let role = $state<UserRole>(formSnapshot.role);
  let password = $state(formSnapshot.password);

  let submitError = $state('');

  // Least-privilege default: a new account starts as a plain user unless the
  // administrator chooses otherwise.
  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'admin', label: ROLE_LABELS.admin },
    { value: 'moderator', label: ROLE_LABELS.moderator },
    { value: 'user', label: ROLE_LABELS.user },
  ];

  const queryClient = useQueryClient();

  const createMutation = makeMutation(() => ({
    ...usersControllerCreateMutation(),
    onSuccess: () => {
      invalidateUsers(queryClient);
      navigate('/users');
    },
    onError: (error) => {
      submitError = getErrorMessage(error);
    },
  }));

  const updateMutation = makeMutation(() => ({
    ...usersControllerUpdateMutation(),
    onSuccess: () => {
      invalidateUsers(queryClient, id);
      navigate(`/users/${id}`);
    },
    onError: (error) => {
      submitError = getErrorMessage(error);
    },
  }));

  const isSubmitting = $derived(createMutation.isPending || updateMutation.isPending);

  function handleSubmit(): void {
    submitError = '';

    const nameValue = trimmed(name);
    const emailValue = trimmed(email);
    const usernameValue = trimmed(username);

    if (isEdit) {
      // Only changed fields are sent; omitted keys mean "no change" on PATCH.
      const payload: UpdateUserRequest = {};
      if (nameValue !== trimmed(initial?.name ?? '')) payload.name = nameValue;
      if (emailValue !== trimmed(initial?.email ?? '')) payload.email = emailValue;
      if (usernameValue !== trimmed(initial?.username ?? '')) payload.username = usernameValue;
      if (role !== (initial?.role ?? 'user')) payload.role = role;

      if (Object.keys(payload).length === 0) {
        navigate(`/users/${id}`);
        return;
      }
      updateMutation.mutate({ body: payload, path: { id } });
    } else {
      const passwordValue = trimmed(password);
      if (!nameValue || !emailValue || !usernameValue || !passwordValue) {
        submitError = 'Заполните все поля.';
        return;
      }
      createMutation.mutate({
        body: {
          name: nameValue,
          email: emailValue,
          username: usernameValue,
          password: passwordValue,
          role: role,
        },
      });
    }
  }
</script>

<form class="page-enter" onsubmit={(event) => {
  event.preventDefault();
  handleSubmit();
}}>
  {#if submitError}
    <div class="form-error-banner">{submitError}</div>
  {/if}

  <div class="card">
    <div class="card-header">
      <h2>Основное</h2>
    </div>
    <div class="card-body">
      <div class="form-grid">
        <Input label="Имя" bind:value={name} placeholder="Например: Иван Петров" required />
        <Input label="Email" type="email" bind:value={email} placeholder="admin@example.com" required />
        <Input
          label="Логин"
          bind:value={username}
          placeholder="Логин для входа в систему"
          hint="Необязательно совпадает с именем."
          required
        />
        <Select label="Роль" bind:value={role} options={roleOptions} />
        {#if !isEdit}
          <Input
            label="Пароль"
            type="password"
            bind:value={password}
            placeholder="Пароль"
            hint="Пользователь войдёт в систему с этим паролем."
            required
          />
        {/if}
      </div>
    </div>
  </div>

  <div class="form-actions">
    <Button type="button" variant="ghost" onclick={() => navigate(isEdit ? `/users/${id}` : '/users')}>
      Отмена
    </Button>
    <Button type="submit" loading={isSubmitting}>
      {isEdit ? 'Сохранить' : 'Создать'}
    </Button>
  </div>
</form>
