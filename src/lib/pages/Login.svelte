<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import { getAuthState, login } from '$lib/auth/auth.svelte';
  import { navigate } from '$lib/router/router.svelte';
  import { getErrorMessage } from '$lib/utils/errors';

  const auth = getAuthState();

  let email = $state('');
  let password = $state('');
  let error = $state('');

  $effect(() => {
    if (auth.isReady && auth.user) navigate('/');
  });

  async function handleSubmit(): Promise<void> {
    error = '';
    try {
      await login(email.trim(), password);
    } catch (err) {
      error = getErrorMessage(err);
    }
  }
</script>

<div class="login-page">
  <div class="card login-card page-enter">
    <div class="login-brand">
      <img src="/assets/icon.png" alt="" />
      <h1>Слово проповеди</h1>
      <p>Вход в админ-панель</p>
    </div>

    {#if error}
      <div class="form-error-banner">{error}</div>
    {/if}

    <form
      onsubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <Input
        label="Электронная почта"
        type="email"
        bind:value={email}
        placeholder="you@example.com"
        autocomplete="email"
        required
      />
      <Input
        label="Пароль"
        type="password"
        bind:value={password}
        placeholder="••••••••"
        autocomplete="current-password"
        required
      />
      <Button type="submit" block loading={auth.isLoggingIn} disabled={!email.trim() || !password}>
        Войти
      </Button>
    </form>
  </div>
</div>
