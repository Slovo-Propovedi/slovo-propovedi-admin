# docs/features — Функциональные подсистемы

Здесь описываются внутренние механизмы и домены admin SPA (Svelte 5): аутентификация, роутер, состояние, загрузка файлов, домены проповедей/плейлистов/разделов/пользователей и карта UI-компонентов.

**Слой:** frontend (admin SPA)
**Статус:** актуально

## Индекс

| Документ | О чём |
|----------|-------|
| [auth.md](./auth.md) | Аутентификация: `login`/`restoreSession`/`logout`, токены, refresh-retry, `ProtectedRoute` |
| [routing.md](./routing.md) | Кастомный history-роутер: `router.svelte.ts`, `Router.svelte`, таблица маршрутов |
| [state.md](./state.md) | Серверное состояние (`@tanstack/svelte-query`) и локальное (runes); cross-entity инвалидация |
| [sermons.md](./sermons.md) | Проповеди: список с поиском, `UploadSermon`, `SermonDetail/Edit`, `SermonForm`, мутации |
| [playlists.md](./playlists.md) | Плейлисты: список, `PlaylistDetail` (reorder), create/edit, `PlaylistForm` с пикером |
| [sections.md](./sections.md) | Разделы: список (reorder), `SectionDetail` (reorder), create/edit, `SectionForm` с enums |
| [users.md](./users.md) | Пользователи: список с клиентским поиском, `UserDetail` (смена пароля), create/edit, `UserForm` |
| [files.md](./files.md) | Подсистема файлов: `upload.ts` (XHR), `FileUpload`, `CoverPicker`, `ImageLibraryModal`, allow-list |
| [ui-components.md](./ui-components.md) | Инвентарь UI-компонентов (таблица: component, файл, props, назначение, где используется) |

> ✅ Здесь — только фронтовая часть; поведение backend — в его собственном репозитории.

## Правило

При изменении механики или доменной логики обнови соответствующий `features/*.md` в том же PR. При изменении UI-примитива — добавь/поправь строку в `ui-components.md`.

## Связанные документы

- [../README.md](../README.md) — индекс раздела фронтенда
- [../architecture.md](../architecture.md) — стек, app shell, тема
- [../conventions.md](../conventions.md) — runes, null-vs-undefined, API-клиент
- REST-контракт и конвейер кодогенерации — [`../contracts/rest-api.md`](../contracts/rest-api.md)
