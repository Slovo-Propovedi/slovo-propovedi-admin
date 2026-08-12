# Фронтенд: аутентификация

Как admin SPA логинится, хранит токены, восстанавливает сессию и защищает маршруты. Backend-сторона JWT — в [`../../backend/modules/auth.md`](../../backend/modules/auth.md).

**Слой:** frontend (feature: auth)
**Файлы:** `src/lib/auth/auth.svelte.ts`, `src/lib/api/client.ts`, `src/lib/pages/Login.svelte`, `src/lib/layout/ProtectedRoute.svelte`
**Статус:** актуально

## Общая картина

```
Login.svelte ──login(user, pass)──▶ auth.svelte.ts
                                       ├─ authControllerSignIn → setTokens
                                       ├─ user = data.user; navigate('/')
                                       └─ (getAuthState() реактивно перечитывается)
main.ts ──await restoreSession()──▶ authControllerGetProfile (с refresh-retry)
client.ts ──401 (кроме /auth/*)──▶ refreshTokens() (single-flight, 1 retry)
                                       └─ не удалось → notifyAuthExpired() → navigate('/login')
ProtectedRoute ──isReady && !user──▶ navigate('/login')
```

## `auth.svelte.ts` — rune-store сессии

Модульные `$state`-переменные + публичный геттер `getAuthState()` (реактивный доступ для компонентов):

| Экспорт | Назначение |
|---------|------------|
| `login(username, password)` | `authControllerSignIn({ body: { username, password } })` → `setTokens(accessToken, refreshToken)`, `user = data.user ?? { username }`, `navigate('/')`. Флаг `isLoggingIn` на время вызова. |
| `restoreSession()` | Если есть access-токен → `authControllerGetProfile({ throwOnError: true })`; при ошибке `clearTokens()` + `user = null`. В `finally` — `isReady = true`. |
| `logout()` | `clearTokens()`, `user = null`, `navigate('/login')`. Бэкенд не имеет revoke-эндпоинта — выход клиентский (refresh-токен жив до истечения). |
| `getAuthState()` | `{ user, isReady, isLoggingIn }` — реактивные геттеры. |

> ⚠️ На сервере **нет эндпоинта отзыва токена** — `logout()` чистит только клиентское хранилище. Это документированное ограничение (комментарий в коде и долг в `../debt.md`).

## Хранение токенов

- Ключ `localStorage`: **`slovo_admin_tokens`** — `{ accessToken?, refreshToken? }`.
- Хелперы в `client.ts`: `getAccessToken()`, `setTokens(access, refresh)`, `clearTokens()`, `refreshTokens()`.
- `setTokens` сохраняет старый `refreshToken`, если новый не передан.

## `client.ts` — refresh-retry

- `API_BASE_URL = import.meta.env.VITE_API_BASE ?? 'https://api.slovo-propovedi.ru'`; `client.setConfig({ baseUrl, throwOnError: true, auth: () => getAccessToken() })`.
- **Request-интерцептор:** всегда ставит `Authorization: Bearer <token>`, когда токен есть (обход устаревшей OpenAPI-спеки без `security` на защищённых операциях).
- **Response-интерцептор:** на `401` (кроме `/auth/login`, `/auth/refresh`) выбрасывает помеченный error с серверным `message` (читается из тела).
- **`refreshTokens()`** — single-flight: все конкурирующие вызывающие делят один in-flight промис; при неудаче чистит токены.
- **`withAuthRetry`** оборачивает `client.request/get/post/patch/put/delete`:
  1. первый `401` → `refreshTokens()`, затем повтор исходного запроса (флаг `RETRIED`);
  2. повторный `401` (или неудачный refresh) → `notifyAuthExpired()` + бросок с серверным сообщением (fallback «Сессия истекла. Пожалуйста, войдите заново.»).
- **`onAuthExpired(listener)`** — подписка на потерю сессии; возвращает функцию отписки.

> ✅ Ровно **один** ретрай после refresh: второй 401 означает недействительный токен, и цикл прекращается (никаких бесконечных петель).

## Защита маршрутов

- **`Router.svelte`**: `/login` рендерится «голым» (без `Layout`); все остальные маршруты оборачиваются в `<ProtectedRoute><Layout>…</Layout></ProtectedRoute>` (см. [`routing.md`](./routing.md)).
- **`ProtectedRoute.svelte`**: пока `!isReady || !user` → `<LoadingScreen/>`; `$effect` при `isReady && !user` → `navigate('/login')`.
- **`main.ts`**: `onAuthExpired(() => navigate('/login'))` — центральная реакция на истекшую сессию.

## Страница Login

`src/lib/pages/Login.svelte`: поля «Логин»/«Пароль» (`Input`), кнопка `Button` disabled до заполнения обоих; вызов `login(trimmed(username), password)`. Кнопка в состоянии `loading` (`isLoggingIn`).

## Связанные документы

- [routing.md](./routing.md) — где guard подключается в таблице маршрутов
- [state.md](./state.md) — инвалидация кэшей после входа/выхода
- [../../backend/modules/auth.md](../../backend/modules/auth.md) — JWT на backend, AuthGuard
- [../../backend/modules/users.md](../../backend/modules/users.md) — admin-аккаунты (user)
- [../../contracts/rest-api.md](../../contracts/rest-api.md) — эндпоинты auth, базовая URL
- [../README.md](../README.md) — индекс раздела фронтенда
