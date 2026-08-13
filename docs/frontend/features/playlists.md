# Фронтенд: плейлисты (playlists)

Фронтовая часть домена playlists: список, деталь с reorder проповедей, создание/редактирование, форма с поисковым пикером. Backend-поведение (bulk-replace, reorder, сущности) — в [`../../backend/modules/playlist.md`](../../backend/modules/playlist.md).

**Слой:** frontend (feature: playlists)
**Файлы:** `src/lib/pages/{Playlists,PlaylistDetail,PlaylistCreate,PlaylistEdit}.svelte`, `src/lib/components/forms/PlaylistForm.svelte`
**Статус:** актуально

## Маршруты

| Паттерн | Страница | Данные |
|---------|----------|--------|
| `/playlists` | `Playlists.svelte` | `playlistControllerFindAllOptions()` |
| `/playlists/create` | `PlaylistCreate.svelte` | — (`PlaylistForm`, mode create) |
| `/playlists/:id` | `PlaylistDetail.svelte` | `playlistControllerFindOneOptions` + `playlistControllerRemoveMutation` + `reorderSermonsInPlaylistMutation` |
| `/playlists/:id/edit` | `PlaylistEdit.svelte` | `playlistControllerFindOneOptions` → `PlaylistForm`, mode edit |

## Список (`Playlists.svelte`)

`createQuery(playlistControllerFindAllOptions)` → карточки; клик → `/playlists/:id`. Состояния: загрузка — `LoadingSpinner`, пусто — `EmptyState`, ошибки — штатно.

## Деталь и reorder (`PlaylistDetail.svelte`)

- **Optimistic reorder** проповедей внутри плейлиста через `DndList` + `reorderSermonsInPlaylistMutation` (требует полный in-scope набор `sermonIds`). Паттерн — «теневая» копия `localSermons`, `sermonsSnapshot`, `isDragging`, откат на `onError` (см. [`../conventions.md`](../conventions.md) → Optimistic reorder).
- Ячейка строки: **«Проповедник · Книга глава:стихи»** — `artist` + `formatReference(book, chapter, verse)`.
- Удаление плейлиста: `Modal` confirm → `playlistControllerRemoveMutation` → `invalidatePlaylist(queryClient, id)` → `navigate('/playlists')`.

## Форма (`PlaylistForm.svelte`)

Props: `{ mode: 'create'|'edit', id?, initial?: PlaylistEntity }`.

| Поле | Контрол | Заметки |
|------|---------|---------|
| `title` | `Input` required | |
| `description` | `Textarea` | nullable → `null` при очистке |
| `artwork` | `CoverPicker` | |
| `selectedSermonIds` | поисковый `CheckboxList` | см. ниже |

**Поисковый пикер проповедей:** инпут «Поиск» → `debounce(300)` → `debouncedTerm` → `createQuery(() => sermonControllerFindAllOptions({ query: { search: debouncedTerm || undefined } }))`. **Выборка `selectedSermonIds` — единственный источник истины и персистит между поисками**: выбранная проповедь остаётся выбранной, даже если текущий поиск скрыл её из вида. Пустой термин → полная выборка без `search`.

Строки пикера рендерят **полную информацию о проповеди** через `item`-snippet `CheckboxList`: обложка (`sermon.artwork`, иначе плейсхолдер с первой буквой), название, подзаголовок «Проповедник · Книга глава:стихи» (`artist` + `formatReference(book, chapter, verse)`; без книги — только проповедник), бейджи медиа (аудио/youtube/текст по наличию URL). В `options` каждая строка несёт `{ value, label, data: sermon }` — `data` отдаёт сырую `SermonEntity` в snippet. `toggleSermon` — добавление/удаление id.

Мутации: `playlistControllerCreateMutation` / `playlistControllerUpdateMutation`. Edit-режим **намеренно не шлёт `sectionsIds`** (форма ими не управляет). `onSuccess` → `invalidatePlaylist(queryClient[, id])` → `navigate('/playlists' | /playlists/:id)`.

## Связанные документы

- [sermons.md](./sermons.md) — проповеди (в т.ч. тот же debounce-поиск)
- [sections.md](./sections.md) — разделы, ссылающиеся на плейлисты
- [files.md](./files.md) — обложка через `CoverPicker`
- [state.md](./state.md) — `invalidatePlaylist`, cross-entity инвалидация
- [ui-components.md](./ui-components.md) — DndList, CheckboxList, CoverPicker
- [../../backend/modules/playlist.md](../../backend/modules/playlist.md) — backend: bulk-replace, reorder, сущности
- [../../contracts/rest-api.md](../../contracts/rest-api.md) — карта эндпоинтов playlists
- [../conventions.md](../conventions.md) — optimistic reorder, null-vs-undefined
- [../README.md](../README.md) — индекс раздела фронтенда
