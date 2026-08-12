# docs/frontend — Документация фронтенда (admin SPA)

Раздел описывает фронтенд админ-панели «Слово.Проповеди» — **Svelte 5 + Vite SPA** в `frontend/web-app/`. Здесь фиксируется «почему» и «где что живёт»: архитектура, соглашения, внутренние механизмы (роутер, состояние, загрузка файлов) и карта UI-компонентов. Машино-проверяемые правила (eslint, prettier, `svelte-check`, строгий TypeScript) не дублируются — они уже настроены и обоснованы в [`architecture.md`](./architecture.md).

**Слой:** frontend (admin SPA)
**Статус:** актуально

## Как устроен раздел

| Файл | Назначение |
|------|------------|
| [`architecture.md`](./architecture.md) | Стек, сборка/Docker, app shell, тема, раскладка `src/` |
| [`conventions.md`](./conventions.md) | Соглашения: runes, null-vs-undefined, optimistic reorder, API-клиент |
| [`features/README.md`](./features/README.md) | Индекс функциональных подсистем фронтенда |
| [`features/auth.md`](./features/auth.md) | Аутентификация: login, restore, refresh, guard |
| [`features/routing.md`](./features/routing.md) | Кастомный history-роутер |
| [`features/state.md`](./features/state.md) | Серверное состояние (@tanstack/svelte-query) и локальное (runes) |
| [`features/sermons.md`](./features/sermons.md) | Проповеди: список, поиск, форма, мутации |
| [`features/playlists.md`](./features/playlists.md) | Плейлисты: список, деталь, reorder, форма с пикером |
| [`features/sections.md`](./features/sections.md) | Разделы: список, деталь, reorder, форма с enums |
| [`features/files.md`](./features/files.md) | Подсистема загрузки файлов (upload.ts, FileUpload, CoverPicker) |
| [`features/ui-components.md`](./features/ui-components.md) | Инвентарь UI-компонентов (примитивы, layout, файл, формы) |

> ⚠️ `screens/` (описание страниц по одной) — **отдельный раздел** `docs/frontend/screens/`, ведётся параллельно. Здесь ссылки на страницы даются кратко, внутри соответствующих `features/*.md`.

## Фронтенд — файлы и папки

Раскладка `frontend/web-app/src/` (подробно — [`architecture.md`](./architecture.md)):

| Путь (от `src/`) | Назначение |
|------------------|------------|
| `main.ts` | Точка входа: импорт `app.css`, `onAuthExpired`, `await restoreSession()`, `mount` |
| `App.svelte` | `QueryClient` (настройки) + `<QueryClientProvider>` → `<Router/>` |
| `app.css` | Единственный глобальный стиль, design tokens (`:root`), секции |
| `lib/api/` | `client.ts` (baseUrl, токены, 401-refresh), `upload.ts` (XHR), `invalidate.ts`, `generated/` (SDK @hey-api) |
| `lib/router/` | Кастомный history-роутер: `router.svelte.ts` + `Router.svelte` |
| `lib/auth/` | `auth.svelte.ts` — rune-store сессии |
| `lib/layout/` | `Layout.svelte`, `Sidebar.svelte`, `ProtectedRoute.svelte` |
| `lib/pages/` | Страницы (`Login`, `Home`, `Sermons*`, `Playlist*`, `Section*`, `UploadSermon`) |
| `lib/components/` | UI-примитивы + переиспользуемые компоненты; `forms/` — формы |
| `lib/utils/` | `labels.ts`, `strings.ts`, `debounce.ts`, `arrayOrder.ts`, `errors.ts` |

> ✅ Все UI-тексты — на русском. Тема — dark-only (тёмный фон + золотой акцент), без переключателя светлой темы.

## ЖЁСТКИЕ правила для агентов (адаптация из корневого `docs/README.md`)

1. **Перед реализацией** фичи/фикса во фронтенде прочитай соответствующий документ `docs/frontend/`:
   - механизм (роутер, состояние, загрузка файлов) → `features/<механизм>.md`;
   - домен (sermons/playlists/sections) → `features/<домен>.md`;
   - общие принципы → `architecture.md` и `conventions.md`.
   Отсутствует документ? Прочитай код и создай/дополни документ (правило 4).
2. **При изменении кода** обнови затронутые `docs/frontend/**` **в том же PR/коммите**. Изменение кода без обновления документации — неполное.
3. **Срезанный угол** (TODO, hack) → запись в корневой `../debt.md` в том же PR.
4. **Сгенерированный код** (`src/lib/api/generated/`) — не редактировать руками; правится только через регенерацию (`npm run gen:api`). Обошёл патч или сгенерировал вручную — это нарушение конвенции (см. [`conventions.md`](./conventions.md)).
5. **Никакого клиентского zod-валидирования форм** — валидацию выполняет backend (strictObject). Формы используют HTML `required`/`min` + семантику null/undefined (см. [`conventions.md`](./conventions.md)).

## Связанные документы

- [../README.md](../README.md) — корневая карта документации и правила для агентов
- [../architecture.md](../architecture.md) — слои монорепозитория, стек, runtime-топология
- [../conventions.md](../conventions.md) — OpenAPI-first workflow, git, DoD
- [../contracts/rest-api.md](../contracts/rest-api.md) — общая спецификация и конвейер кодогенерации
- [./features/sermons.md](./features/sermons.md) — домен sermons (frontend)
- [./features/playlists.md](./features/playlists.md) — домен playlists (frontend)
- [../debt.md](../debt.md) — технический долг
