# Фронтенд: архитектура (почему так)

Этот документ объясняет устройство admin-фронтенда «Слово.Проповеди» — **Svelte 5 SPA** на Vite. Код — истина; здесь фиксируются мотивация и раскладка, а не дублирование правил линтеров/тайпчекеров. За командами и OpenAPI-first workflow — [`conventions.md`](./conventions.md).

**Слой:** frontend (admin SPA)
**Статус:** актуально

## Стек и зависимости

| Назначение | Технология | Версия (package.json) | Примечание |
|------------|------------|-----------------------|------------|
| Framework | Svelte 5 (runes) | `svelte ^5.56.8` | runes включены в `svelte.config.js` (`compilerOptions.runes: true`) |
| Сборка/дев-сервер | Vite | `vite ^7.2.2` | плагин `@sveltejs/vite-plugin-svelte` |
| Серверное состояние | `@tanstack/svelte-query` | `^6.1.38` | `createQuery` / `createMutation` |
| API-клиент | `@hey-api/client-fetch` | `^0.13.1` | сгенерированный SDK (`generated/`) |
| Drag-and-drop | `svelte-dnd-action` | `^0.9.78` | обёртка `DndList.svelte` |
| Валидация схем на клиенте | `zod` | `^4.4.3` | только в сгенерированных request/response-валидаторах; **не** для форм |
| Типы/проверка | TypeScript | `^5.6.0` | strict, `noUncheckedIndexedAccess` |
| `svelte-check` | devDependency | `^4.0.0` | скрипт `check` |
| Генерация SDK | `@hey-api/openapi-ts` | `^0.99.0` | скрипт `gen:api` |

> ⚠️ Zod на клиенте появляется только из сгенерированного кода (`zod.gen.ts`, request/response-валидаторы SDK). Вручную форм zod не валидирует — это осознанное решение (см. [`conventions.md`](./conventions.md)).

## Сборка и Docker

**Локальная разработка** (`vite.config.ts`):

- alias `$lib` → `./src/lib`;
- dev-сервер: `host: true`, порт **4321**;
- proxy `/api` → `http://localhost:3000` с удалением префикса (`rewrite`); используется через `VITE_API_BASE=/api` в `.env.development`.

```bash
cd frontend/web-app
npm install
npm run dev        # vite → http://localhost:4321, /api → localhost:3000
npm run build      # vite build → dist/
npm run preview    # vite preview (локальная проверка собранного бандла)
npm run check      # svelte-check (типы по Svelte 5)
npm run gen:api    # openapi-ts + патчи zod (см. contracts/rest-api.md)
```

> ✅ **Base URL в проде:** `client.ts` использует `VITE_API_BASE` либо по умолчанию `https://api.slovo-propovedi.ru`. SPA в проде обращается к API **напрямую** (без обратного прокси) — старый nginx `/api`-прокси удалён (см. комментарий в `nginx.conf`).

**Контейнер** (`Dockerfile`) — многостадийная сборка:

```
node:22-alpine (build: npm ci → npm run build, NODE_OPTIONS --max-old-space-size=384)
        ↓ dist/
nginx:alpine (serve, unprivileged USER 101:101)
   EXPOSE 8080, COPY nginx.main.conf + nginx.conf
```

nginx-конфиг: SPA-fallback `try_files $uri $uri/ /index.html`, кэширование `/assets/` (`immutable, 1y`), security-заголовки (CSP и др.), gzip. Фронтенд-контейнер в локальный `docker-compose.yml` **не входит** — деплоится отдельно (ansible-playbook).

## App shell (порядок старта)

```
main.ts
  ├─ import './app.css'                          # единственный глобальный стиль
  ├─ onAuthExpired(() => navigate('/login'))      # сессия истекла → логин
  ├─ await restoreSession()                       # восстановить профиль из токенов
  └─ mount(App, { target: #app })

App.svelte
  └─ new QueryClient({ staleTime: 30s, refetchOnWindowFocus: false, retry: 1 })
  └─ <QueryClientProvider client>
        └─ <Router/>                              # маршрутизация (features/routing.md)
```

- **`main.ts`** — блокирующий `await restoreSession()` перед `mount`: пока профиль не восстановлен, `ProtectedRoute` показывает `LoadingScreen` и не рендерит защищённые страницы.
- **`App.svelte`** — настройки `QueryClient` живут только здесь; `Router` обёрнут в `QueryClientProvider` (подробнее о настройках — [`features/state.md`](./features/state.md)).
- **`Layout.svelte`** (`src/lib/layout/`) — двухпанельный каркас: `<Sidebar/>` + `<main class="app-main">{@render children()}</main>`.
- **`Sidebar.svelte`** — логотип (`/assets/icon.png`), пункты навигации (`Главная /`, `Разделы /sections`, `Плейлисты /playlists`, `Проповеди /sermons`, `Загрузить проповедь /sermons/upload`); активный пункт — по самому специфичному префиксу; футер: аватар-инициалы + имя пользователя + кнопка «Выйти».
- **`ProtectedRoute.svelte`** — guard: до `isReady && user` рендерит `LoadingScreen`; при готовом-но-не-авторизованном состоянии `$effect` отправляет на `/login` (подробно — [`features/auth.md`](./features/auth.md)).

