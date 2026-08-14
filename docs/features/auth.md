# Аутентификация

Как admin SPA логинится, хранит токены, восстанавливает сессию и защищает маршруты. Данные аутентификации приходят с backend API (JWT).

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
Sidebar «Выйти» ──logout()──▶ authControllerLogout({ refreshToken }, best-effort)
                                       └─ clearTokens(); user = null; navigate('/login')
```

## `auth.svelte.ts` — rune-store сессии

Модульные `$state`-переменные + публичный геттер `getAuthState()` (реактивный доступ для компонентов):

| Экспорт | Назначение |
|---------|------------|
| `AuthUser` | Тип сессионного профиля. **`AuthUser = UserResponse`** (сгенерированный тип — единый источник истины): `id`, `name`, `username`, `email`, `role` (`UserRole` из SDK). |
| `login(username, password)` | `authControllerSignIn({ body: { username, password } })` → `setTokens(accessToken, refreshToken)`. **Роль `user` блокируется при входе:** `user = null`, `clearTokens()`, бросок «У вас нет доступа к админ-панели» (показывается на Login). `navigate('/')` — только для admin/moderator. |
| `restoreSession()` | Если есть access-токен → `authControllerGetProfile({ throwOnError: true })`. **Роль `user` при восстановлении:** `clearTokens()`, `user = null`, `navigate('/login')` — обработка устаревшего токена пониженного/обычного пользователя. При ошибке — `clearTokens()` + `user = null`. В `finally` — `isReady = true`. |
| `logout()` | Читает сохранённый `refreshToken` (если токена нет — guard-clause: вызов на сервер пропускается), вызывает `authControllerLogout({ body: { refreshToken } })` **best-effort** — сетевая ошибка или уже недействительный токен не блокируют локальный выход. Затем `clearTokens()`, `user = null`, `navigate('/login')`. Refresh-токен отзывается на сервере (denylist) до очистки локальных токенов; access-токен остаётся технически валидным до истечения срока (≤30 мин). |
| `getAuthState()` | `{ user, isReady, isLoggingIn }` — реактивные геттеры. |

> ✅ **Политика ролей:** admin и moderator входят в панель; роль `user` **блокируется на входе** — ей в панели делать нечего. Домен `/users/*` — **только для admin** (у moderator бэкенд отвечает 403), поэтому ссылка в Sidebar и route-guard в `Router.svelte` скрывают/выбрасывают не-admin из `/users` (см. ниже).

> ✅ **Выход отзывает refresh-токен на сервере.** `POST /auth/logout` (спека 0.7.0) помещает refresh-токен в denylist до очистки локальных токенов. Вызов best-effort: при недоступности сети или 401 локальный выход всё равно завершается. Access-токен после выхода технически валиден до истечения срока (≤30 мин).

## Хранение токенов

- Ключ `localStorage`: **`slovo_admin_tokens`** — `{ accessToken?, refreshToken? }`.
- Хелперы в `client.ts`: `getAccessToken()`, `getRefreshToken()`, `setTokens(access, refresh)`, `clearTokens()`, `refreshTokens()`.
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
- **Домен `/users/*` — admin-only:** в `Router.svelte` `$derived` `forbidden` (`auth.isReady && isUsersPath && auth.user !== null && auth.user.role !== 'admin'`) гейтит рендер страницы, а `$effect` при `forbidden` → `navigate('/')`. Страница **не монтируется** для не-admin — он не получает ни рендера, ни запроса, на который бэкенд ответил бы 403. Неавторизованный посетитель (`auth.user === null`) в гейт не попадает: его ведёт на `/login` `ProtectedRoute`.
- **`main.ts`**: `onAuthExpired(() => navigate('/login'))` — центральная реакция на истекшую сессию.

## Страница Login

`src/lib/pages/Login.svelte`: поля «Логин»/«Пароль» (`Input`), кнопка `Button` disabled до заполнения обоих; вызов `login(trimmed(username), password)`. Кнопка в состоянии `loading` (`isLoggingIn`). Подпись бренда — «Вход в систему» (не «в админ-панель»). Ошибка «У вас нет доступа к админ-панели» (роль `user`) приходит из `login()` и показывается в `.form-error-banner` через `getErrorMessage`.

## Связанные документы

- [routing.md](./routing.md) — где guard подключается в таблице маршрутов
- [state.md](./state.md) — инвалидация кэшей после входа/выхода
- [../README.md](../README.md) — индекс раздела фронтенда
- REST-контракт и эндпоинты auth — [`../contracts/rest-api.md`](../contracts/rest-api.md)
