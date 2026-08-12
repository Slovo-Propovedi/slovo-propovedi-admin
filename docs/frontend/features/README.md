# docs/frontend/features — Функциональные подсистемы фронтенда

Здесь описываются внутренние механизмы и домены admin SPA (Svelte 5): аутентификация, роутер, состояние, загрузка файлов, домены проповедей/плейлистов/разделов и карта UI-компонентов.

**Слой:** frontend (admin SPA)
**Статус:** актуально

## Индекс

| Документ | О чём |
|----------|-------|
| [auth.md](./auth.md) | Аутентификация: `login`/`restoreSession`/`logout`, токены, refresh-retry, `ProtectedRoute` |
| [routing.md](./routing.md) | Кастомный history-роутер: `router.svelte.ts`, `Router.svelte`, таблица маршрутов |
| [state.md](./state.md) | Серверное состояние (`@tanstack/svelte-query`) и локальное (runes); cross-entity инвалидация |
| [sermons.md](./sermons.md) | Проповеди (фронт): список с поиском, `UploadSermon`, `SermonDetail/Edit`, `SermonForm`, мутации |
| [playlists.md](./playlists.md) | Плейлисты (фронт): список, `PlaylistDetail` (reorder), create/edit, `PlaylistForm` с пикером |
| [sections.md](./sections.md) | Разделы (фронт): список (reorder), `SectionDetail` (reorder), create/edit, `SectionForm` с enums |
| [files.md](./files.md) | Подсистема файлов: `upload.ts` (XHR), `FileUpload`, `CoverPicker`, `ImageLibraryModal`, allow-list |
| [ui-components.md](./ui-components.md) | Инвентарь UI-компонентов (таблица: component, файл, props, назначение, где используется) |

> ✅ Для каждого домена есть backend-аналог в `docs/backend/`: `../../backend/modules/sermon.md`, `playlist.md`, `section.md`, `minio.md`. Здесь — только фронтовая часть; backend-поведение — по ссылкам.

## Правило

При изменении фронтенд-механики или доменной логики обнови соответствующий `features/*.md` в том же PR. При изменении UI-примитива — добавь/поправь строку в `ui-components.md`.

## Связанные документы

- [../README.md](../README.md) — индекс раздела фронтенда
- [../architecture.md](../architecture.md) — стек, app shell, тема
- [../conventions.md](../conventions.md) — runes, null-vs-undefined, API-клиент
- [../../backend/modules/sermon.md](../../backend/modules/sermon.md) — backend-домен sermons
- [../../backend/modules/playlist.md](../../backend/modules/playlist.md) — backend-домен playlists
- [../../backend/modules/section.md](../../backend/modules/section.md) — backend-домен sections
- [../../backend/modules/minio.md](../../backend/modules/minio.md) — объектное хранилище (файлы)
- [../../contracts/rest-api.md](../../contracts/rest-api.md) — спецификация и конвейер кодогенерации
