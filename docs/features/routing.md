# Роутер (history)

Кастомный history-роутер админки. Роутер **самописный**, на Svelte runes, без сторонней библиотеки маршрутизации: history-based, без вложенных маршрутов, 404 → `/`, guard — обёртка `ProtectedRoute`.

**Слой:** frontend (feature: routing)
**Файлы:** `src/lib/router/router.svelte.ts`, `src/lib/router/Router.svelte`
**Статус:** актуально

## `router.svelte.ts` — чистая логика

| Экспорт | Поведение |
|---------|-----------|
| `currentPath` | модульная `$state`, инициализируется `window.location.pathname` |
| `navigate(path)` | `history.pushState` + `currentPath = path` + `scrollTo(0,0)`; no-op при том же пути |
| `useRoute()` | `{ get path(), navigate }` — реактивно через runes; любой компонент, читающий `route.path`, перерисовывается |
| `matchRoute(pattern, path)` | матчинг `/sections/:id/edit`-паттернов; split по `/`, `:x` захватывает `decodeURIComponent`; возвращает `Record<string,string> \| null` |
| слушатель `popstate` | синхронизирует `currentPath` на кнопках браузера назад/вперёд |

> ⚠️ `matchRoute` использует **порядок частей**, а не регулярку: количество сегментов паттерна и пути должно совпадать, иначе `null`. Поэтому в таблице маршрутов статические сегменты размещаются **до** динамических.

## `Router.svelte` — декларативная таблица

```svelte
const routes = [
  { pattern: '/login',            component: Login },
  { pattern: '/',                 component: Home },
  { pattern: '/sections/create',  component: SectionCreate },
  { pattern: '/sections/:id/edit',component: SectionEdit },
  { pattern: '/sections/:id',     component: SectionDetail },
  { pattern: '/sections',         component: Sections },
  { pattern: '/playlists/create', component: PlaylistCreate },
  { pattern: '/playlists/:id/edit',component: PlaylistEdit },
  { pattern: '/playlists/:id',    component: PlaylistDetail },
  { pattern: '/playlists',        component: Playlists },
  { pattern: '/sermons/upload',   component: UploadSermon },
  { pattern: '/sermons/:id/edit', component: SermonEdit },
  { pattern: '/sermons/:id',      component: SermonDetail },
  { pattern: '/sermons',          component: Sermons },
  { pattern: '/users/create',     component: UserCreate },
  { pattern: '/users/:id/edit',   component: UserEdit },
  { pattern: '/users/:id',        component: UserDetail },
  { pattern: '/users',            component: Users },
];
```

- `match` — `$derived`: первый совпавший паттерн побеждает.
- **404:** `$effect` — если `match === null` → `navigate('/')` (редирект на Home).
- **Auth guard:** `/login` рендерится «голым» (`<Login/>`); остальные — `<ProtectedRoute><Layout><component params={match.params}/></Layout></ProtectedRoute>`.

## Таблица маршрутов (сводно)

| Паттерн | Страница | Защита |
|---------|----------|--------|
| `/login` | `Login.svelte` | bare (без Layout) |
| `/` | `Home.svelte` | `ProtectedRoute` |
| `/sections/create` | `SectionCreate.svelte` | `ProtectedRoute` |
| `/sections/:id/edit` | `SectionEdit.svelte` | `ProtectedRoute` |
| `/sections/:id` | `SectionDetail.svelte` | `ProtectedRoute` |
| `/sections` | `Sections.svelte` | `ProtectedRoute` |
| `/playlists/create` | `PlaylistCreate.svelte` | `ProtectedRoute` |
| `/playlists/:id/edit` | `PlaylistEdit.svelte` | `ProtectedRoute` |
| `/playlists/:id` | `PlaylistDetail.svelte` | `ProtectedRoute` |
| `/playlists` | `Playlists.svelte` | `ProtectedRoute` |
| `/sermons/upload` | `UploadSermon.svelte` | `ProtectedRoute` |
| `/sermons/:id/edit` | `SermonEdit.svelte` | `ProtectedRoute` |
| `/sermons/:id` | `SermonDetail.svelte` | `ProtectedRoute` |
| `/sermons` | `Sermons.svelte` | `ProtectedRoute` |
| `/users/create` | `UserCreate.svelte` | `ProtectedRoute` |
| `/users/:id/edit` | `UserEdit.svelte` | `ProtectedRoute` |
| `/users/:id` | `UserDetail.svelte` | `ProtectedRoute` |
| `/users` | `Users.svelte` | `ProtectedRoute` |

> ✅ Порядок имеет значение: `/sections/create` идёт до `/sections/:id`, иначе `:id` захватил бы `create`. Аналогично `/sermons/upload` до `/sermons/:id`, `/users/create` до `/users/:id`, и т.д. (статичные сегменты — первыми).

## Взаимодействие с другими подсистемами

- **Навигация из кода:** компоненты зовут `navigate(...)` из `router.svelte.ts` (Breadcrumbs, формы, Sidebar, Home). Ссылки `<a>` перехватывают `onclick` → `navigate` (SPA-переходы без релоада).
- **Защита маршрутов:** `ProtectedRoute` — guard по сессии (см. [`auth.md`](./auth.md)); при истёкшей сессии `main.ts` через `onAuthExpired` отправляет на `/login`.
- **Рендер страниц:** страницам передаётся `params` из `match.params` (например, `id` для `/sections/:id`).

## Связанные документы

- [auth.md](./auth.md) — `ProtectedRoute`, редиректы на `/login`
- [state.md](./state.md) — как страницы грузят данные по `params.id`
- [../architecture.md](../architecture.md) — app shell: main.ts → App.svelte → Router
- [../conventions.md](../conventions.md) — Svelte runes (`$derived`, `$effect`)
- [sections.md](./sections.md) — пример страниц с `:id` и `:id/edit`
- [../README.md](../README.md) — индекс раздела фронтенда
