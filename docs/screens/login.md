# Экран «Вход» (login)

**Маршруты:**
- `/login` — страница входа

**Файлы:**
- `src/lib/pages/Login.svelte` — страница
- `src/lib/auth/auth.svelte.ts` — логика `login()`, session store
- `src/lib/router/Router.svelte` — маршрут (рендерится «нагишом», без `Layout`/`ProtectedRoute`)

## Страница входа

- **Маршрут:** `/login`, без параметров.
- **Что показывается:** центральная карточка с брендом («Слово проповеди», иконка `/assets/icon.png`, подпись «Вход в систему» — нейтральная формулировка, а не «в админ-панель»), двумя полями `<Input>` — «Имя пользователя» и «Пароль» — и кнопкой `Button` «Войти» (`block`, `loading={auth.isLoggingIn}`). Баннер `.form-error-banner` для ошибки авторизации.
- **Откуда данные:** данных не грузит; вызывает `login(trimmed(username), password)` из `auth.svelte.ts`. `username` обрезается через `trimmed()`, `password` — как есть. Кнопка заблокирована (`disabled`), пока не заполнены оба поля.
- **Компоненты:** `Button`, `Input`. Стили — `.login-page`, `.login-card`, `.login-brand`.
- **Навигация:**
  - успешный вход: `login()` сам выполняет `navigate('/')` → главная;
  - уже авторизованный пользователь: `$effect`, если `auth.isReady && auth.user` → `navigate('/')`;
  - `auth.isLoggingIn` переключает `Button` в `loading`.
- **Состояния:**
  - отправка: `Button` в состоянии `loading` (`auth.isLoggingIn`), повторная отправка защищена блокировкой кнопки;
  - ошибка: исключение из `login()` приводится через `getErrorMessage(error)` к читаемому русскому сообщению и показывается в `.form-error-banner`. Роль `user` блокируется в `login()` с сообщением «У вас нет доступа к админ-панели» (токены очищаются, сессия не создаётся).

## Как работает `login()` (auth.svelte.ts)

```ts
export async function login(username: string, password: string): Promise<void> {
  isLoggingIn = true;
  try {
    const { data } = await authControllerSignIn({ body: { username, password }, throwOnError: true });
    if (!data.accessToken) throw new Error('Сервер не вернул токен доступа');
    setTokens(data.accessToken, data.refreshToken);

    // A plain `user` has nothing to do in the admin panel; refuse the session
    // and keep no tokens behind.
    if (!data.user || data.user.role === 'user') {
      clearTokens();
      throw new Error('У вас нет доступа к админ-панели');
    }

    user = data.user;
    navigate('/');
  } finally {
    isLoggingIn = false;
  }
}
```

- `authControllerSignIn` (SDK, `POST /auth/login`) возвращает пару токенов; `setTokens` сохраняет её в `localStorage` (`slovo_admin_tokens`).
- **Роль `user` блокируется при входе:** `clearTokens()` + бросок «У вас нет доступа к админ-панели» — `user` не устанавливается, `navigate('/')` не вызывается.
- `user` устанавливается из `data.user` (`UserResponse`, тип `AuthUser`), затем `navigate('/')` — только для admin/moderator.
- `getAuthState()` возвращает реактивный `{ user, isReady, isLoggingIn }` — компоненты читают его для перерисовки.

> ✅ Выход (logout) — только клиентский: серверного revoke-эндпоинта нет. `logout()` очищает токены, сбрасывает `user` и делает `navigate('/login')` (см. [`../features/auth.md`](../features/auth.md)).

## Роутинг и guard

`/login` — единственный маршрут, рендерящийся без `Layout` и `ProtectedRoute`: в `Router.svelte` это ветка `{#if isLogin}`. Все остальные маршруты оборачиваются в `<ProtectedRoute><Layout>…`. Защита доступа, восстановление сессии (`restoreSession()`) и обработка истечения (`onAuthExpired` → `navigate('/login')`) — в [`../features/auth.md`](../features/auth.md).

## Связанные документы

- [README.md](./README.md) — индекс screens
- [../features/auth.md](../features/auth.md) — аутентификация: login, restore, refresh, guard
- [../features/routing.md](../features/routing.md) — кастомный роутер и ветка `/login`
- [../features/state.md](../features/state.md) — rune-store сессии
