<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import UserForm from '$lib/components/forms/UserForm.svelte';
</script>

<div class="page-enter">
  <Breadcrumbs
    items={[
      { label: 'Пользователи', href: '/users' },
      { label: 'Создать' },
    ]}
  />
  <div class="page-header">
    <div>
      <h1>Новый пользователь</h1>
      <p class="page-subtitle">Роль определяет доступ: администратор и модератор входят в панель, обычный пользователь — нет.</p>
    </div>
  </div>
  <UserForm mode="create" />
</div>