## Роутер (обзор)

Роутер **самописный**, history-based, без сторонних библиотек. Высокоуровнево:

- `src/lib/router/router.svelte.ts` — модульная реактивная `currentPath`, `navigate()`, `useRoute()`, `matchRoute()`, слушатель `popstate`.
- `src/lib/router/Router.svelte` — декларативная таблица маршрутов, `$derived`-матчинг, 404→`/`, guard-обёртка.

Детально (включая полную таблицу маршрутов) — [`features/routing.md`](./features/routing.md).

## Серверное состояние (обзор)

- `@tanstack/svelte-query`: страницы создают `createQuery(() => operationOptions(...))` и `createMutation(() => ({ ...operationMutation(), onSuccess, onError }))`.
- Инвалидация кэша — через `src/lib/api/invalidate.ts` (`invalidateSermon/Playlist/Section/Files`).
- Локальное состояние — исключительно runes (`$state`, `$derived`, `$effect`); `svelte/store` не используется.

Детально (паттерн, настройки QueryClient, cross-entity инвалидация) — [`features/state.md`](./features/state.md).

## Тема (app.css)

Единственный глобальный стиль — `src/app.css` (импортируется в `main.ts`; **отдельных `<style>` в компонентах нет**). Dark-only, без переключателя. Design tokens в `:root` (`app.css:6-38`):

| Группа | Токены |
|--------|--------|
| Фон/поверхности | `--bg #0d0d12`, `--bg-soft #101018`, `--surface #16161e`, `--surface-2`, `--surface-3` |
| Границы | `--border`, `--border-soft` |
| Текст | `--text #f0ebe0`, `--text-secondary`, `--text-faint` |
| Акцент (gold) | `--gold #c9a961`, `--gold-bright #e0c084`, `--gold-deep #a8874a` |
| Служебные | `--danger #c95a5a`, `--success #6abf8e` |
| Шрифты | `--font-display: 'Cormorant Garamond'`, `--font-sans: 'DM Sans'` |
| Тени | `--shadow-card`, `--shadow-card-hover`, `--shadow-gold`, `--shadow-gold-hover` |
| Ритм | `--radius 10px`, `--radius-lg 16px`, `--sidebar-width 260px` |

Секции CSS: base, motion (`fade-in-up`/`fade-in`/`pulse-soft`, `.stagger`), layout (`.app-layout`, `.app-main`), sidebar, cards, buttons, forms, file upload, cover/library, list rows, DnD, badges, breadcrumbs, empty state, spinner, modal, login, detail, home stats, player, toast. Брейкпоинты 900px и 640px; уважает `prefers-reduced-motion`.

## Раскладка src/

```
frontend/web-app/src/
├── main.ts                    # точка входа: app.css, onAuthExpired, restoreSession, mount
├── App.svelte                 # QueryClient + QueryClientProvider → Router
├── app.css                    # единственный глобальный стиль + design tokens
├── vite-env.d.ts
└── lib/
    ├── api/
    │   ├── client.ts          # base URL, токены (localStorage), 401-refresh-retry
    │   ├── upload.ts          # XHR-загрузка файлов (единственный не-SDK endpoint)
    │   ├── invalidate.ts      # cross-entity инвалидация query-кэшей
    │   ├── generated/         # @hey-api кодогенерация (не редактировать)
    │   └── index.ts           # реэкспорт наружу
    ├── router/
    │   ├── router.svelte.ts   # history-router: currentPath/navigate/useRoute/matchRoute
    │   └── Router.svelte      # декларативная таблица маршрутов + guard
    ├── auth/
    │   └── auth.svelte.ts     # rune-store сессии: login/restoreSession/logout
    ├── layout/
    │   ├── Layout.svelte      # Sidebar + <main>
    │   ├── Sidebar.svelte     # навигация, пользователь, «Выйти»
    │   └── ProtectedRoute.svelte  # guard по isReady && user
    ├── pages/                 # страницы (Login, Home, Sermons*, Playlist*, Section*, UploadSermon)
    ├── components/
    │   ├── forms/             # SermonForm, SectionForm, PlaylistForm
    │   └── …UI-примитивы и компоненты (см. features/ui-components.md)
    └── utils/
        ├── labels.ts          # русские лейблы, formatReference/parseVerse/formatVerse
        ├── strings.ts         # trimmed/fieldText
        ├── debounce.ts        # trailing debounce
        ├── arrayOrder.ts      # hasOrderChanged (skip no-op reorder)
        └── errors.ts          # getErrorMessage → русское сообщение
```

## Связанные документы

- [README.md](./README.md) — индекс раздела и правила для агентов
- [conventions.md](./conventions.md) — runes, null-vs-undefined, API-клиент
- [features/routing.md](./features/routing.md) — кастомный history-роутер
- [features/state.md](./features/state.md) — серверное состояние и инвалидация
- [features/ui-components.md](./features/ui-components.md) — инвентарь UI-компонентов
- [../contracts/rest-api.md](../contracts/rest-api.md) — спецификация, конвейер кодогенерации, base URL
- [../architecture.md](../architecture.md) — слои монорепозитория и runtime-топология
- [./features/sermons.md](./features/sermons.md) — домен sermons
- [./features/playlists.md](./features/playlists.md) — домен playlists
